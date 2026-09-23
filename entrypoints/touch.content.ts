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
    if (target) {
      target.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        (document.head || document.documentElement)?.appendChild(style);
      }, { once: true });
    }

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

  // --- Chrome DevTools Protocol Bridge & Network/DOM Instrumentation ---
  let highlightEl: HTMLElement | null = null;
  let isInspectMode = false;
  let recordLog: (type: 'log' | 'info' | 'warn' | 'error', args: any[]) => void = () => {};

  function highlightElement(el: Element) {
    if (!highlightEl) {
      highlightEl = document.createElement('div');
      highlightEl.id = 'phone-sim-devtools-highlight-overlay';
      highlightEl.style.cssText = `
        position: absolute;
        pointer-events: none;
        z-index: 2147483646;
        background: rgba(138, 180, 248, 0.35);
        border: 1px solid #1a73e8;
        box-sizing: border-box;
        transition: all 0.05s ease;
      `;
      (document.body || document.documentElement).appendChild(highlightEl);
    }
    const rect = el.getBoundingClientRect();
    highlightEl.style.display = 'block';
    highlightEl.style.top = `${rect.top + window.scrollY}px`;
    highlightEl.style.left = `${rect.left + window.scrollX}px`;
    highlightEl.style.width = `${rect.width}px`;
    highlightEl.style.height = `${rect.height}px`;
  }

  function clearHighlight() {
    if (highlightEl) highlightEl.style.display = 'none';
  }

  function getNodeByPath(path: string): Element | null {
    if (path === '0') return document.documentElement;
    const parts = path.split('_').slice(1).map(Number);
    let current: Element | null = document.documentElement;
    for (const idx of parts) {
      if (!current) return null;
      const children = Array.from(current.children);
      current = children[idx] || null;
    }
    return current;
  }

  function serializeDomTree(el: Node, depth: number = 0, maxDepth: number = 4): any {
    if (el.nodeType === Node.TEXT_NODE) {
      const text = el.textContent?.trim();
      if (!text) return null;
      return { type: 'text', text: text.slice(0, 100) };
    }
    if (el.nodeType === Node.ELEMENT_NODE) {
      const elem = el as HTMLElement;
      if (elem.id === 'phone-sim-injected-styles' || elem.id === 'phone-sim-touch-cursor' || elem.id === 'phone-sim-touch-shield' || elem.id === 'phone-sim-devtools-highlight-overlay' || elem.id === 'phone-sim-inframe-devtools') {
        return null;
      }
      const attributes: Record<string, string> = {};
      for (let i = 0; i < elem.attributes.length; i++) {
        const attr = elem.attributes[i];
        attributes[attr.name] = attr.value;
      }
      const children: any[] = [];
      if (depth < maxDepth) {
        elem.childNodes.forEach(child => {
          const ser = serializeDomTree(child, depth + 1, maxDepth);
          if (ser) children.push(ser);
        });
      }
      return {
        type: 'element',
        tagName: elem.tagName.toLowerCase(),
        id: elem.id,
        className: elem.className,
        attributes,
        childCount: elem.childElementCount,
        children
      };
    }
    return null;
  }

  function getElementBoxModelAndStyles(el: Element) {
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const parsePx = (val: string) => Math.round(parseFloat(val) || 0);

    const margin = {
      top: parsePx(cs.marginTop),
      right: parsePx(cs.marginRight),
      bottom: parsePx(cs.marginBottom),
      left: parsePx(cs.marginLeft)
    };
    const border = {
      top: parsePx(cs.borderTopWidth),
      right: parsePx(cs.borderRightWidth),
      bottom: parsePx(cs.borderBottomWidth),
      left: parsePx(cs.borderLeftWidth)
    };
    const padding = {
      top: parsePx(cs.paddingTop),
      right: parsePx(cs.paddingRight),
      bottom: parsePx(cs.paddingBottom),
      left: parsePx(cs.paddingLeft)
    };
    const content = {
      width: Math.max(0, Math.round(rect.width - border.left - border.right - padding.left - padding.right)),
      height: Math.max(0, Math.round(rect.height - border.top - border.bottom - padding.top - padding.bottom))
    };

    const keyProps = [
      'display', 'position', 'width', 'height', 'box-sizing',
      'margin', 'padding', 'border', 'color', 'background-color',
      'font-family', 'font-size', 'font-weight', 'line-height',
      'flex-direction', 'justify-content', 'align-items', 'gap',
      'grid-template-columns', 'grid-template-rows',
      'opacity', 'z-index', 'overflow', 'transform'
    ];

    const styles: Record<string, string> = {};
    for (const prop of keyProps) {
      const val = cs.getPropertyValue(prop);
      if (val) styles[prop] = val;
    }

    return { boxModel: { margin, border, padding, content }, styles };
  }

  // Inspect mode listeners
  window.addEventListener('mousemove', (e) => {
    if (!isInspectMode) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (target && target !== highlightEl) {
      highlightElement(target);
    }
  }, { capture: true, passive: true });

  window.addEventListener('click', (e) => {
    if (!isInspectMode) return;
    e.preventDefault();
    e.stopPropagation();
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (target && target !== highlightEl) {
      const { boxModel, styles } = getElementBoxModelAndStyles(target);
      window.parent?.postMessage({
        type: 'PHONE_SIM_DEVTOOLS_EVENT',
        subType: 'INSPECT_ELEMENT_CLICKED',
        payload: {
          tagName: target.tagName.toLowerCase(),
          id: target.id,
          className: target.className,
          boxModel,
          styles
        }
      }, '*');
      isInspectMode = false;
      clearHighlight();
    }
  }, { capture: true });

  // Hook Network Requests (Fetch + XMLHttpRequest)
  try {
    const origFetch = window.fetch;
    if (origFetch) {
      window.fetch = async function(...args) {
        const startTime = performance.now();
        const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || '';
        const reqMethod = (args[1]?.method || (args[0] as Request)?.method || 'GET').toUpperCase();
        const id = 'req_' + Math.random().toString(36).slice(2);

        window.parent?.postMessage({
          type: 'PHONE_SIM_DEVTOOLS_EVENT',
          subType: 'NETWORK_START',
          payload: { id, url: reqUrl, method: reqMethod, startTime: Date.now() }
        }, '*');

        try {
          const response = await origFetch.apply(this, args);
          const duration = Math.round(performance.now() - startTime);
          const cloned = response.clone();
          let resText = '';
          try { resText = (await cloned.text()).slice(0, 50000); } catch (e) {}

          const headersObj: Record<string, string> = {};
          response.headers.forEach((v, k) => { headersObj[k] = v; });

          window.parent?.postMessage({
            type: 'PHONE_SIM_DEVTOOLS_EVENT',
            subType: 'NETWORK_END',
            payload: {
              id,
              url: response.url || reqUrl,
              method: reqMethod,
              status: response.status,
              statusText: response.statusText,
              duration,
              type: response.headers.get('content-type') || 'fetch',
              headers: headersObj,
              responseBody: resText
            }
          }, '*');
          return response;
        } catch (err: any) {
          const duration = Math.round(performance.now() - startTime);
          window.parent?.postMessage({
            type: 'PHONE_SIM_DEVTOOLS_EVENT',
            subType: 'NETWORK_END',
            payload: {
              id,
              url: reqUrl,
              method: reqMethod,
              status: 0,
              statusText: 'Failed',
              duration,
              type: 'fetch',
              headers: {},
              responseBody: err?.message || 'Network request failed'
            }
          }, '*');
          throw err;
        }
      };
    }

    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
      (this as any)._ps_id = 'req_' + Math.random().toString(36).slice(2);
      (this as any)._ps_method = method;
      (this as any)._ps_url = String(url);
      (this as any)._ps_startTime = performance.now();
      return origXhrOpen.apply(this, [method, url, ...rest] as any);
    };
    XMLHttpRequest.prototype.send = function(...args: any[]) {
      const xhr = this;
      const id = (xhr as any)._ps_id;
      const url = (xhr as any)._ps_url;
      const method = (xhr as any)._ps_method;

      if (id && url) {
        window.parent?.postMessage({
          type: 'PHONE_SIM_DEVTOOLS_EVENT',
          subType: 'NETWORK_START',
          payload: { id, url, method, startTime: Date.now() }
        }, '*');

        xhr.addEventListener('loadend', () => {
          const duration = Math.round(performance.now() - ((xhr as any)._ps_startTime || performance.now()));
          let resText = '';
          try { resText = String(xhr.responseText || '').slice(0, 50000); } catch (e) {}

          window.parent?.postMessage({
            type: 'PHONE_SIM_DEVTOOLS_EVENT',
            subType: 'NETWORK_END',
            payload: {
              id,
              url,
              method,
              status: xhr.status,
              statusText: xhr.statusText,
              duration,
              type: xhr.getResponseHeader('content-type') || 'xhr',
              headers: { 'content-type': xhr.getResponseHeader('content-type') || '' },
              responseBody: resText
            }
          }, '*');
        });
      }
      return origXhrSend.apply(this, args as any);
    };
  } catch (e) {}

  // Listen for parent messages (e.g. toggle touch mode, set light/dark theme, devtools commands)
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
    } else if (e.data.type === 'PHONE_SIM_DEVTOOLS_TOGGLE') {
      toggleInDeviceDevTools();
    } else if (e.data.type === 'PHONE_SIM_DEVTOOLS_COMMAND') {
      const cmd = e.data.command;
      if (!cmd) return;

      if (cmd.action === 'get_dom') {
        const domTree = serializeDomTree(document.documentElement);
        window.parent?.postMessage({
          type: 'PHONE_SIM_DEVTOOLS_EVENT',
          subType: 'DOM_RESPONSE',
          payload: domTree
        }, '*');
      } else if (cmd.action === 'get_styles') {
        const target = getNodeByPath(cmd.path || '0') || document.documentElement;
        const { boxModel, styles } = getElementBoxModelAndStyles(target);
        window.parent?.postMessage({
          type: 'PHONE_SIM_DEVTOOLS_EVENT',
          subType: 'STYLES_RESPONSE',
          payload: { boxModel, styles }
        }, '*');
      } else if (cmd.action === 'hover_node') {
        const target = getNodeByPath(cmd.path || '0');
        if (target) highlightElement(target);
      } else if (cmd.action === 'clear_highlight') {
        clearHighlight();
      } else if (cmd.action === 'set_inspect_mode') {
        isInspectMode = !!cmd.enabled;
        if (!isInspectMode) clearHighlight();
      } else if (cmd.action === 'eval') {
        try {
          const result = (window as any).eval(cmd.code);
          recordLog('log', ['<=', result]);
        } catch (err: any) {
          recordLog('error', [err?.message || String(err)]);
        }
      } else if (cmd.action === 'get_storage') {
        const localItems: Record<string, string> = {};
        const sessionItems: Record<string, string> = {};
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i) || '';
            localItems[k] = localStorage.getItem(k) || '';
          }
        } catch (e) {}
        try {
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i) || '';
            sessionItems[k] = sessionStorage.getItem(k) || '';
          }
        } catch (e) {}

        window.parent?.postMessage({
          type: 'PHONE_SIM_DEVTOOLS_EVENT',
          subType: 'STORAGE_RESPONSE',
          payload: {
            local: localItems,
            session: sessionItems,
            cookies: { 'document.cookie': document.cookie }
          }
        }, '*');
      } else if (cmd.action === 'clear_storage') {
        try {
          if (cmd.storageType === 'local') localStorage.clear();
          else if (cmd.storageType === 'session') sessionStorage.clear();
        } catch (e) {}
      }
    }
  });

  // --- In-Device Mobile DevTools Inspector ---
  let devToolsContainer: HTMLElement | null = null;
  let isDevToolsVisible = false;
  let activeTab: 'console' | 'elements' | 'storage' | 'info' = 'console';
  const interceptedLogs: Array<{ type: 'log' | 'info' | 'warn' | 'error'; text: string; time: string }> = [];

  // Safely hook console methods and forward to parent
  try {
    const origLog = console.log;
    const origInfo = console.info;
    const origWarn = console.warn;
    const origError = console.error;

    function safeFormat(arg: any): string {
      if (typeof arg === 'undefined') return 'undefined';
      if (arg === null) return 'null';
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch { return Object.prototype.toString.call(arg); }
      }
      return String(arg);
    }

    recordLog = function(type: 'log' | 'info' | 'warn' | 'error', args: any[]) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const text = args.map(safeFormat).join(' ');
      interceptedLogs.push({ type, text, time });
      if (interceptedLogs.length > 200) interceptedLogs.shift();

      // Forward to parent DevTools container
      window.parent?.postMessage({
        type: 'PHONE_SIM_DEVTOOLS_EVENT',
        subType: 'CONSOLE',
        payload: { type, text, time, args: args.map(safeFormat) }
      }, '*');

      if (isDevToolsVisible && activeTab === 'console') {
        renderDevToolsTab();
      }
    }

    console.log = function(...args: any[]) { origLog.apply(console, args); recordLog('log', args); };
    console.info = function(...args: any[]) { origInfo.apply(console, args); recordLog('info', args); };
    console.warn = function(...args: any[]) { origWarn.apply(console, args); recordLog('warn', args); };
    console.error = function(...args: any[]) { origError.apply(console, args); recordLog('error', args); };

    window.addEventListener('error', (err) => {
      recordLog('error', [err.message || 'Error', `${err.filename}:${err.lineno}`]);
    });
    window.addEventListener('unhandledrejection', (ev) => {
      recordLog('error', ['Unhandled Promise Rejection:', ev.reason]);
    });
  } catch (e) {}

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function createDevToolsUI() {
    if (devToolsContainer) return devToolsContainer;

    devToolsContainer = document.createElement('div');
    devToolsContainer.id = 'phone-sim-inframe-devtools';
    devToolsContainer.style.cssText = `
      position: fixed;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 48%;
      max-height: 85vh;
      background: rgba(15, 17, 23, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.5);
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      pointer-events: auto;
      user-select: text;
    `;

    devToolsContainer.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.08);font-size:11px;">
        <div style="display:flex;gap:4px;" id="ps-dt-tabs">
          <button data-tab="console" style="background:#3b82f6;color:#fff;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Console</button>
          <button data-tab="elements" style="background:transparent;color:#94a3b8;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;">Elements</button>
          <button data-tab="storage" style="background:transparent;color:#94a3b8;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;">Storage</button>
          <button data-tab="info" style="background:transparent;color:#94a3b8;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;">Device Info</button>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button id="ps-dt-btn-clear" style="background:rgba(255,255,255,0.08);color:#94a3b8;border:none;padding:3px 6px;border-radius:4px;cursor:pointer;font-size:10px;">Clear</button>
          <button id="ps-dt-btn-close" style="background:transparent;color:#94a3b8;border:none;padding:2px 6px;border-radius:4px;cursor:pointer;font-size:14px;line-height:1;">✕</button>
        </div>
      </div>
      <div id="ps-dt-content" style="flex:1;overflow-y:auto;padding:8px 10px;line-height:1.45;word-break:break-all;"></div>
      <div id="ps-dt-cmd-bar" style="display:flex;border-top:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.3);padding:4px 8px;">
        <span style="color:#3b82f6;margin-right:6px;font-weight:bold;line-height:22px;">&gt;</span>
        <input id="ps-dt-cmd-input" type="text" placeholder="Evaluate JavaScript (e.g. document.title)..." style="flex:1;background:transparent;border:none;color:#fff;font-family:inherit;font-size:11.5px;outline:none;" />
      </div>
    `;

    const target = document.body || document.documentElement;
    if (target) target.appendChild(devToolsContainer);

    // Tab buttons
    const tabBtns = devToolsContainer.querySelectorAll<HTMLButtonElement>('#ps-dt-tabs button');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = (btn.getAttribute('data-tab') as any) || 'console';
        tabBtns.forEach(b => {
          const isAct = b === btn;
          b.style.background = isAct ? '#3b82f6' : 'transparent';
          b.style.color = isAct ? '#fff' : '#94a3b8';
          b.style.fontWeight = isAct ? '600' : 'normal';
        });
        const cmdBar = devToolsContainer?.querySelector<HTMLElement>('#ps-dt-cmd-bar');
        if (cmdBar) cmdBar.style.display = activeTab === 'console' ? 'flex' : 'none';
        renderDevToolsTab();
      });
    });

    // Clear button
    const clearBtn = devToolsContainer.querySelector<HTMLButtonElement>('#ps-dt-btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (activeTab === 'console') {
          interceptedLogs.length = 0;
          renderDevToolsTab();
        }
      });
    }

    // Close button
    const closeBtn = devToolsContainer.querySelector<HTMLButtonElement>('#ps-dt-btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (devToolsContainer) {
          devToolsContainer.style.display = 'none';
          isDevToolsVisible = false;
        }
      });
    }

    // Command runner
    const cmdInput = devToolsContainer.querySelector<HTMLInputElement>('#ps-dt-cmd-input');
    if (cmdInput) {
      cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const code = cmdInput.value.trim();
          if (!code) return;
          cmdInput.value = '';
          try {
            const result = (window as any).eval(code);
            console.log(code, '=>', result);
          } catch (err) {
            console.error(err);
          }
        }
      });
    }

    renderDevToolsTab();
    return devToolsContainer;
  }

  function renderDevToolsTab() {
    if (!devToolsContainer) return;
    const content = devToolsContainer.querySelector<HTMLElement>('#ps-dt-content');
    if (!content) return;

    if (activeTab === 'console') {
      if (interceptedLogs.length === 0) {
        content.innerHTML = '<div style="color:#64748b;font-style:italic;">No console logs yet. Evaluated expressions and output will appear here.</div>';
        return;
      }
      content.innerHTML = interceptedLogs.map(l => {
        const color = l.type === 'error' ? '#f87171' : l.type === 'warn' ? '#fbbf24' : l.type === 'info' ? '#60a5fa' : '#cbd5e1';
        const bg = l.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : l.type === 'warn' ? 'rgba(245, 158, 11, 0.08)' : 'transparent';
        return `<div style="padding:2px 4px;margin-bottom:2px;border-radius:3px;background:${bg};color:${color};"><span style="color:#64748b;font-size:10px;margin-right:6px;">[${l.time}]</span>${escapeHtml(l.text)}</div>`;
      }).join('');
      content.scrollTop = content.scrollHeight;
    } else if (activeTab === 'elements') {
      const root = document.documentElement;
      content.innerHTML = `
        <div style="color:#38bdf8;margin-bottom:4px;">&lt;html class="${escapeHtml(root.className)}"&gt;</div>
        <div style="padding-left:12px;">
          <div style="color:#38bdf8;">&lt;head&gt; (${document.head?.children.length || 0} nodes)&lt;/head&gt;</div>
          <div style="color:#38bdf8;margin-top:4px;">&lt;body class="${escapeHtml(document.body?.className || '')}"&gt;</div>
          <div style="padding-left:12px;">
            ${Array.from(document.body?.children || []).slice(0, 50).map(el => {
              const tag = el.tagName.toLowerCase();
              const id = el.id ? `#${el.id}` : '';
              const cls = el.className ? `.${String(el.className).trim().replace(/\\s+/g, '.')}` : '';
              return `<div style="color:#e2e8f0;margin:2px 0;"><span style="color:#f472b6;">&lt;${tag}</span><span style="color:#fbbf24;">${escapeHtml(id)}</span><span style="color:#38bdf8;">${escapeHtml(cls)}</span><span style="color:#f472b6;">&gt;</span></div>`;
            }).join('')}
          </div>
          <div style="color:#38bdf8;margin-top:4px;">&lt;/body&gt;</div>
        </div>
        <div style="color:#38bdf8;">&lt;/html&gt;</div>
      `;
    } else if (activeTab === 'storage') {
      let lsItems = '';
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || '';
          lsItems += `<div><span style="color:#38bdf8;">${escapeHtml(k)}</span>: <span style="color:#a7f3d0;">${escapeHtml(localStorage.getItem(k) || '')}</span></div>`;
        }
      } catch (e) { lsItems = '<div style="color:#f87171;">Access restricted</div>'; }

      content.innerHTML = `
        <div style="font-weight:bold;color:#f8fafc;margin-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:2px;">localStorage (${localStorage.length})</div>
        <div style="margin-bottom:10px;padding-left:4px;">${lsItems || '<div style="color:#64748b;">(empty)</div>'}</div>
        <div style="font-weight:bold;color:#f8fafc;margin-bottom:4px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:2px;">Cookies</div>
        <div style="padding-left:4px;color:#a7f3d0;">${escapeHtml(document.cookie || '(none)')}</div>
      `;
    } else if (activeTab === 'info') {
      content.innerHTML = `
        <div style="display:grid;grid-template-columns:110px 1fr;gap:6px 12px;">
          <span style="color:#94a3b8;">Viewport:</span><span>${window.innerWidth} × ${window.innerHeight} px</span>
          <span style="color:#94a3b8;">Device Pixel Ratio:</span><span>${window.devicePixelRatio}</span>
          <span style="color:#94a3b8;">Screen Size:</span><span>${screen.width} × ${screen.height} px</span>
          <span style="color:#94a3b8;">Orientation:</span><span>${window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait'}</span>
          <span style="color:#94a3b8;">Touch Support:</span><span>${'ontouchstart' in window ? 'Yes' : 'Simulated'}</span>
          <span style="color:#94a3b8;">User Agent:</span><span style="word-break:break-all;color:#cbd5e1;">${escapeHtml(navigator.userAgent)}</span>
          <span style="color:#94a3b8;">URL:</span><span style="word-break:break-all;color:#38bdf8;">${escapeHtml(location.href)}</span>
        </div>
      `;
    }
  }

  function toggleInDeviceDevTools() {
    try {
      const container = createDevToolsUI();
      if (!container) return;
      isDevToolsVisible = !isDevToolsVisible;
      container.style.display = isDevToolsVisible ? 'flex' : 'none';
      if (isDevToolsVisible) renderDevToolsTab();
    } catch (err) {
      console.warn('[Phone Simulator] DevTools toggle error:', err);
    }
  }

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
