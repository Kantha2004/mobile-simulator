// entrypoints/simulator/main.ts - Simulator Canvas & Controls Logic

import './style.css';
import { DEVICE_PRESETS, type DevicePreset } from '../../utils/devices';
import { generateQRCodeSVG } from '../../utils/qr';
import { getSettings } from '../../utils/settings';
import { ChromeDevToolsUI } from '../../utils/devtools-ui';

  interface ActiveDeviceSlot {
    id: string;
    device: DevicePreset;
    isLandscape: boolean;
    isLightBrowser: boolean;
    chassisTheme: string;
  }

  // --- State ---
  let activeDevices: ActiveDeviceSlot[] = []; // Array of { id, device, isLandscape, isLightBrowser, chassisTheme }
  let isLandscape = false; // Default global orientation state
  let currentScale = 'fit';
  let isBezelVisible = true;
  let isTouchMode = true;
  let isMouseArrowVisible = localStorage.getItem('phone_sim_show_arrow') !== 'false';
  let currentThemeIndex = 0;
  let currentViewMode = localStorage.getItem('phone_sim_viewmode') || 'browser';
  const THEMES = [
    { id: 'titanium-dark', name: 'Space Black', color: '#18181c', border: '#2b2b30' },
    { id: 'titanium-silver', name: 'Silver Titanium', color: '#d4d4d8', border: '#a1a1aa' },
    { id: 'titanium-natural', name: 'Natural Titanium', color: '#3f3f46', border: '#52525b' },
    { id: 'titanium-gold', name: 'Desert Gold', color: '#44372e', border: '#6e594a' },
    { id: 'midnight', name: 'Midnight Navy', color: '#11151f', border: '#222b3d' },
    { id: 'pure-white', name: 'Ceramic White', color: '#f4f4f5', border: '#d4d4d8' }
  ];
  let currentScaleValue = 1.0;

  // --- DOM Elements ---
  const deviceSelect = document.getElementById('device-select') as HTMLSelectElement | null;
  const btnAddDevice = document.getElementById('btn-add-device') as HTMLElement | null;
  const modalAddDevice = document.getElementById('modal-add-device') as HTMLElement | null;
  const devicePickerGrid = document.getElementById('device-picker-grid') as HTMLElement | null;

  const viewmodeSelect = document.getElementById('viewmode-select') as HTMLSelectElement | null;
  const btnOrientation = document.getElementById('btn-orientation') as HTMLElement | null;
  const orientationLabel = document.getElementById('orientation-label') as HTMLElement | null;
  const scaleSelect = document.getElementById('scale-select') as HTMLSelectElement | null;
  const btnToggleFrame = document.getElementById('btn-toggle-frame') as HTMLElement | null;
  const btnTouchMode = document.getElementById('btn-touch-mode') as HTMLElement | null;
  const btnMouseArrow = document.getElementById('btn-mouse-arrow') as HTMLElement | null;
  const btnTheme = document.getElementById('btn-theme') as HTMLElement | null;
  const btnScreenshot = document.getElementById('btn-screenshot') as HTMLElement | null;
  const btnQr = document.getElementById('btn-qr') as HTMLElement | null;
  const btnCustomDevice = document.getElementById('btn-custom-device') as HTMLElement | null;
  const btnSettings = document.getElementById('btn-settings') as HTMLElement | null;
  const btnToggleDevtools = document.getElementById('btn-toggle-devtools') as HTMLElement | null;

  // --- Chrome DevTools State ---
  let devToolsUI: ChromeDevToolsUI | null = null;
  let isDevToolsDockOpen = false;
  let activeDevToolsSlotIndex = 0;
  const devtoolsChannel = new BroadcastChannel('phone_sim_devtools');

  function initDevToolsDock() {
    const dockContainer = document.getElementById('devtools-dock-container');
    const dockBody = document.getElementById('devtools-dock-body');
    const resizer = document.getElementById('devtools-resizer');
    const btnToggle = document.getElementById('btn-toggle-devtools');

    if (!dockContainer || !dockBody || devToolsUI) return;

    devToolsUI = new ChromeDevToolsUI(dockBody, {
      isPopup: false,
      onClose: () => {
        closeDevToolsDock();
      },
      onUndock: () => {
        openDevToolsPopup(activeDevToolsSlotIndex);
        closeDevToolsDock();
      },
      sendCommandToDevice: (slotIndex, command) => {
        sendDevToolsCommandToSlot(slotIndex, command);
      },
      getActiveDevices: () => {
        return activeDevices.map((d, i) => {
          const slotEl = stageContainer ? stageContainer.querySelectorAll('.device-column')[i] : null;
          const iframe = slotEl ? (slotEl.querySelector('.phone-iframe') as HTMLIFrameElement | null) : null;
          return { index: i, name: d.device.name, url: iframe?.src || urlInput?.value || 'https://en.wikipedia.org' };
        });
      }
    });

    if (resizer) {
      let isDragging = false;
      let startY = 0;
      let startH = 350;

      resizer.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startH = dockContainer.getBoundingClientRect().height;
        resizer.classList.add('is-dragging');
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const delta = startY - e.clientY;
        const newH = Math.min(window.innerHeight * 0.85, Math.max(140, startH + delta));
        dockContainer.style.height = `${newH}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          resizer.classList.remove('is-dragging');
          document.body.style.cursor = '';
        }
      });
    }

    btnToggle?.addEventListener('click', () => {
      toggleDevToolsDock();
    });
  }

  function toggleDevToolsDock(slotIndex?: number) {
    const dockContainer = document.getElementById('devtools-dock-container');
    const btnToggle = document.getElementById('btn-toggle-devtools');
    if (!dockContainer) return;

    if (typeof slotIndex === 'number') {
      activeDevToolsSlotIndex = slotIndex;
    }

    isDevToolsDockOpen = !isDevToolsDockOpen;
    dockContainer.style.display = isDevToolsDockOpen ? 'flex' : 'none';
    btnToggle?.classList.toggle('is-active', isDevToolsDockOpen);

    if (isDevToolsDockOpen) {
      if (!devToolsUI) initDevToolsDock();
      devToolsUI?.setActiveDevice(activeDevToolsSlotIndex);
      updateDevToolsDevices();
    }
  }

  function closeDevToolsDock() {
    const dockContainer = document.getElementById('devtools-dock-container');
    const btnToggle = document.getElementById('btn-toggle-devtools');
    if (!dockContainer) return;
    isDevToolsDockOpen = false;
    dockContainer.style.display = 'none';
    btnToggle?.classList.remove('is-active');
  }

  function openDevToolsPopup(slotIndex: number) {
    const url = chrome.runtime.getURL(`devtools.html?slot=${slotIndex}`);
    if (typeof chrome !== 'undefined' && chrome.windows && chrome.windows.create) {
      chrome.windows.create({
        url,
        width: 960,
        height: 640,
        type: 'popup',
        focused: true
      });
    } else {
      window.open(url, '_blank', 'width=960,height=640');
    }
  }

  function sendDevToolsCommandToSlot(slotIndex: number, command: any) {
    const colElements = stageContainer?.querySelectorAll('.device-column');
    if (colElements && colElements[slotIndex]) {
      const iframe = colElements[slotIndex].querySelector<HTMLIFrameElement>('.phone-iframe');
      try {
        iframe?.contentWindow?.postMessage({
          type: 'PHONE_SIM_DEVTOOLS_COMMAND',
          command
        }, '*');
      } catch (e) {}
    }
  }

  function updateDevToolsDevices() {
    const devicesList = activeDevices.map((d, i) => {
      const slotEl = stageContainer ? stageContainer.querySelectorAll('.device-column')[i] : null;
      const iframe = slotEl ? (slotEl.querySelector('.phone-iframe') as HTMLIFrameElement | null) : null;
      return { index: i, name: d.device.name, url: iframe?.src || urlInput?.value || 'https://en.wikipedia.org' };
    });

    devtoolsChannel.postMessage({
      type: 'SIM_DEVICE_LIST_UPDATE',
      devices: devicesList
    });
  }

  // Listen for iframe devtools events
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'PHONE_SIM_DEVTOOLS_EVENT') {
      let senderSlotIndex = 0;
      const colElements = stageContainer ? stageContainer.querySelectorAll('.device-column') : [];
      colElements.forEach((col, idx) => {
        const ifr = col.querySelector('.phone-iframe') as HTMLIFrameElement | null;
        if (ifr?.contentWindow === e.source) {
          senderSlotIndex = idx;
        }
      });

      if (isDevToolsDockOpen && devToolsUI) {
        devToolsUI.handleDeviceEvent(senderSlotIndex, e.data);
      }

      devtoolsChannel.postMessage({
        type: 'SIM_TO_DEVTOOLS_EVENT',
        slotIndex: senderSlotIndex,
        event: e.data
      });
    }
  });

  // Listen for popup window devtools commands
  devtoolsChannel.onmessage = (e) => {
    if (!e.data) return;
    if (e.data.type === 'DEVTOOLS_TO_SIM_COMMAND') {
      sendDevToolsCommandToSlot(e.data.slotIndex, e.data.command);
    } else if (e.data.type === 'DEVTOOLS_READY_REQUEST_DEVICES') {
      updateDevToolsDevices();
    }
  };

  const navBack = document.getElementById('btn-back') as HTMLElement | null;
  const navForward = document.getElementById('btn-forward') as HTMLElement | null;
  const navReload = document.getElementById('btn-reload') as HTMLElement | null;
  const navHome = document.getElementById('btn-home') as HTMLElement | null;

  const urlForm = document.getElementById('url-form') as HTMLFormElement | null;
  const urlInput = document.getElementById('url-input') as HTMLInputElement | null;
  const btnClearUrl = document.getElementById('btn-clear-url') as HTMLElement | null;
  const protocolText = document.getElementById('protocol-text') as HTMLElement | null;

  const hudDimensions = document.getElementById('hud-dimensions') as HTMLElement | null;
  const hudDpr = document.getElementById('hud-dpr') as HTMLElement | null;
  const hudZoom = document.getElementById('hud-zoom') as HTMLElement | null;

  const stageContainer = document.getElementById('stage-container') as HTMLElement | null;

  // Modals
  const modalQr = document.getElementById('modal-qr') as HTMLElement | null;
  const qrTarget = document.getElementById('qr-target') as HTMLElement | null;
  const qrUrlText = document.getElementById('qr-url-text') as HTMLInputElement | null;
  const btnCopyUrl = document.getElementById('btn-copy-url') as HTMLElement | null;

  const modalCustom = document.getElementById('modal-custom') as HTMLElement | null;
  const customDeviceForm = document.getElementById('custom-device-form') as HTMLFormElement | null;
  const customWidthInput = document.getElementById('custom-width') as HTMLInputElement | null;
  const customHeightInput = document.getElementById('custom-height') as HTMLInputElement | null;
  const customDprSelect = document.getElementById('custom-dpr') as HTMLSelectElement | null;
  const customNameInput = document.getElementById('custom-name') as HTMLInputElement | null;

  const toastContainer = document.getElementById('toast-container') as HTMLElement | null;

  // --- Initialize Device Selector Dropdown ---
  const CATEGORY_ORDER = [
    'Apple iPhone',
    'Android Phones',
    'Tablets',
    'Laptops',
    'Monitors & Desktops'
  ];

  // --- Initialize Device Selector Dropdown ---
  function initDeviceList() {
    const categories = {};
    DEVICE_PRESETS.forEach(dev => {
      const cat = dev.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(dev);
    });

    deviceSelect.innerHTML = '';

    // Sort categories according to CATEGORY_ORDER
    const sortedCatNames = Object.keys(categories).sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a);
      const idxB = CATEGORY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    sortedCatNames.forEach(catName => {
      const devices = categories[catName];
      const group = document.createElement('optgroup');
      group.label = `${catName} (${devices.length})`;
      devices.forEach(dev => {
        const opt = document.createElement('option');
        opt.value = dev.id;
        opt.textContent = `${dev.name} (${dev.width} Ã— ${dev.height})`;
        if (dev.default) opt.selected = true;
        group.appendChild(opt);
      });
      deviceSelect.appendChild(group);
    });

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
        isLightBrowser: false,
        chassisTheme: 'titanium-dark'
      }
    ];

    deviceSelect.value = found.id;
  }

  // --- Populate Modal Device Picker Grid with Search & Category Filters ---
  let activePickerCategory = 'all';
  let activePickerSearch = '';

  function renderDevicePickerGrid() {
    if (!devicePickerGrid) return;
    devicePickerGrid.innerHTML = '';

    const query = activePickerSearch.trim().toLowerCase();
    const filtered = DEVICE_PRESETS.filter(dev => {
      const matchCat = (activePickerCategory === 'all') || (dev.category === activePickerCategory);
      if (!matchCat) return false;
      if (!query) return true;
      const hay = `${dev.name} ${dev.category} ${dev.os || ''} ${dev.type || ''} ${dev.width}x${dev.height}`.toLowerCase();
      return hay.includes(query);
    });

    if (filtered.length === 0) {
      devicePickerGrid.innerHTML = `
        <div class="picker-no-results">
          <p>No matching devices found</p>
          <span>Try a different search term or category chip.</span>
        </div>
      `;
      return;
    }

    filtered.forEach(dev => {
      const card = document.createElement('div');
      card.className = 'device-picker-card';
      const typeLabel = (dev.type || 'phone').replace('iphone-', '').replace('android-', '');
      card.innerHTML = `
        <div class="picker-card-header">
          <span class="picker-card-category">${dev.category}</span>
          <span class="picker-card-type-badge">${typeLabel}</span>
        </div>
        <span class="picker-card-name">${dev.name}</span>
        <span class="picker-card-dims">${dev.width} Ã— ${dev.height} px Â· DPR ${dev.dpr || 1}x</span>
      `;
      card.addEventListener('click', () => {
        addDevice(dev);
        if (modalAddDevice) modalAddDevice.classList.remove('is-open');
      });
      devicePickerGrid.appendChild(card);
    });
  }

  function initDevicePickerGrid() {
    renderDevicePickerGrid();

    const searchInput = document.getElementById('picker-search-input') as HTMLInputElement | null;
    const clearBtn = document.getElementById('btn-clear-picker-search') as HTMLElement | null;
    const chipContainer = document.getElementById('picker-filter-chips') as HTMLElement | null;

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        activePickerSearch = (e.target as HTMLInputElement).value;
        if (clearBtn) clearBtn.style.display = activePickerSearch ? 'block' : 'none';
        renderDevicePickerGrid();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        activePickerSearch = '';
        clearBtn.style.display = 'none';
        renderDevicePickerGrid();
        searchInput.focus();
      });
    }

    if (chipContainer) {
      chipContainer.addEventListener('click', (e) => {
        const chip = (e.target as HTMLElement).closest('.picker-chip') as HTMLElement | null;
        if (!chip) return;
        chipContainer.querySelectorAll('.picker-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        activePickerCategory = chip.dataset.cat || 'all';
        renderDevicePickerGrid();
      });
    }
  }

  // --- Multi-Device: Add New Device Slot Side-by-Side ---
  function addDevice(preset) {
    const prevSlot = activeDevices.length > 0 ? activeDevices[activeDevices.length - 1] : null;
    const newSlot = {
      id: 'slot-' + Date.now() + Math.random().toString(36).substr(2, 4),
      device: preset,
      isLandscape: isLandscape,
      isLightBrowser: prevSlot ? prevSlot.isLightBrowser : false,
      chassisTheme: prevSlot ? prevSlot.chassisTheme : 'titanium-dark'
    };
    activeDevices.push(newSlot);
    renderAllDevices();
    updateDevToolsDevices();
    showToast(`Added ${preset.name} side-by-side!`);
  }

  // --- Multi-Device: Remove Device Slot ---
  function removeDevice(slotId) {
    if (activeDevices.length <= 1) return;
    const removed = activeDevices.find(s => s.id === slotId);
    activeDevices = activeDevices.filter(s => s.id !== slotId);
    renderAllDevices();
    updateDevToolsDevices();
    if (removed) {
      showToast(`Removed ${removed.device.name}`);
    }
  }

  // Helper: Theme SVG Icon (Sun for Light mode, Moon for Dark mode)
  function getThemeIconSvg(isLight) {
    if (isLight) {
      return '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
    }
    return '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
  }

  // --- Create DOM Element for Single Device Slot ---
  function createDeviceSlotElement(slotData: ActiveDeviceSlot, slotIndex: number) {
    const { id, device, isLandscape: slotLandscape, isLightBrowser, chassisTheme: slotChassisTheme } = slotData;
    const isLight = !!isLightBrowser;
    const currentTheme = slotChassisTheme || (isLight ? 'titanium-silver' : 'titanium-dark');
    const currentThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0];
    const w = slotLandscape ? device.height : device.width;
    const h = slotLandscape ? device.width : device.height;

    const currentUrl = urlInput?.value || localStorage.getItem('phone_sim_last_url') || 'https://en.wikipedia.org';
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
          <span class="device-col-dims">${w} &times; ${h}</span>
        </div>
        <div class="device-col-actions">
          <!-- Per-Device Light / Dark Theme Mode Toggle -->
          <button class="device-col-btn btn-col-theme-toggle" title="${isLight ? 'Theme: Light (Click for Dark Theme)' : 'Theme: Dark (Click for Light Theme)'}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${getThemeIconSvg(isLight)}
            </svg>
          </button>

          <!-- Per-Device Chassis Bezel Finish Swatch -->
          <button class="device-col-btn btn-col-chassis-finish" title="Bezel Finish: ${currentThemeObj.name} (Click to switch)">
            <span class="col-theme-dot" style="background-color: ${currentThemeObj.color}; border: 1.5px solid ${currentThemeObj.border};"></span>
          </button>

          <!-- Per-Device DevTools: Toggle In-Frame Console/Elements -->
          <button class="device-col-btn btn-col-devtools" title="Toggle Mobile DevTools (Console, Elements, Network)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </button>

          <!-- Inspect in External Native DevTools Window -->
          <button class="device-col-btn btn-col-inspect-window" title="Inspect in Native Chrome DevTools Window (F12)">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>

          <!-- Rotate Device -->
          <button class="device-col-btn btn-col-rotate" title="Rotate Device (${slotLandscape ? 'Landscape' : 'Portrait'})">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
              <rect x="8.5" y="6.5" width="7" height="11" rx="1.5"/>
            </svg>
          </button>

          <!-- Remove Device -->
          <button class="device-col-btn btn-col-remove" title="Remove Device" style="${activeDevices.length > 1 ? '' : 'display:none;'}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="device-viewport-scaler">
        <div class="device-chassis ${slotLandscape ? 'is-landscape' : ''} ${!isBezelVisible ? 'is-frameless' : ''} ${isLight ? 'is-light-browser' : ''}"
             data-type="${device.type || 'iphone-island'}"
             data-theme="${currentTheme}"
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
              <div class="laptop-webcam">
                <span class="webcam-dot"></span>
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
              <!-- Browser Header -->
              <div class="mobile-browser-header">
                <!-- Desktop Window Controls (Visible on Laptop & Monitor) -->
                <div class="desktop-window-controls">
                  <span class="win-btn win-close" title="Close"></span>
                  <span class="win-btn win-min" title="Minimize"></span>
                  <span class="win-btn win-max" title="Maximize"></span>
                </div>

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
                  <button class="mb-btn mb-btn-devtools" title="Toggle In-Device Mobile DevTools">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="16 18 22 12 16 6"/>
                      <polyline points="8 6 2 12 8 18"/>
                    </svg>
                  </button>
                  <button class="mb-btn mb-btn-theme-toggle" title="${isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      ${getThemeIconSvg(isLight)}
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

          <!-- Laptop Base Hinge / Notch -->
          <div class="laptop-base-notch">
            <div class="laptop-notch-indent"></div>
          </div>

          <!-- Monitor Stand -->
          <div class="monitor-stand">
            <div class="monitor-stand-neck"></div>
            <div class="monitor-stand-base"></div>
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

    // Helper: Toggle Device Light/Dark Theme Mode
    function toggleSlotTheme() {
      slotData.isLightBrowser = !slotData.isLightBrowser;
      const isNowLight = slotData.isLightBrowser;
      const chassis = slot.querySelector<HTMLElement>('.device-chassis');
      const iframeEl = slot.querySelector<HTMLIFrameElement>('.phone-iframe');

      if (chassis) {
        chassis.classList.toggle('is-light-browser', isNowLight);
        if (isNowLight && (!slotData.chassisTheme || slotData.chassisTheme === 'titanium-dark')) {
          slotData.chassisTheme = 'titanium-silver';
          chassis.setAttribute('data-theme', 'titanium-silver');
        } else if (!isNowLight && (!slotData.chassisTheme || slotData.chassisTheme === 'titanium-silver')) {
          slotData.chassisTheme = 'titanium-dark';
          chassis.setAttribute('data-theme', 'titanium-dark');
        }
      }

      // Update finish dot
      const dot = slot.querySelector<HTMLElement>('.col-theme-dot');
      const curObj = THEMES.find(t => t.id === slotData.chassisTheme) || THEMES[0];
      if (dot && curObj) {
        dot.style.backgroundColor = curObj.color;
        dot.style.borderColor = curObj.border;
      }
      const finishBtn = slot.querySelector<HTMLElement>('.btn-col-chassis-finish');
      if (finishBtn && curObj) {
        finishBtn.title = `Bezel Finish: ${curObj.name} (Click to switch)`;
      }

      // Update toggle button icon & tooltip
      const toggleBtn = slot.querySelector<HTMLElement>('.btn-col-theme-toggle');
      if (toggleBtn) {
        toggleBtn.title = isNowLight ? 'Theme: Light (Click to switch to Dark)' : 'Theme: Dark (Click to switch to Light)';
        toggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${getThemeIconSvg(isNowLight)}
          </svg>
        `;
      }

      const mbThemeBtn = slot.querySelector<HTMLElement>('.mb-btn-theme-toggle');
      if (mbThemeBtn) {
        mbThemeBtn.title = isNowLight ? 'Switch to Dark Theme' : 'Switch to Light Theme';
        mbThemeBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${getThemeIconSvg(isNowLight)}
          </svg>
        `;
      }

      // Send to iframe
      const scheme = isNowLight ? 'light' : 'dark';
      if (iframeEl) {
        try {
          iframeEl.contentWindow?.postMessage({
            type: 'PHONE_SIM_THEME_CONFIG',
            colorScheme: scheme
          }, '*');
        } catch (e) {}

        try {
          const doc = iframeEl.contentDocument || iframeEl.contentWindow?.document;
          if (doc) {
            let style = doc.getElementById('phone-sim-color-scheme-override');
            if (!style) {
              style = doc.createElement('style');
              style.id = 'phone-sim-color-scheme-override';
              (doc.head || doc.documentElement).appendChild(style);
            }
            style.textContent = `:root { color-scheme: ${scheme} !important; }`;
            doc.documentElement.classList.toggle('dark', !isNowLight);
            doc.documentElement.classList.toggle('light', isNowLight);
            doc.documentElement.setAttribute('data-theme', scheme);
            doc.documentElement.setAttribute('data-color-scheme', scheme);
          }
        } catch (e) {}
      }

      showToast(`${device.name}: ${isNowLight ? 'Light Theme' : 'Dark Theme'}`);
    }

    // Helper: Cycle Bezel Finish for this device
    function cycleSlotChassis() {
      const curIdx = THEMES.findIndex(t => t.id === slotData.chassisTheme);
      const nextIdx = (curIdx + 1) % THEMES.length;
      const nextTheme = THEMES[nextIdx];
      slotData.chassisTheme = nextTheme.id;

      const chassis = slot.querySelector<HTMLElement>('.device-chassis');
      if (chassis) {
        chassis.setAttribute('data-theme', nextTheme.id);
      }

      const dot = slot.querySelector<HTMLElement>('.col-theme-dot');
      if (dot) {
        dot.style.backgroundColor = nextTheme.color;
        dot.style.borderColor = nextTheme.border;
      }
      const finishBtn = slot.querySelector<HTMLElement>('.btn-col-chassis-finish');
      if (finishBtn) {
        finishBtn.title = `Bezel Finish: ${nextTheme.name} (Click to switch)`;
      }
      showToast(`${device.name}: ${nextTheme.name} finish`);
    }

    const btnThemeToggle = slot.querySelector<HTMLElement>('.btn-col-theme-toggle');
    if (btnThemeToggle) btnThemeToggle.addEventListener('click', toggleSlotTheme);

    const mbBtnThemeToggle = slot.querySelector<HTMLElement>('.mb-btn-theme-toggle');
    if (mbBtnThemeToggle) mbBtnThemeToggle.addEventListener('click', toggleSlotTheme);

    const btnChassisFinish = slot.querySelector<HTMLElement>('.btn-col-chassis-finish');
    if (btnChassisFinish) btnChassisFinish.addEventListener('click', cycleSlotChassis);

    // Chrome DevTools Toggle (Docked Container)
    const btnDevtools = slot.querySelector<HTMLElement>('.btn-col-devtools');
    const mbBtnDevtools = slot.querySelector<HTMLElement>('.mb-btn-devtools');
    function toggleSlotDevtools() {
      toggleDevToolsDock(slotIndex);
      showToast(`${device.name}: Inspected in Chrome DevTools`);
    }
    if (btnDevtools) btnDevtools.addEventListener('click', toggleSlotDevtools);
    if (mbBtnDevtools) mbBtnDevtools.addEventListener('click', toggleSlotDevtools);

    // Chrome DevTools in Dedicated Popup Window
    const btnInspectWindow = slot.querySelector<HTMLElement>('.btn-col-inspect-window');
    if (btnInspectWindow) {
      btnInspectWindow.title = "Open Chrome DevTools in Dedicated Popup Window";
      btnInspectWindow.addEventListener('click', () => {
        openDevToolsPopup(slotIndex);
        showToast(`Opened ${device.name} in Dedicated Chrome DevTools Popup!`);
      });
    }

    const inReload = slot.querySelector<HTMLElement>('.mb-btn-reload');
    if (inReload) {
      inReload.addEventListener('click', () => {
        const iframe = slot.querySelector<HTMLIFrameElement>('.phone-iframe');
        if (iframe) iframe.src = iframe.src;
      });
    }

    const inBack = slot.querySelector<HTMLElement>('.mb-nav-btn.mb-btn-back');
    if (inBack) {
      inBack.addEventListener('click', () => {
        const iframe = slot.querySelector<HTMLIFrameElement>('.phone-iframe');
        try { if (iframe) iframe.contentWindow?.history.back(); } catch (e) {}
      });
    }

    const inForward = slot.querySelector<HTMLElement>('.mb-nav-btn.mb-btn-forward');
    if (inForward) {
      inForward.addEventListener('click', () => {
        const iframe = slot.querySelector<HTMLIFrameElement>('.phone-iframe');
        try { if (iframe) iframe.contentWindow?.history.forward(); } catch (e) {}
      });
    }

    // Touch and Iframe Setup
    const iframe = slot.querySelector<HTMLIFrameElement>('.phone-iframe');
    const cursor = slot.querySelector<HTMLElement>('.touch-cursor');
    const screen = slot.querySelector<HTMLElement>('.screen-wrapper');

    if (iframe) {
      iframe.addEventListener('load', () => {
        const isLight = !!slotData.isLightBrowser;
        const scheme = isLight ? 'light' : 'dark';
        try {
          iframe.contentWindow?.postMessage({
            type: 'PHONE_SIM_TOUCH_CONFIG',
            enabled: isTouchMode,
            showArrow: isMouseArrowVisible,
            colorScheme: scheme
          }, '*');
        } catch (e) {}

        // Fallback mobile scrollbar injection & color-scheme for same-origin pages
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            if (!doc.getElementById('phone-sim-mobile-scrollbar-style')) {
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

            let themeStyle = doc.getElementById('phone-sim-color-scheme-override');
            if (!themeStyle) {
              themeStyle = doc.createElement('style');
              themeStyle.id = 'phone-sim-color-scheme-override';
              (doc.head || doc.documentElement).appendChild(themeStyle);
            }
            themeStyle.textContent = `:root { color-scheme: ${scheme} !important; }`;
            doc.documentElement.classList.toggle('dark', !isLight);
            doc.documentElement.classList.toggle('light', isLight);
            doc.documentElement.setAttribute('data-theme', scheme);
            doc.documentElement.setAttribute('data-color-scheme', scheme);
          }
        } catch (e) {}
      });
    }

    if (screen && cursor) {
      screen.addEventListener('mousemove', (e: MouseEvent) => {
        if (!isTouchMode || (e.target as HTMLElement).tagName === 'IFRAME') {
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
    if (stageContainer) stageContainer.innerHTML = '';
    activeDevices.forEach((slotData, idx) => {
      const slotEl = createDeviceSlotElement(slotData, idx);
      if (stageContainer) stageContainer.appendChild(slotEl);
    });

    // Update remove button visibility
    const removeButtons = stageContainer ? stageContainer.querySelectorAll<HTMLElement>('.btn-col-remove') : [];
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
      if (hudDimensions) hudDimensions.textContent = `${w} × ${h} px`;
      if (hudDpr) hudDpr.textContent = `DPR ${d.dpr || 1}x`;
      if (deviceSelect) deviceSelect.value = d.id;
      if (orientationLabel) orientationLabel.textContent = activeDevices[0].isLandscape ? 'Landscape' : 'Portrait';
    } else {
      if (hudDimensions) hudDimensions.textContent = `${activeDevices.length} Devices`;
      if (hudDpr) hudDpr.textContent = `Side-by-Side`;
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
      const isMonitor = slot.device.type === 'monitor';
      const isLaptop = slot.device.type === 'laptop';
      const extraX = isBezelVisible ? (isMonitor ? 16 : (isLaptop ? 24 : 26)) : 0;
      const extraY = isBezelVisible ? (isMonitor ? 74 : (isLaptop ? 32 : 26)) : 0;
      const chassisW = w + extraX;
      const chassisH = h + extraY;
      const frameW = isBezelVisible ? (isMonitor ? w + 16 : (isLaptop ? w + 24 : chassisW)) : w;
      const frameH = isBezelVisible ? (isMonitor ? h + 16 : (isLaptop ? h + 24 : chassisH)) : h;
      sumChassisW += chassisW;
      if (chassisH > maxChassisH) maxChassisH = chassisH;
      return { w, h, chassisW, chassisH, frameW, frameH };
    });

    const totalGaps = gap * (activeDevices.length - 1);

    let targetScale = 1.0;
    const containerW = stageContainer?.clientWidth || window.innerWidth;
    const containerH = stageContainer?.clientHeight || window.innerHeight;

    if (currentScale === 'fit') {
      const availW = Math.max(100, containerW - stagePaddingX - totalGaps - safetyMargin);
      const availH = Math.max(100, containerH - stagePaddingY - headerHeight - safetyMargin);

      const scaleX = availW / sumChassisW;
      const scaleY = availH / maxChassisH;
      targetScale = Math.min(scaleX, scaleY, 1.0);
      if (targetScale < 0.15) targetScale = 0.15;

      if (stageContainer) {
        stageContainer.classList.add('is-fit-mode');
        stageContainer.style.justifyContent = 'center';
        stageContainer.scrollTop = 0;
        stageContainer.scrollLeft = 0;
      }
    } else {
      targetScale = parseFloat(currentScale) || 1.0;
      if (stageContainer) {
        stageContainer.classList.remove('is-fit-mode');

        const totalRenderedW = sumChassisW * targetScale + totalGaps + stagePaddingX;
        if (totalRenderedW > containerW) {
          stageContainer.style.justifyContent = 'flex-start';
        } else {
          stageContainer.style.justifyContent = 'center';
        }
      }
    }

    currentScaleValue = targetScale;

    // Apply scale to each device slot
    const slots = stageContainer ? stageContainer.querySelectorAll<HTMLElement>('.device-slot') : [];
    slots.forEach((slot, index) => {
      const dims = deviceDims[index];
      if (!dims) return;

      const scaledW = Math.round(dims.chassisW * targetScale);
      const scaledH = Math.round(dims.chassisH * targetScale);

      const scaler = slot.querySelector('.device-viewport-scaler') as HTMLElement | null;
      const chassis = slot.querySelector('.device-chassis') as HTMLElement | null;
      const colHeader = slot.querySelector('.device-column-header') as HTMLElement | null;

      slot.style.width = `${scaledW}px`;

      if (scaler) {
        scaler.style.width = `${scaledW}px`;
        scaler.style.height = `${scaledH}px`;
      }
      if (chassis) {
        chassis.style.width = `${dims.frameW}px`;
        chassis.style.height = `${dims.frameH}px`;
        chassis.style.transform = `scale(${targetScale.toFixed(4)})`;
      }
      if (colHeader) {
        colHeader.style.width = `${scaledW}px`;
      }
    });

    if (hudZoom) hudZoom.textContent = `${Math.round(targetScale * 100)}%`;
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
      btnToggleFrame?.classList.add('is-active');
    } else {
      btnToggleFrame?.classList.remove('is-active');
    }
    renderAllDevices();
  }

  // --- Touch Mode: Drag-to-Scroll & Synthetic Touch ---
  function sendTouchConfigToIframe() {
    document.querySelectorAll<HTMLIFrameElement>('.phone-iframe').forEach(iframe => {
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
      btnTouchMode?.classList.add('is-active');
      document.body.classList.add('is-touch-mode');
      showToast('Touch simulation: ON');
    } else {
      btnTouchMode?.classList.remove('is-active');
      document.body.classList.remove('is-touch-mode');
      document.querySelectorAll<HTMLElement>('.touch-cursor').forEach(c => { c.style.display = 'none'; });
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
    activeDevices.forEach(slotData => {
      slotData.chassisTheme = theme.id;
    });
    document.querySelectorAll('.device-chassis').forEach(c => {
      c.setAttribute('data-theme', theme.id);
    });
    document.querySelectorAll<HTMLElement>('.btn-col-chassis-finish').forEach(btn => {
      const dot = btn.querySelector<HTMLElement>('.col-theme-dot');
      if (dot) {
        dot.style.backgroundColor = theme.color;
        dot.style.borderColor = theme.border;
      }
      btn.title = `Bezel Finish: ${theme.name} (Click to switch)`;
    });
    showToast(`All devices: ${theme.name} bezel`);
  }

  // --- View Mode: Browser vs PWA vs Fullscreen ---
  function setViewMode(mode: string) {
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
  function normalizeUrl(input: string) {
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

  function navigateTo(url: string) {
    const finalUrl = normalizeUrl(url);
    if (urlInput) urlInput.value = finalUrl;
    if (protocolText) protocolText.textContent = finalUrl.startsWith('https') ? 'HTTPS' : 'HTTP';
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

    document.querySelectorAll<HTMLIFrameElement>('.phone-iframe').forEach(iframe => {
      iframe.src = finalUrl;
    });
  }

  // --- Screenshot ---
  function captureScreenshot() {
    showToast('Capturing screenshot...');
    if (typeof chrome !== 'undefined' && chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'capture_tab' }, (response: any) => {
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
    const currentUrl = urlInput?.value || 'https://en.wikipedia.org';
    if (qrUrlText) qrUrlText.value = currentUrl;
    if (qrTarget && typeof generateQRCodeSVG === 'function') {
      qrTarget.innerHTML = generateQRCodeSVG(currentUrl, 220);
    }
    modalQr?.classList.add('is-open');
  }

  // --- Clock HUD in Status Bar ---
  function updateClock() {
    const now = new Date();
    const rawHours = now.getHours();
    const hours = rawHours % 12 || 12;
    const rawMinutes = now.getMinutes();
    const minutes = rawMinutes < 10 ? '0' + rawMinutes : String(rawMinutes);
    document.querySelectorAll('.status-time').forEach(el => {
      el.textContent = `${hours}:${minutes}`;
    });
  }

  // --- Toast Notification ---
  function showToast(message: string) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (toastContainer) toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Device Selector change
    if (deviceSelect) {
      deviceSelect.addEventListener('change', (e) => {
        const val = (e.target as HTMLSelectElement).value;
        if (val === 'custom') {
          modalCustom?.classList.add('is-open');
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
    }

    // Add Device (+) Button
    if (btnAddDevice && modalAddDevice) {
      btnAddDevice.addEventListener('click', () => {
        modalAddDevice.classList.add('is-open');
      });
    }

    // Orientation Toggle
    btnOrientation?.addEventListener('click', toggleOrientation);

    // View Mode (Browser vs PWA vs Fullscreen)
    if (viewmodeSelect) {
      viewmodeSelect.addEventListener('change', (e) => {
        setViewMode((e.target as HTMLSelectElement).value);
      });
    }

    // Zoom Scale Select
    if (scaleSelect) {
      scaleSelect.addEventListener('change', (e) => {
        currentScale = (e.target as HTMLSelectElement).value;
        updateScale();
      });
    }

    // Window Resize -> recalc scale if fit
    window.addEventListener('resize', () => {
      if (currentScale === 'fit') updateScale();
    });

    // Guard against unwanted scroll offsets in fit mode
    if (stageContainer) {
      stageContainer.addEventListener('scroll', () => {
        if (currentScale === 'fit') {
          if (stageContainer.scrollTop !== 0) stageContainer.scrollTop = 0;
          if (stageContainer.scrollLeft !== 0) stageContainer.scrollLeft = 0;
        }
      });
    }

    // Frame toggle
    btnToggleFrame?.addEventListener('click', toggleBezel);

    // Touch toggle
    btnTouchMode?.addEventListener('click', toggleTouchMode);

    // Mouse Arrow toggle on touch ball
    if (btnMouseArrow) {
      btnMouseArrow.addEventListener('click', toggleMouseArrow);
    }

    // Bezel Theme
    btnTheme?.addEventListener('click', cycleTheme);

    // Screenshot
    btnScreenshot?.addEventListener('click', captureScreenshot);

    // QR Code
    btnQr?.addEventListener('click', openQrModal);

    // Custom Device modal trigger
    btnCustomDevice?.addEventListener('click', () => {
      modalCustom?.classList.add('is-open');
    });

    // Settings Page trigger
    btnSettings?.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open('options.html', '_blank');
      }
    });

    // Navigation Buttons
    navReload?.addEventListener('click', () => {
      document.querySelectorAll<HTMLIFrameElement>('.phone-iframe').forEach(iframe => {
        iframe.src = iframe.src;
      });
      showToast('Reloading all devices...');
    });

    navHome?.addEventListener('click', () => {
      navigateTo('https://en.wikipedia.org');
    });

    navBack?.addEventListener('click', () => {
      document.querySelectorAll<HTMLIFrameElement>('.phone-iframe').forEach(iframe => {
        try {
          iframe.contentWindow?.history.back();
        } catch (e) {}
      });
    });

    navForward?.addEventListener('click', () => {
      document.querySelectorAll<HTMLIFrameElement>('.phone-iframe').forEach(iframe => {
        try {
          iframe.contentWindow?.history.forward();
        } catch (e) {}
      });
    });

    // URL Form
    urlForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (urlInput) navigateTo(urlInput.value);
    });

    btnClearUrl?.addEventListener('click', () => {
      if (urlInput) {
        urlInput.value = '';
        urlInput.focus();
      }
    });

    // QR Modal Copy
    btnCopyUrl?.addEventListener('click', () => {
      if (qrUrlText) {
        qrUrlText.select();
        navigator.clipboard.writeText(qrUrlText.value);
        showToast('URL copied to clipboard!');
      }
    });

    // Modal Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        if (modalId) {
          const targetModal = document.getElementById(modalId);
          if (targetModal) targetModal.classList.remove('is-open');
        }
      });
    });

    // Close modal on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('is-open');
      });
    });

    // Custom Device Form Submit
    customDeviceForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const customTypeSelect = document.getElementById('custom-type') as HTMLSelectElement | null;
      const customWidth = parseInt(customWidthInput?.value || '390', 10) || 390;
      const customDev: DevicePreset = {
        id: 'custom-' + Date.now(),
        name: customNameInput?.value.trim() || 'Custom Viewport',
        category: 'Custom',
        width: customWidth,
        height: parseInt(customHeightInput?.value || '844', 10) || 844,
        dpr: parseFloat(customDprSelect?.value || '2.0') || 2.0,
        type: (customTypeSelect ? customTypeSelect.value : (customWidth > 1200 ? 'monitor' : (customWidth > 900 ? 'laptop' : (customWidth > 700 ? 'tablet' : 'android-punch')))) as any,
        os: 'Custom'
      };

      // Add to options
      if (deviceSelect) {
        const opt = document.createElement('option');
        opt.value = customDev.id;
        opt.textContent = `${customDev.name} (${customDev.width} × ${customDev.height})`;
        deviceSelect.insertBefore(opt, deviceSelect.lastElementChild);
      }
      DEVICE_PRESETS.push(customDev);

      modalCustom?.classList.remove('is-open');
      if (activeDevices.length > 0) {
        activeDevices[0].device = customDev;
        renderAllDevices();
      } else {
        addDevice(customDev);
      }
      showToast(`Custom device applied: ${customDev.width} × ${customDev.height} px`);
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'SELECT') return;

      if (e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        toggleOrientation();
      } else if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        document.querySelectorAll<HTMLIFrameElement>('.phone-iframe').forEach(iframe => {
          iframe.src = iframe.src;
        });
      } else if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleBezel();
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleDevToolsDock();
      } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('is-open'));
      }
    });
  }

  // --- Initial Launch ---
  async function init() {
    try {
      const userSettings = await getSettings();
      // Merge custom presets from settings
      if (userSettings.customPresets && userSettings.customPresets.length > 0) {
        userSettings.customPresets.forEach(cp => {
          if (!DEVICE_PRESETS.some(d => d.id === cp.id)) {
            DEVICE_PRESETS.push({
              id: cp.id,
              name: cp.name,
              category: 'Custom',
              width: cp.width,
              height: cp.height,
              dpr: cp.dpr,
              type: cp.type as any,
              os: 'Custom'
            });
          }
        });
      }

      // Check if user set custom defaults
      if (!localStorage.getItem('phone_sim_device') && userSettings.defaultDevice) {
        const found = DEVICE_PRESETS.find(d => d.id === userSettings.defaultDevice);
        if (found && activeDevices.length > 0) {
          activeDevices[0].device = found;
        }
      }
      if (!localStorage.getItem('phone_sim_viewmode') && userSettings.defaultViewMode) {
        currentViewMode = userSettings.defaultViewMode;
      }
      if (userSettings.defaultOrientation === 'landscape') {
        isLandscape = true;
        if (activeDevices.length > 0) activeDevices[0].isLandscape = true;
      }
      if (userSettings.defaultScale && scaleSelect) {
        currentScale = userSettings.defaultScale;
        scaleSelect.value = currentScale;
      }
      if (!userSettings.showBezel) {
        isBezelVisible = false;
        btnToggleFrame?.classList.remove('is-active');
      }
      if (!userSettings.touchSimulation) {
        isTouchMode = false;
        btnTouchMode?.classList.remove('is-active');
      }
    } catch (e) {}

    initDeviceList();
    initDevicePickerGrid();
    setupEventListeners();
    initDevToolsDock();
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
    let defaultStartUrl = 'https://en.wikipedia.org';
    try {
      const s = await getSettings();
      if (s.defaultUrl) defaultStartUrl = s.defaultUrl;
    } catch (e) {}

    const initialUrl = paramUrl || localStorage.getItem('phone_sim_last_url') || defaultStartUrl;
    navigateTo(initialUrl);

    // Start clock
    updateClock();
    setInterval(updateClock, 10000);

    // Initial scale calculation after DOM paint
    setTimeout(updateScale, 50);
  }

  document.addEventListener('DOMContentLoaded', init);

