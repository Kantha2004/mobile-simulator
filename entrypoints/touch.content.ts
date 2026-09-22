// entrypoints/touch.content.ts - Injected into simulator iframes for Chrome DevTools-grade mobile touch emulation

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  matchAboutBlank: true,
  runAt: 'document_start',
  main() {


  // Only run inside iframes (the simulator viewport), never on top-level pages
  if (window === window.top) return;

  let isTouchEnabled = true;
  let isDragging = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocityY = 0;
  let velocityX = 0;
  let momentumAnimId = null;

  // Double-tap tracking
  let lastTapTime = 0;
  let lastTapX = 0;
  let lastTapY = 0;

  // Mouse arrow cursor toggling on top of touch ball
  let showMouseArrow = true;

  // Active target being touched/dragged
  let currentTouchTarget = null;

  // DOM elements
  let cursorEl = null;
  let shieldEl = null;

  // Mobile Touch Scrollbars (Overlay Indicator)
  let vScrollIndicator = null;
  let hScrollIndicator = null;
  let scrollFadeTimer = null;

  // 1. Inject Styles: Mobile Scrollbars + Cursor Controls in Touch Mode
  function injectStyles() {
    if (document.getElementById('phone-sim-injected-styles')) return;
    const style = document.createElement('style');
    style.id = 'phone-sim-injected-styles';
    style.textContent = `
      /* Touch Mode: Cursor behavior based on show-mouse-arrow toggle */
      html.phone-sim-touch-active.hide-mouse-arrow,
      html.phone-sim-touch-active.hide-mouse-arrow * {
        cursor: none !important;
      }
      html.phone-sim-touch-active.show-mouse-arrow,
      html.phone-sim-touch-active.show-mouse-arrow * {
        cursor: default !important;
      }

      /* Mobile Touch Device Scrollbars: Hide chunky desktop scrollbars on window */
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        width: 0px !important;
        height: 0px !important;
        display: none !important;
      }
      html, body {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }

      /* Nested scrollable areas: sleek 3.5px mobile rounded pills */
      *::-webkit-scrollbar {
        width: 3.5px !important;
        height: 3.5px !important;
        background-color: transparent !important;
      }
      *::-webkit-scrollbar-track {
        background-color: transparent !important;
      }
      *::-webkit-scrollbar-corner {
        background-color: transparent !important;
      }
      *::-webkit-scrollbar-button {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      *::-webkit-scrollbar-thumb {
        background-color: rgba(120, 120, 128, 0.45) !important;
        border-radius: 9999px !important;
      }
      *::-webkit-scrollbar-thumb:hover {
        background-color: rgba(120, 120, 128, 0.8) !important;
      }
    `;
    const target = document.head || document.documentElement;
    if (target) target.appendChild(style);

    applyTouchAndArrowState();
  }

  function applyTouchAndArrowState() {
    if (shieldEl) {
      shieldEl.style.pointerEvents = isTouchEnabled ? 'auto' : 'none';
      shieldEl.style.cursor = showMouseArrow ? 'default' : 'none';
    }
    if (cursorEl && !isTouchEnabled) {
      cursorEl.style.display = 'none';
    }
    const root = document.documentElement;
    if (root) {
      root.classList.toggle('phone-sim-touch-active', isTouchEnabled);
      root.classList.toggle('show-mouse-arrow', isTouchEnabled && showMouseArrow);
      root.classList.toggle('hide-mouse-arrow', isTouchEnabled && !showMouseArrow);
    }
  }

  // 2. Create Touch Shield to neutralize unclicked desktop hover
  function createTouchShield() {
    if (shieldEl || !document.body) return;

    shieldEl = document.createElement('div');
    shieldEl.id = 'phone-sim-touch-shield';
    shieldEl.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483640 !important;
      background: transparent !important;
      cursor: ${showMouseArrow ? 'default' : 'none'} !important;
      pointer-events: ${isTouchEnabled ? 'auto' : 'none'} !important;
      touch-action: none !important;
    `;

    shieldEl.addEventListener('mousedown', onShieldMouseDown);
    shieldEl.addEventListener('mousemove', onShieldMouseMove);
    shieldEl.addEventListener('wheel', onShieldWheel, { passive: true });
    document.body.appendChild(shieldEl);
  }

  // 3. Create Clean Translucent White Touch Ball
  function createTouchCursor() {
    if (cursorEl || !document.body) return;

    cursorEl = document.createElement('div');
    cursorEl.id = 'phone-sim-touch-pointer';
    cursorEl.style.cssText = `
      position: fixed !important;
      width: 26px !important;
      height: 26px !important;
      border-radius: 50% !important;
      background: rgba(255, 255, 255, 0.22) !important;
      border: 1.5px solid rgba(255, 255, 255, 0.85) !important;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.25) !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      transform: translate(-50%, -50%) !important;
      display: none;
      transition: width 0.08s ease, height 0.08s ease, background-color 0.08s ease !important;
    `;
    document.body.appendChild(cursorEl);
  }

  // 4. Create Overlay Scrollbars
  function createOverlayScrollbars() {
    if (!document.body) return;

    if (!vScrollIndicator) {
      vScrollIndicator = document.createElement('div');
      vScrollIndicator.id = 'phone-sim-v-scrollbar';
      vScrollIndicator.style.cssText = `
        position: fixed !important;
        right: 2.5px !important;
        width: 3.5px !important;
        background: rgba(120, 120, 128, 0.65) !important;
        box-shadow: 0 0 1px rgba(0, 0, 0, 0.45) !important;
        border-radius: 9999px !important;
        z-index: 2147483646 !important;
        pointer-events: none !important;
        opacity: 0;
        transition: opacity 0.25s ease !important;
        transform: translateZ(0);
      `;
      document.body.appendChild(vScrollIndicator);
    }

    if (!hScrollIndicator) {
      hScrollIndicator = document.createElement('div');
      hScrollIndicator.id = 'phone-sim-h-scrollbar';
      hScrollIndicator.style.cssText = `
        position: fixed !important;
        bottom: 2.5px !important;
        height: 3.5px !important;
        background: rgba(120, 120, 128, 0.65) !important;
        box-shadow: 0 0 1px rgba(0, 0, 0, 0.45) !important;
        border-radius: 9999px !important;
        z-index: 2147483646 !important;
        pointer-events: none !important;
        opacity: 0;
        transition: opacity 0.25s ease !important;
        transform: translateZ(0);
      `;
      document.body.appendChild(hScrollIndicator);
    }
  }

  function updateScrollbars(flash = false) {
    if (!vScrollIndicator || !hScrollIndicator) createOverlayScrollbars();
    if (!vScrollIndicator || !hScrollIndicator) return;

    const doc = document.documentElement;
    const body = document.body;
    if (!doc && !body) return;

    const scrollTop = window.scrollY || (doc && doc.scrollTop) || (body && body.scrollTop) || 0;
    const scrollLeft = window.scrollX || (doc && doc.scrollLeft) || (body && body.scrollLeft) || 0;
    const scrollHeight = Math.max(doc ? doc.scrollHeight : 0, body ? body.scrollHeight : 0);
    const scrollWidth = Math.max(doc ? doc.scrollWidth : 0, body ? body.scrollWidth : 0);
    const clientHeight = window.innerHeight;
    const clientWidth = window.innerWidth;

    let showV = false;
    if (scrollHeight > clientHeight + 4) {
      const trackHeight = clientHeight - 8;
      const thumbHeight = Math.max(22, Math.round((clientHeight / scrollHeight) * trackHeight));
      const maxScrollY = scrollHeight - clientHeight;
      const thumbTop = 4 + Math.round((scrollTop / maxScrollY) * (trackHeight - thumbHeight));

      vScrollIndicator.style.top = `${thumbTop}px`;
      vScrollIndicator.style.height = `${thumbHeight}px`;
      vScrollIndicator.style.opacity = '1';
      showV = true;
    } else {
      vScrollIndicator.style.opacity = '0';
    }

    let showH = false;
    if (scrollWidth > clientWidth + 4) {
      const trackWidth = clientWidth - 8;
      const thumbWidth = Math.max(22, Math.round((clientWidth / scrollWidth) * trackWidth));
      const maxScrollX = scrollWidth - clientWidth;
      const thumbLeft = 4 + Math.round((scrollLeft / maxScrollX) * (trackWidth - thumbWidth));

      hScrollIndicator.style.left = `${thumbLeft}px`;
      hScrollIndicator.style.width = `${thumbWidth}px`;
      hScrollIndicator.style.opacity = '1';
      showH = true;
    } else {
      hScrollIndicator.style.opacity = '0';
    }

    clearTimeout(scrollFadeTimer);
    if (showV || showH) {
      scrollFadeTimer = setTimeout(() => {
        if (!isDragging) {
          if (vScrollIndicator) vScrollIndicator.style.opacity = '0';
          if (hScrollIndicator) hScrollIndicator.style.opacity = '0';
        }
      }, flash ? 650 : 800);
    }
  }

  function isTextEditable(target) {
    if (!target) return false;
    const tag = target.tagName ? target.tagName.toLowerCase() : '';
    if (tag === 'textarea') return true;
    if (tag === 'input') {
      const type = (target.getAttribute('type') || 'text').toLowerCase();
      const textTypes = ['text', 'password', 'email', 'search', 'number', 'tel', 'url'];
      if (textTypes.includes(type)) return true;
    }
    if (target.isContentEditable) return true;
    return false;
  }

  function dispatchSyntheticTouch(type, clientX, clientY, target) {
    if (!target) return;
    try {
      if (typeof Touch !== 'undefined' && typeof TouchEvent !== 'undefined') {
        const touch = new Touch({
          identifier: 1,
          target: target,
          clientX: clientX,
          clientY: clientY,
          screenX: clientX,
          screenY: clientY,
          pageX: clientX + (window.scrollX || window.pageXOffset || 0),
          pageY: clientY + (window.scrollY || window.pageYOffset || 0)
        });
        const touchEvent = new TouchEvent(type, {
          cancelable: true,
          bubbles: true,
          touches: type === 'touchend' ? [] : [touch],
          targetTouches: type === 'touchend' ? [] : [touch],
          changedTouches: [touch]
        });
        target.dispatchEvent(touchEvent);
      }
    } catch (err) {}
  }

  function scrollPage(target, dx, dy) {
    let el = target;
    let scrolled = false;
    while (el && el !== document.body && el !== document.documentElement) {
      try {
        const style = window.getComputedStyle(el);
        const canScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && (el.scrollHeight > el.clientHeight);
        const canScrollX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && (el.scrollWidth > el.clientWidth);
        if (canScrollY) {
          el.scrollTop += dy;
          scrolled = true;
        }
        if (canScrollX) {
          el.scrollLeft += dx;
          scrolled = true;
        }
        if (scrolled) break;
      } catch (err) {}
      el = el.parentElement;
    }
    if (!scrolled) {
      const root = document.scrollingElement || document.documentElement || document.body;
      if (root) {
        root.scrollTop += dy;
        root.scrollLeft += dx;
      }
      window.scrollBy(dx, dy);
    }
  }

  function startMomentum() {
    if (Math.abs(velocityY) < 0.5 && Math.abs(velocityX) < 0.5) return;

    function step() {
      if (!isDragging && (Math.abs(velocityY) > 0.3 || Math.abs(velocityX) > 0.3)) {
        scrollPage(currentTouchTarget, -velocityX * 16, -velocityY * 16);
        velocityY *= 0.92;
        velocityX *= 0.92;
        updateScrollbars();
        momentumAnimId = requestAnimationFrame(step);
      }
    }
    cancelAnimationFrame(momentumAnimId);
    momentumAnimId = requestAnimationFrame(step);
  }

  // Double-tap word selection
  function selectWordAtPoint(target, clientX, clientY) {
    if (isTextEditable(target)) {
      target.focus();
      const val = target.value || '';
      const pos = target.selectionStart || 0;
      let start = pos;
      while (start > 0 && /[\w\u00C0-\u024F]/.test(val[start - 1])) start--;
      let end = pos;
      while (end < val.length && /[\w\u00C0-\u024F]/.test(val[end])) end++;
      if (end > start) {
        target.setSelectionRange(start, end);
        return true;
      }
      return false;
    }

    try {
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(clientX, clientY);
        if (range && range.startContainer) {
          const node = range.startContainer;
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const offset = range.startOffset;
            let start = offset;
            while (start > 0 && /[\w\u00C0-\u024F]/.test(text[start - 1])) start--;
            let end = offset;
            while (end < text.length && /[\w\u00C0-\u024F]/.test(text[end])) end++;
            if (end > start) {
              const wordRange = document.createRange();
              wordRange.setStart(node, start);
              wordRange.setEnd(node, end);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(wordRange);
              return true;
            }
          }
        }
      }
    } catch (e) {}
    return false;
  }

  // --- Shield Event Handlers (Suppress Unclicked Hover) ---
  function onShieldWheel(e) {
    if (!shieldEl) return;
    shieldEl.style.pointerEvents = 'none';
    const targetUnderneath = document.elementFromPoint(e.clientX, e.clientY) || document.documentElement;
    shieldEl.style.pointerEvents = isTouchEnabled ? 'auto' : 'none';

    scrollPage(targetUnderneath, e.deltaX, e.deltaY);
    updateScrollbars();
  }

  function onShieldMouseMove(e) {
    if (!isTouchEnabled) return;
    if (cursorEl) {
      cursorEl.style.display = 'block';
      cursorEl.style.left = e.clientX + 'px';
      cursorEl.style.top = e.clientY + 'px';
    }
  }

  function onShieldMouseDown(e) {
    if (!isTouchEnabled || e.button !== 0) return;

    // Temporarily disable shield to find the real element underneath
    shieldEl.style.pointerEvents = 'none';
    currentTouchTarget = document.elementFromPoint(e.clientX, e.clientY) || document.body;

    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = performance.now();
    isDragging = true;
    hasMoved = false;
    velocityX = 0;
    velocityY = 0;

    cancelAnimationFrame(momentumAnimId);

    if (cursorEl) {
      cursorEl.style.width = '20px';
      cursorEl.style.height = '20px';
      cursorEl.style.background = 'rgba(255, 255, 255, 0.5)';
    }

    dispatchSyntheticTouch('touchstart', e.clientX, e.clientY, currentTouchTarget);

    window.addEventListener('mousemove', onActiveTouchMove, { passive: false });
    window.addEventListener('mouseup', onActiveTouchUp, { passive: false });
  }

  function onActiveTouchMove(e) {
    if (!isDragging) return;

    if (cursorEl) {
      cursorEl.style.left = e.clientX + 'px';
      cursorEl.style.top = e.clientY + 'px';
    }

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (totalDist > 4) {
      hasMoved = true;
      e.preventDefault();

      // Suppress text selection during drag
      document.documentElement.style.userSelect = 'none';
      if (document.body) document.body.style.userSelect = 'none';

      scrollPage(currentTouchTarget, -deltaX, -deltaY);
      updateScrollbars();

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocityX = deltaX / dt;
      velocityY = deltaY / dt;

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;

      dispatchSyntheticTouch('touchmove', e.clientX, e.clientY, currentTouchTarget);
    }
  }

  function onActiveTouchUp(e) {
    window.removeEventListener('mousemove', onActiveTouchMove);
    window.removeEventListener('mouseup', onActiveTouchUp);

    isDragging = false;

    // Restore text selection capability
    document.documentElement.style.userSelect = '';
    if (document.body) document.body.style.userSelect = '';

    if (cursorEl) {
      cursorEl.style.width = '26px';
      cursorEl.style.height = '26px';
      cursorEl.style.background = 'rgba(255, 255, 255, 0.22)';
    }

    dispatchSyntheticTouch('touchend', e.clientX, e.clientY, currentTouchTarget);

    if (hasMoved) {
      startMomentum();
      // Re-enable shield immediately
      if (shieldEl && isTouchEnabled) shieldEl.style.pointerEvents = 'auto';
    } else {
      // Stationary tap! Check for double tap
      const now = performance.now();
      const timeDiff = now - lastTapTime;
      const distDiff = Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY);

      if (timeDiff < 320 && distDiff < 10) {
        // DOUBLE TAP DETECTED! Select word
        selectWordAtPoint(currentTouchTarget, e.clientX, e.clientY);
        lastTapTime = 0;
        // Re-arm shield after double tap
        setTimeout(() => {
          if (shieldEl && isTouchEnabled) shieldEl.style.pointerEvents = 'auto';
        }, 100);
      } else {
        // SINGLE TAP
        lastTapTime = now;
        lastTapX = e.clientX;
        lastTapY = e.clientY;

        // Perform tap on target element
        if (currentTouchTarget) {
          const clickable = currentTouchTarget.closest('a, button, input, select, textarea, label, [role="button"], [tabindex]') || currentTouchTarget;
          if (isTextEditable(clickable)) {
            clickable.focus();
          } else if (clickable.click) {
            clickable.click();
          }
        }

        // Re-arm shield after tap execution
        setTimeout(() => {
          if (shieldEl && isTouchEnabled) shieldEl.style.pointerEvents = 'auto';
        }, 80);
      }
    }
  }

  function onMouseLeave() {
    if (cursorEl) cursorEl.style.display = 'none';
    isDragging = false;
    if (shieldEl && isTouchEnabled) shieldEl.style.pointerEvents = 'auto';
  }

  // Apply emulated device light/dark color scheme
  function applyColorScheme(scheme) {
    if (!scheme) return;
    let style = document.getElementById('phone-sim-color-scheme-override');
    if (!style) {
      style = document.createElement('style');
      style.id = 'phone-sim-color-scheme-override';
      const target = document.head || document.documentElement;
      if (target) target.appendChild(style);
    }
    if (style) {
      style.textContent = `
        :root {
          color-scheme: ${scheme} !important;
        }
      `;
    }
    const root = document.documentElement;
    if (root) {
      root.setAttribute('data-theme', scheme);
      root.setAttribute('data-color-scheme', scheme);
      root.classList.toggle('dark', scheme === 'dark');
      root.classList.toggle('light', scheme === 'light');
    }
  }

  // Listen for parent messages (e.g. toggle touch mode, toggle mouse arrow, set device light/dark theme)
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if (e.data.type === 'PHONE_SIM_TOUCH_CONFIG') {
      isTouchEnabled = !!e.data.enabled;
      if (typeof e.data.showArrow === 'boolean') {
        showMouseArrow = e.data.showArrow;
      }
      applyTouchAndArrowState();
      if (e.data.colorScheme) {
        applyColorScheme(e.data.colorScheme);
      }
    } else if (e.data.type === 'PHONE_SIM_THEME_CONFIG') {
      if (e.data.colorScheme) {
        applyColorScheme(e.data.colorScheme);
      }
    }
  });

  // Attach listeners
  function init() {
    injectStyles();
    createTouchShield();
    createTouchCursor();
    createOverlayScrollbars();

    // Flash mobile scrollbars briefly on page load
    setTimeout(() => { updateScrollbars(true); }, 200);

    window.addEventListener('scroll', () => { updateScrollbars(); }, { passive: true, capture: true });
    window.addEventListener('wheel', () => { updateScrollbars(); }, { passive: true, capture: true });
    window.addEventListener('resize', () => { updateScrollbars(true); }, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
  }

  // Inject styles as early as possible
  injectStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  },
});
