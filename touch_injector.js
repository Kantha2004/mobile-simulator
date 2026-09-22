// touch_injector.js - Injected into simulator iframes for mobile touch & drag-scroll simulation

(function () {
  'use strict';

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

  // Touch cursor DOM element
  let cursorEl = null;

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

  // Check if target is a standard interactive input where user wants to type
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

  // Dispatch synthetic touch events for touch-sensitive libraries (Swiper, sliders, etc.)
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
    } catch (err) {
      // Synthetic touch fallback if browser restricts Touch constructor
    }
  }

  // Robust Scroll for modern Single-Page Apps & standard documents
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

  // Momentum Inertial Scrolling
  function startMomentum() {
    if (Math.abs(velocityY) < 0.5 && Math.abs(velocityX) < 0.5) return;

    function step() {
      if (!isDragging && (Math.abs(velocityY) > 0.3 || Math.abs(velocityX) > 0.3)) {
        scrollPage(null, -velocityX * 16, -velocityY * 16);
        velocityY *= 0.92;
        velocityX *= 0.92;
        momentumAnimId = requestAnimationFrame(step);
      }
    }
    cancelAnimationFrame(momentumAnimId);
    momentumAnimId = requestAnimationFrame(step);
  }

  // Mouse / Touch Event Handlers
  function onMouseDown(e) {
    if (!isTouchEnabled || e.button !== 0) return;
    if (isTextEditable(e.target)) return;

    // Completely block text selection during touch drag
    document.documentElement.style.userSelect = 'none';
    document.documentElement.style.webkitUserSelect = 'none';
    if (document.body) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }
    try { window.getSelection()?.removeAllRanges(); } catch (err) {}

    cancelAnimationFrame(momentumAnimId);

    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = performance.now();
    isDragging = true;
    hasMoved = false;
    velocityX = 0;
    velocityY = 0;

    if (cursorEl) {
      cursorEl.style.width = '20px';
      cursorEl.style.height = '20px';
      cursorEl.style.background = 'rgba(255, 255, 255, 0.5)';
    }

    dispatchSyntheticTouch('touchstart', e.clientX, e.clientY, e.target);
  }

  function onMouseMove(e) {
    if (!isTouchEnabled) return;

    if (cursorEl) {
      cursorEl.style.display = 'block';
      cursorEl.style.left = e.clientX + 'px';
      cursorEl.style.top = e.clientY + 'px';
    }

    if (!isDragging) return;

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (totalDist > 4) {
      hasMoved = true;
      e.preventDefault(); // Prevent default text selection
      try { window.getSelection()?.removeAllRanges(); } catch (err) {}

      // Scroll document or container
      scrollPage(e.target, -deltaX, -deltaY);

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocityX = deltaX / dt;
      velocityY = deltaY / dt;

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;

      dispatchSyntheticTouch('touchmove', e.clientX, e.clientY, e.target);
    }
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;

    // Restore text selection capability
    document.documentElement.style.userSelect = '';
    document.documentElement.style.webkitUserSelect = '';
    if (document.body) {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }

    if (cursorEl) {
      cursorEl.style.width = '26px';
      cursorEl.style.height = '26px';
      cursorEl.style.background = 'rgba(255, 255, 255, 0.22)';
    }

    dispatchSyntheticTouch('touchend', e.clientX, e.clientY, e.target);

    if (hasMoved) {
      startMomentum();
    }
  }

  // If the user was dragging/swiping to scroll, swallow the subsequent click event
  // so links aren't accidentally opened on touch release!
  function onClickCapture(e) {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      hasMoved = false;
    }
  }

  function onMouseLeave() {
    if (cursorEl) {
      cursorEl.style.display = 'none';
    }
    isDragging = false;
  }

  // Listen for parent messages (e.g. toggle touch mode)
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'PHONE_SIM_TOUCH_CONFIG') {
      isTouchEnabled = !!e.data.enabled;
      if (cursorEl && !isTouchEnabled) {
        cursorEl.style.display = 'none';
      }
    }
  });

  // Attach listeners
  function init() {
    createTouchCursor();

    window.addEventListener('mousedown', onMouseDown, { passive: false });
    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp, { passive: false });
    window.addEventListener('click', onClickCapture, { capture: true });
    window.addEventListener('selectstart', (e) => {
      if (isTouchEnabled && isDragging) e.preventDefault();
    }, { capture: true });
    document.addEventListener('mouseleave', onMouseLeave);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
