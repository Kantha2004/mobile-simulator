// simulator.js - Core Logic for Mobile & Phone Simulator Extension (Multi-Device Side-by-Side Supported)

(function () {
  'use strict';

  // --- State ---
  let activeDevices = []; // Array of { id, device, isLandscape, isLightBrowser }
  let isLandscape = false; // Default global orientation state
  let currentScale = 'fit';
  let isBezelVisible = true;
  let isTouchMode = true;
  let isMouseArrowVisible = localStorage.getItem('phone_sim_show_arrow') !== 'false';
  let currentThemeIndex = 0;
  let currentViewMode = localStorage.getItem('phone_sim_viewmode') || 'browser';
  const THEMES = ['titanium-dark', 'titanium-silver', 'titanium-natural'];
  let currentScaleValue = 1.0;

  // --- DOM Elements ---
  const deviceSelect = document.getElementById('device-select');
  const btnAddDevice = document.getElementById('btn-add-device');
  const modalAddDevice = document.getElementById('modal-add-device');
  const devicePickerGrid = document.getElementById('device-picker-grid');

  const viewmodeSelect = document.getElementById('viewmode-select');
  const btnOrientation = document.getElementById('btn-orientation');
  const orientationLabel = document.getElementById('orientation-label');
  const scaleSelect = document.getElementById('scale-select');
  const btnToggleFrame = document.getElementById('btn-toggle-frame');
  const btnTouchMode = document.getElementById('btn-touch-mode');
  const btnMouseArrow = document.getElementById('btn-mouse-arrow');
  const btnTheme = document.getElementById('btn-theme');
  const btnScreenshot = document.getElementById('btn-screenshot');
  const btnQr = document.getElementById('btn-qr');
  const btnCustomDevice = document.getElementById('btn-custom-device');

  const navBack = document.getElementById('btn-back');
  const navForward = document.getElementById('btn-forward');
  const navReload = document.getElementById('btn-reload');
  const navHome = document.getElementById('btn-home');

  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const btnClearUrl = document.getElementById('btn-clear-url');
  const protocolText = document.getElementById('protocol-text');

  const hudDimensions = document.getElementById('hud-dimensions');
  const hudDpr = document.getElementById('hud-dpr');
  const hudZoom = document.getElementById('hud-zoom');

  const stageContainer = document.getElementById('stage-container');

  // Modals
  const modalQr = document.getElementById('modal-qr');
  const qrTarget = document.getElementById('qr-target');
  const qrUrlText = document.getElementById('qr-url-text');
  const btnCopyUrl = document.getElementById('btn-copy-url');

  const modalCustom = document.getElementById('modal-custom');
  const customDeviceForm = document.getElementById('custom-device-form');
  const customWidthInput = document.getElementById('custom-width');
  const customHeightInput = document.getElementById('custom-height');
  const customDprSelect = document.getElementById('custom-dpr');
  const customNameInput = document.getElementById('custom-name');

  const toastContainer = document.getElementById('toast-container');

  // --- Initialize Device Selector Dropdown ---
  function initDeviceList() {
    const categories = {};
    DEVICE_PRESETS.forEach(dev => {
      if (!categories[dev.category]) {
        categories[dev.category] = [];
      }
      categories[dev.category].push(dev);
    });

    deviceSelect.innerHTML = '';
    for (const [catName, devices] of Object.entries(categories)) {
      const group = document.createElement('optgroup');
      group.label = catName;
      devices.forEach(dev => {
        const opt = document.createElement('option');
        opt.value = dev.id;
        opt.textContent = `${dev.name} (${dev.width} × ${dev.height})`;
        if (dev.default) opt.selected = true;
        group.appendChild(opt);
      });
      deviceSelect.appendChild(group);
    }

    // Add Custom option at the end
    const customGroup = document.createElement('optgroup');
    customGroup.label = 'Custom';
    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = 'Custom Viewport...';
    customGroup.appendChild(customOpt);
    deviceSelect.appendChild(customGroup);

    // Initial selected device
    const savedDeviceId = localStorage.getItem('phone_sim_device') || 'iphone-15-pro';
    const found = DEVICE_PRESETS.find(d => d.id === savedDeviceId) || DEVICE_PRESETS[0];

    // Seed initial device
    activeDevices = [
      {
        id: 'slot-1',
        device: found,
        isLandscape: false,
        isLightBrowser: false
      }
    ];

    deviceSelect.value = found.id;
  }

  // --- Populate Modal Device Picker Grid ---
  function initDevicePickerGrid() {
    if (!devicePickerGrid) return;
    devicePickerGrid.innerHTML = '';

    DEVICE_PRESETS.forEach(dev => {
      const card = document.createElement('div');
      card.className = 'device-picker-card';
      card.innerHTML = `
        <span class="picker-card-category">${dev.category}</span>
        <span class="picker-card-name">${dev.name}</span>
        <span class="picker-card-dims">${dev.width} × ${dev.height} px · DPR ${dev.dpr || 1}x</span>
      `;
      card.addEventListener('click', () => {
        addDevice(dev);
        if (modalAddDevice) modalAddDevice.classList.remove('is-open');
      });
      devicePickerGrid.appendChild(card);
    });
  }

  // --- Multi-Device: Add New Device Slot Side-by-Side ---
  function addDevice(preset) {
    const newSlot = {
      id: 'slot-' + Date.now() + Math.random().toString(36).substr(2, 4),
      device: preset,
      isLandscape: isLandscape,
      isLightBrowser: false
    };
    activeDevices.push(newSlot);
    renderAllDevices();
    showToast(`Added ${preset.name} side-by-side!`);
  }

  // --- Multi-Device: Remove Device Slot ---
  function removeDevice(slotId) {
    if (activeDevices.length <= 1) return;
    const removed = activeDevices.find(s => s.id === slotId);
    activeDevices = activeDevices.filter(s => s.id !== slotId);
    renderAllDevices();
    if (removed) {
      showToast(`Removed ${removed.device.name}`);
    }
  }

  // --- Create DOM Element for Single Device Slot ---
  function createDeviceSlotElement(slotData) {
    const { id, device, isLandscape: slotLandscape, isLightBrowser } = slotData;
    const w = slotLandscape ? device.height : device.width;
    const h = slotLandscape ? device.width : device.height;

    const currentUrl = urlInput.value || localStorage.getItem('phone_sim_last_url') || 'https://en.wikipedia.org';
    let displayUrl = 'en.wikipedia.org';
    try {
      const parsed = new URL(currentUrl);
      displayUrl = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch (e) {
      displayUrl = currentUrl.replace(/^https?:\/\//, '');
    }

    const slot = document.createElement('div');
    slot.className = 'device-slot';
    slot.id = id;
    slot.dataset.slotId = id;

    slot.innerHTML = `
      <div class="device-column-header">
        <div class="device-col-info">
          <span class="device-col-name">${device.name}</span>
          <span class="device-col-dims">${w} × ${h}</span>
        </div>
        <div class="device-col-actions">
          <button class="device-col-btn btn-col-rotate" title="Rotate Device (${slotLandscape ? 'Landscape' : 'Portrait'})">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
              <rect x="8.5" y="6.5" width="7" height="11" rx="1.5"/>
            </svg>
          </button>
          <button class="device-col-btn btn-col-remove" title="Remove Device" style="${activeDevices.length > 1 ? '' : 'display:none;'}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="device-viewport-scaler">
        <div class="device-chassis ${slotLandscape ? 'is-landscape' : ''} ${!isBezelVisible ? 'is-frameless' : ''} ${isLightBrowser ? 'is-light-browser' : ''}"
             data-type="${device.type || 'iphone-island'}"
             data-theme="${THEMES[currentThemeIndex]}"
             data-viewmode="${currentViewMode}">
          <div class="device-bezel">
            <!-- Cutout -->
            <div class="device-cutout-container">
              <div class="dynamic-island">
                <span class="camera-lens"></span>
                <span class="sensor-dot"></span>
              </div>
              <div class="android-punch">
                <span class="punch-lens"></span>
              </div>
              <div class="classic-notch">
                <span class="speaker-slit"></span>
                <span class="notch-camera"></span>
              </div>
            </div>

            <!-- Status Bar -->
            <div class="device-status-bar">
              <span class="status-time">9:41</span>
              <div class="status-icons">
                <!-- Signal -->
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 20h.01"/>
                  <path d="M7 20v-4"/>
                  <path d="M12 20v-8"/>
                  <path d="M17 20V4"/>
                </svg>
                <!-- WiFi -->
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h.01"/>
                  <path d="M2 8.82a15 15 0 0 1 20 0"/>
                  <path d="M5 12.859a10 10 0 0 1 14 0"/>
                  <path d="M8.5 16.429a5 5 0 0 1 7 0"/>
                </svg>
                <!-- Battery with Level -->
                <svg viewBox="0 0 24 24" width="18" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="16" height="10" x="2" y="7" rx="2.5"/>
                  <path d="M21 10.5v3" stroke-width="2"/>
                  <rect x="4" y="9" width="8" height="6" rx="1" fill="currentColor" stroke="none"/>
                </svg>
              </div>
            </div>

            <!-- Screen Frame -->
            <div class="screen-wrapper" style="width: ${w}px; height: ${h}px;">
              <!-- Mobile Browser Header -->
              <div class="mobile-browser-header">
                <div class="mb-address-capsule">
                  <svg class="mb-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span class="mb-url-text">${displayUrl}</span>
                  <button class="mb-btn mb-btn-reload" title="Reload Page">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                      <path d="M16 16h5v5"/>
                    </svg>
                  </button>
                </div>
                <div class="mb-top-actions">
                  <span class="mb-tabs-badge">1</span>
                  <button class="mb-btn mb-menu-btn mb-btn-theme-toggle" title="Toggle Light/Dark Mobile Browser Chrome">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="12" cy="5" r="1"/>
                      <circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Webpage Viewport Iframe Container -->
              <div class="iframe-container">
                <iframe class="phone-iframe" src="${currentUrl}"></iframe>
                <div class="touch-cursor"></div>
              </div>

              <!-- Mobile Browser Bottom Toolbar -->
              <div class="mobile-browser-footer">
                <button class="mb-nav-btn mb-btn-back" title="Back">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <button class="mb-nav-btn mb-btn-forward" title="Forward">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
                <button class="mb-nav-btn mb-btn-share" title="Share">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                </button>
                <button class="mb-nav-btn mb-btn-bookmarks" title="Bookmarks">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                </button>
                <button class="mb-nav-btn mb-btn-tabs" title="Tabs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
              </div>
            </div>

            <!-- Home Bar -->
            <div class="device-home-bar"><div class="home-indicator"></div></div>
          </div>
        </div>
      </div>
    `;

    // Attach Per-Slot Events
    const btnRotate = slot.querySelector('.btn-col-rotate');
    btnRotate.addEventListener('click', () => {
      slotData.isLandscape = !slotData.isLandscape;
      renderAllDevices();
      showToast(`${device.name}: ${slotData.isLandscape ? 'Landscape' : 'Portrait'}`);
    });

    const btnRemove = slot.querySelector('.btn-col-remove');
    btnRemove.addEventListener('click', () => {
      removeDevice(id);
    });

    const btnThemeToggle = slot.querySelector('.mb-btn-theme-toggle');
    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', () => {
        slotData.isLightBrowser = !slotData.isLightBrowser;
        const chassis = slot.querySelector('.device-chassis');
        if (chassis) chassis.classList.toggle('is-light-browser', slotData.isLightBrowser);
        showToast(`${device.name}: ${slotData.isLightBrowser ? 'Light Chrome' : 'Dark Chrome'}`);
      });
    }

    const inReload = slot.querySelector('.mb-btn-reload');
    if (inReload) {
      inReload.addEventListener('click', () => {
        const iframe = slot.querySelector('.phone-iframe');
        if (iframe) iframe.src = iframe.src;
      });
    }

    const inBack = slot.querySelector('.mb-nav-btn.mb-btn-back');
    if (inBack) {
      inBack.addEventListener('click', () => {
        const iframe = slot.querySelector('.phone-iframe');
        try { if (iframe) iframe.contentWindow.history.back(); } catch (e) {}
      });
    }

    const inForward = slot.querySelector('.mb-nav-btn.mb-btn-forward');
    if (inForward) {
      inForward.addEventListener('click', () => {
        const iframe = slot.querySelector('.phone-iframe');
        try { if (iframe) iframe.contentWindow.history.forward(); } catch (e) {}
      });
    }

    // Touch and Iframe Setup
    const iframe = slot.querySelector('.phone-iframe');
    const cursor = slot.querySelector('.touch-cursor');
    const screen = slot.querySelector('.screen-wrapper');

    if (iframe) {
      iframe.addEventListener('load', () => {
        try {
          iframe.contentWindow.postMessage({
            type: 'PHONE_SIM_TOUCH_CONFIG',
            enabled: isTouchMode,
            showArrow: isMouseArrowVisible
          }, '*');
        } catch (e) {}

        // Fallback mobile scrollbar injection for same-origin pages
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          if (doc && !doc.getElementById('phone-sim-mobile-scrollbar-style')) {
            const style = doc.createElement('style');
            style.id = 'phone-sim-mobile-scrollbar-style';
            style.textContent = `
              html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0px !important; height: 0px !important; display: none !important; }
              html, body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
              *::-webkit-scrollbar { width: 3.5px !important; height: 3.5px !important; background-color: transparent !important; }
              *::-webkit-scrollbar-thumb { background-color: rgba(120, 120, 128, 0.45) !important; border-radius: 9999px !important; }
            `;
            (doc.head || doc.documentElement).appendChild(style);
          }
        } catch (e) {}
      });
    }

    if (screen && cursor) {
      screen.addEventListener('mousemove', (e) => {
        if (!isTouchMode || e.target.tagName === 'IFRAME') {
          cursor.style.display = 'none';
          return;
        }
        const rect = screen.getBoundingClientRect();
        const scale = currentScaleValue || 1.0;
        cursor.style.display = 'block';
        cursor.style.left = `${(e.clientX - rect.left) / scale}px`;
        cursor.style.top = `${(e.clientY - rect.top) / scale}px`;
      });
      screen.addEventListener('mouseleave', () => { cursor.style.display = 'none'; });
      screen.addEventListener('mousedown', () => { if (isTouchMode) cursor.classList.add('is-pressing'); });
      window.addEventListener('mouseup', () => { cursor.classList.remove('is-pressing'); });
    }

    return slot;
  }

  // --- Render All Active Device Slots in Canvas ---
  function renderAllDevices() {
    stageContainer.innerHTML = '';
    activeDevices.forEach(slotData => {
      const slotEl = createDeviceSlotElement(slotData);
      stageContainer.appendChild(slotEl);
    });

    // Update remove button visibility
    const removeButtons = stageContainer.querySelectorAll('.btn-col-remove');
    removeButtons.forEach(btn => {
      btn.style.display = activeDevices.length > 1 ? 'flex' : 'none';
    });

    // Update clock
    updateClock();

    // Recalculate scaling for side-by-side layout
    updateScale();

    // Update HUD
    if (activeDevices.length === 1) {
      const d = activeDevices[0].device;
      const w = activeDevices[0].isLandscape ? d.height : d.width;
      const h = activeDevices[0].isLandscape ? d.width : d.height;
      hudDimensions.textContent = `${w} × ${h} px`;
      hudDpr.textContent = `DPR ${d.dpr || 1}x`;
      deviceSelect.value = d.id;
      orientationLabel.textContent = activeDevices[0].isLandscape ? 'Landscape' : 'Portrait';
    } else {
      hudDimensions.textContent = `${activeDevices.length} Devices`;
      hudDpr.textContent = `Side-by-Side`;
    }
  }

  // --- Scale Calculation for Single & Multi-Device Side-by-Side ---
  function updateScale() {
    if (activeDevices.length === 0) return;

    const extra = isBezelVisible ? 26 : 0;
    const gap = 36;
    const headerHeight = 44; // device-column-header (30px min-height + 12px margin + 2px border)
    const stagePaddingX = 48; // 24px * 2
    const stagePaddingY = 48; // 24px * 2
    const safetyMargin = 32;  // breathing room so devices never touch edges

    // Calculate layout bounds needed across all devices
    let sumChassisW = 0;
    let maxChassisH = 0;

    const deviceDims = activeDevices.map(slot => {
      const w = slot.isLandscape ? slot.device.height : slot.device.width;
      const h = slot.isLandscape ? slot.device.width : slot.device.height;
      const chassisW = w + extra;
      const chassisH = h + extra;
      sumChassisW += chassisW;
      if (chassisH > maxChassisH) maxChassisH = chassisH;
      return { w, h, chassisW, chassisH };
    });

    const totalGaps = gap * (activeDevices.length - 1);

    let targetScale = 1.0;
    const containerW = stageContainer.clientWidth || window.innerWidth;
    const containerH = stageContainer.clientHeight || window.innerHeight;

    if (currentScale === 'fit') {
      const availW = Math.max(100, containerW - stagePaddingX - totalGaps - safetyMargin);
      const availH = Math.max(100, containerH - stagePaddingY - headerHeight - safetyMargin);

      const scaleX = availW / sumChassisW;
      const scaleY = availH / maxChassisH;
      targetScale = Math.min(scaleX, scaleY, 1.0);
      if (targetScale < 0.15) targetScale = 0.15;

      stageContainer.classList.add('is-fit-mode');
      stageContainer.style.justifyContent = 'center';
      stageContainer.scrollTop = 0;
      stageContainer.scrollLeft = 0;
    } else {
      targetScale = parseFloat(currentScale) || 1.0;
      stageContainer.classList.remove('is-fit-mode');

      const totalRenderedW = sumChassisW * targetScale + totalGaps + stagePaddingX;
      if (totalRenderedW > containerW) {
        stageContainer.style.justifyContent = 'flex-start';
      } else {
        stageContainer.style.justifyContent = 'center';
      }
    }

    currentScaleValue = targetScale;

    // Apply scale to each device slot
    const slots = stageContainer.querySelectorAll('.device-slot');
    slots.forEach((slot, index) => {
      const dims = deviceDims[index];
      if (!dims) return;

      const scaledW = Math.round(dims.chassisW * targetScale);
      const scaledH = Math.round(dims.chassisH * targetScale);

      const scaler = slot.querySelector('.device-viewport-scaler');
      const chassis = slot.querySelector('.device-chassis');
      const colHeader = slot.querySelector('.device-column-header');

      slot.style.width = `${scaledW}px`;

      if (scaler) {
        scaler.style.width = `${scaledW}px`;
        scaler.style.height = `${scaledH}px`;
      }
      if (chassis) {
        chassis.style.width = `${dims.chassisW}px`;
        chassis.style.height = `${dims.chassisH}px`;
        chassis.style.transform = `scale(${targetScale.toFixed(4)})`;
      }
      if (colHeader) {
        colHeader.style.width = `${scaledW}px`;
      }
    });

    hudZoom.textContent = `${Math.round(targetScale * 100)}%`;
  }

  // --- Global Orientation Toggle (Topbar Button) ---
  function toggleOrientation() {
    isLandscape = !isLandscape;
    activeDevices.forEach(s => {
      s.isLandscape = isLandscape;
    });
    renderAllDevices();
    showToast(`Orientation switched to ${isLandscape ? 'Landscape' : 'Portrait'}`);
  }

  // --- Bezel Mockup Toggle ---
  function toggleBezel() {
    isBezelVisible = !isBezelVisible;
    if (isBezelVisible) {
      btnToggleFrame.classList.add('is-active');
    } else {
      btnToggleFrame.classList.remove('is-active');
    }
    renderAllDevices();
  }

  // --- Touch Mode: Drag-to-Scroll & Synthetic Touch ---
  function sendTouchConfigToIframe() {
    document.querySelectorAll('.phone-iframe').forEach(iframe => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'PHONE_SIM_TOUCH_CONFIG',
            enabled: isTouchMode,
            showArrow: isMouseArrowVisible
          }, '*');
        }
      } catch (e) {}
    });
  }

  function toggleTouchMode() {
    isTouchMode = !isTouchMode;
    if (isTouchMode) {
      btnTouchMode.classList.add('is-active');
      document.body.classList.add('is-touch-mode');
      showToast('Touch simulation: ON');
    } else {
      btnTouchMode.classList.remove('is-active');
      document.body.classList.remove('is-touch-mode');
      document.querySelectorAll('.touch-cursor').forEach(c => { c.style.display = 'none'; });
      showToast('Touch simulation: OFF (desktop mouse pointer)');
    }
    sendTouchConfigToIframe();
  }

  function toggleMouseArrow() {
    isMouseArrowVisible = !isMouseArrowVisible;
    if (isMouseArrowVisible) {
      if (btnMouseArrow) btnMouseArrow.classList.add('is-active');
      document.body.classList.add('show-mouse-arrow');
      showToast('Mouse pointer: ON (arrow on touch ball)');
    } else {
      if (btnMouseArrow) btnMouseArrow.classList.remove('is-active');
      document.body.classList.remove('show-mouse-arrow');
      showToast('Mouse pointer: OFF (touch ball only)');
    }
    localStorage.setItem('phone_sim_show_arrow', isMouseArrowVisible ? 'true' : 'false');
    sendTouchConfigToIframe();
  }

  // --- Theme / Finish Switcher ---
  function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    const theme = THEMES[currentThemeIndex];
    document.querySelectorAll('.device-chassis').forEach(c => {
      c.setAttribute('data-theme', theme);
    });
    const label = theme.replace('titanium-', '').toUpperCase();
    showToast(`Bezel finish: ${label}`);
  }

  // --- View Mode: Browser vs PWA vs Fullscreen ---
  function setViewMode(mode) {
    currentViewMode = mode;
    document.querySelectorAll('.device-chassis').forEach(c => {
      c.setAttribute('data-viewmode', mode);
    });
    if (viewmodeSelect) viewmodeSelect.value = mode;
    localStorage.setItem('phone_sim_viewmode', mode);
    renderAllDevices();

    if (mode === 'browser') {
      showToast('View: Browser (Header & Footer)');
    } else if (mode === 'pwa') {
      showToast('View: PWA (Standalone app)');
    } else if (mode === 'fullscreen') {
      showToast('View: Fullscreen (Immersive)');
    }
  }

  // --- Navigation & URL Bar ---
  function normalizeUrl(input) {
    let url = input.trim();
    if (!url) return 'https://en.wikipedia.org';

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
        url = 'http://' + url;
      } else {
        url = 'https://' + url;
      }
    }
    return url;
  }

  function navigateTo(url) {
    const finalUrl = normalizeUrl(url);
    urlInput.value = finalUrl;
    protocolText.textContent = finalUrl.startsWith('https') ? 'HTTPS' : 'HTTP';
    localStorage.setItem('phone_sim_last_url', finalUrl);

    let displayUrl = 'en.wikipedia.org';
    try {
      const parsed = new URL(finalUrl);
      displayUrl = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
    } catch (e) {
      displayUrl = finalUrl.replace(/^https?:\/\//, '');
    }

    document.querySelectorAll('.mb-url-text').forEach(el => {
      el.textContent = displayUrl;
    });

    document.querySelectorAll('.phone-iframe').forEach(iframe => {
      iframe.src = finalUrl;
    });
  }

  // --- Screenshot ---
  function captureScreenshot() {
    showToast('Capturing screenshot...');
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'capture_tab' }, (response) => {
        if (response && response.dataUrl) {
          const a = document.createElement('a');
          a.href = response.dataUrl;
          a.download = `simulator-screenshot-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showToast('📸 Screenshot saved!');
        } else {
          showToast('Screenshot requires active permissions.');
        }
      });
    } else {
      showToast('Capture not supported in this environment.');
    }
  }

  // --- Real Phone QR Code Modal ---
  function openQrModal() {
    const currentUrl = urlInput.value || 'https://en.wikipedia.org';
    qrUrlText.value = currentUrl;
    if (typeof generateQRCodeSVG === 'function') {
      qrTarget.innerHTML = generateQRCodeSVG(currentUrl, 220);
    }
    modalQr.classList.add('is-open');
  }

  // --- Clock HUD in Status Bar ---
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    document.querySelectorAll('.status-time').forEach(el => {
      el.textContent = `${hours}:${minutes}`;
    });
  }

  // --- Toast Notification ---
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Device Selector change
    deviceSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'custom') {
        modalCustom.classList.add('is-open');
        return;
      }
      const dev = DEVICE_PRESETS.find(d => d.id === val);
      if (dev) {
        if (activeDevices.length > 0) {
          activeDevices[0].device = dev;
          localStorage.setItem('phone_sim_device', dev.id);
          renderAllDevices();
        } else {
          addDevice(dev);
        }
      }
    });

    // Add Device (+) Button
    if (btnAddDevice && modalAddDevice) {
      btnAddDevice.addEventListener('click', () => {
        modalAddDevice.classList.add('is-open');
      });
    }

    // Orientation Toggle
    btnOrientation.addEventListener('click', toggleOrientation);

    // View Mode (Browser vs PWA vs Fullscreen)
    if (viewmodeSelect) {
      viewmodeSelect.addEventListener('change', (e) => {
        setViewMode(e.target.value);
      });
    }

    // Zoom Scale Select
    scaleSelect.addEventListener('change', (e) => {
      currentScale = e.target.value;
      updateScale();
    });

    // Window Resize -> recalc scale if fit
    window.addEventListener('resize', () => {
      if (currentScale === 'fit') updateScale();
    });

    // Guard against unwanted scroll offsets in fit mode
    stageContainer.addEventListener('scroll', () => {
      if (currentScale === 'fit') {
        if (stageContainer.scrollTop !== 0) stageContainer.scrollTop = 0;
        if (stageContainer.scrollLeft !== 0) stageContainer.scrollLeft = 0;
      }
    });

    // Frame toggle
    btnToggleFrame.addEventListener('click', toggleBezel);

    // Touch toggle
    btnTouchMode.addEventListener('click', toggleTouchMode);

    // Mouse Arrow toggle on touch ball
    if (btnMouseArrow) {
      btnMouseArrow.addEventListener('click', toggleMouseArrow);
    }

    // Bezel Theme
    btnTheme.addEventListener('click', cycleTheme);

    // Screenshot
    btnScreenshot.addEventListener('click', captureScreenshot);

    // QR Code
    btnQr.addEventListener('click', openQrModal);

    // Custom Device modal trigger
    btnCustomDevice.addEventListener('click', () => {
      modalCustom.classList.add('is-open');
    });

    // Navigation Buttons
    navReload.addEventListener('click', () => {
      document.querySelectorAll('.phone-iframe').forEach(iframe => {
        iframe.src = iframe.src;
      });
      showToast('Reloading all devices...');
    });

    navHome.addEventListener('click', () => {
      navigateTo('https://en.wikipedia.org');
    });

    navBack.addEventListener('click', () => {
      document.querySelectorAll('.phone-iframe').forEach(iframe => {
        try {
          iframe.contentWindow.history.back();
        } catch (e) {}
      });
    });

    navForward.addEventListener('click', () => {
      document.querySelectorAll('.phone-iframe').forEach(iframe => {
        try {
          iframe.contentWindow.history.forward();
        } catch (e) {}
      });
    });

    // URL Form
    urlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      navigateTo(urlInput.value);
    });

    btnClearUrl.addEventListener('click', () => {
      urlInput.value = '';
      urlInput.focus();
    });

    // QR Modal Copy
    btnCopyUrl.addEventListener('click', () => {
      qrUrlText.select();
      navigator.clipboard.writeText(qrUrlText.value);
      showToast('URL copied to clipboard!');
    });

    // Modal Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        const targetModal = document.getElementById(modalId);
        if (targetModal) targetModal.classList.remove('is-open');
      });
    });

    // Close modal on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('is-open');
      });
    });

    // Custom Device Form Submit
    customDeviceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const customDev = {
        id: 'custom-' + Date.now(),
        name: customNameInput.value.trim() || 'Custom Viewport',
        category: 'Custom',
        width: parseInt(customWidthInput.value, 10) || 390,
        height: parseInt(customHeightInput.value, 10) || 844,
        dpr: parseFloat(customDprSelect.value) || 2.0,
        type: 'android-punch',
        os: 'Custom'
      };

      // Add to options
      const opt = document.createElement('option');
      opt.value = customDev.id;
      opt.textContent = `${customDev.name} (${customDev.width} × ${customDev.height})`;
      deviceSelect.insertBefore(opt, deviceSelect.lastElementChild);
      DEVICE_PRESETS.push(customDev);

      modalCustom.classList.remove('is-open');
      if (activeDevices.length > 0) {
        activeDevices[0].device = customDev;
        renderAllDevices();
      } else {
        addDevice(customDev);
      }
      showToast(`Custom device applied: ${customDev.width} × ${customDev.height} px`);
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        toggleOrientation();
      } else if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        document.querySelectorAll('.phone-iframe').forEach(iframe => {
          iframe.src = iframe.src;
        });
      } else if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleBezel();
      } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('is-open'));
      }
    });
  }

  // --- Initial Launch ---
  function init() {
    initDeviceList();
    initDevicePickerGrid();
    setupEventListeners();
    setViewMode(currentViewMode);
    if (isTouchMode) {
      document.body.classList.add('is-touch-mode');
    }
    if (isMouseArrowVisible) {
      document.body.classList.add('show-mouse-arrow');
      if (btnMouseArrow) btnMouseArrow.classList.add('is-active');
    } else {
      document.body.classList.remove('show-mouse-arrow');
      if (btnMouseArrow) btnMouseArrow.classList.remove('is-active');
    }

    // Initial render of devices
    renderAllDevices();

    // Check URL parameters (e.g. ?url=https://example.com)
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get('url');
    const initialUrl = paramUrl || localStorage.getItem('phone_sim_last_url') || 'https://en.wikipedia.org';
    navigateTo(initialUrl);

    // Start clock
    updateClock();
    setInterval(updateClock, 10000);

    // Initial scale calculation after DOM paint
    setTimeout(updateScale, 50);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
