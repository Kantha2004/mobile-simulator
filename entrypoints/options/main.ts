// entrypoints/options/main.ts - Settings Dashboard Controller

import './style.css';
import { DEVICE_PRESETS, type DevicePreset } from '../../utils/devices';
import { getSettings, saveSettings, DEFAULT_SETTINGS, type SimulatorSettings, type CustomDevicePreset } from '../../utils/settings';

let currentSettings: SimulatorSettings = { ...DEFAULT_SETTINGS };

// DOM Elements
const defaultDeviceSelect = document.getElementById('setting-default-device') as HTMLSelectElement | null;
const defaultOrientationSelect = document.getElementById('setting-default-orientation') as HTMLSelectElement | null;
const defaultScaleSelect = document.getElementById('setting-default-scale') as HTMLSelectElement | null;
const defaultViewModeSelect = document.getElementById('setting-default-viewmode') as HTMLSelectElement | null;
const defaultThemeSelect = document.getElementById('setting-default-theme') as HTMLSelectElement | null;
const defaultColorSchemeSelect = document.getElementById('setting-default-colorscheme') as HTMLSelectElement | null;
const showBezelCheckbox = document.getElementById('setting-show-bezel') as HTMLInputElement | null;
const touchSimulationCheckbox = document.getElementById('setting-touch-simulation') as HTMLInputElement | null;
const showMouseArrowCheckbox = document.getElementById('setting-show-mouse-arrow') as HTMLInputElement | null;
const defaultUrlInput = document.getElementById('setting-default-url') as HTMLInputElement | null;

const customPresetsList = document.getElementById('custom-presets-list') as HTMLElement | null;
const customNameInput = document.getElementById('custom-name') as HTMLInputElement | null;
const customWidthInput = document.getElementById('custom-width') as HTMLInputElement | null;
const customHeightInput = document.getElementById('custom-height') as HTMLInputElement | null;
const customDprSelect = document.getElementById('custom-dpr') as HTMLSelectElement | null;
const customTypeSelect = document.getElementById('custom-type') as HTMLSelectElement | null;
const btnAddCustomPreset = document.getElementById('btn-add-custom-preset') as HTMLElement | null;

const btnSaveSettings = document.getElementById('btn-save-settings') as HTMLElement | null;
const btnResetDefaults = document.getElementById('btn-reset-defaults') as HTMLElement | null;
const btnOpenSimulator = document.getElementById('btn-open-simulator') as HTMLElement | null;
const statusMsg = document.getElementById('status-msg') as HTMLElement | null;

/**
 * Populate device dropdown grouped by category.
 */
function initDeviceDropdown() {
  if (!defaultDeviceSelect) return;
  defaultDeviceSelect.innerHTML = '';

  const CATEGORY_ORDER = [
    'Apple iPhone',
    'Android Phones',
    'Tablets',
    'Laptops',
    'Monitors & Desktops',
  ];

  const categories: Record<string, DevicePreset[]> = {};
  DEVICE_PRESETS.forEach(dev => {
    const cat = dev.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(dev);
  });

  const sortedCatNames = Object.keys(categories).sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(a);
    const idxB = CATEGORY_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  sortedCatNames.forEach(catName => {
    const group = document.createElement('optgroup');
    group.label = catName;
    categories[catName].forEach(dev => {
      const opt = document.createElement('option');
      opt.value = dev.id;
      opt.textContent = `${dev.name} (${dev.width} × ${dev.height})`;
      group.appendChild(opt);
    });
    defaultDeviceSelect.appendChild(group);
  });
}

/**
 * Render the list of custom presets with delete actions.
 */
function renderCustomPresetsList() {
  if (!customPresetsList) return;
  customPresetsList.innerHTML = '';

  const presets = currentSettings.customPresets || [];
  if (presets.length === 0) {
    customPresetsList.innerHTML = `<div class="empty-presets">No custom presets added yet. Use the form below to register a custom viewport.</div>`;
    return;
  }

  presets.forEach((preset, index) => {
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <div class="preset-info">
        <span class="preset-name">${preset.name}</span>
        <span class="preset-badge">${preset.width} × ${preset.height} px</span>
        <span class="preset-badge">${preset.dpr}x DPR</span>
        <span class="preset-badge">${preset.type}</span>
      </div>
      <button type="button" class="btn-danger btn-delete-preset" data-index="${index}" title="Delete Preset">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    `;

    const deleteBtn = item.querySelector('.btn-delete-preset');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        deleteCustomPreset(index);
      });
    }

    customPresetsList.appendChild(item);
  });
}

function deleteCustomPreset(index: number) {
  if (currentSettings.customPresets && currentSettings.customPresets[index]) {
    const removed = currentSettings.customPresets.splice(index, 1);
    renderCustomPresetsList();
    showStatusMessage(`Deleted "${removed[0].name}"`, 'success');
  }
}

/**
 * Load settings and populate form inputs.
 */
async function loadAndPopulateSettings() {
  currentSettings = await getSettings();

  if (defaultDeviceSelect) defaultDeviceSelect.value = currentSettings.defaultDevice;
  if (defaultOrientationSelect) defaultOrientationSelect.value = currentSettings.defaultOrientation;
  if (defaultScaleSelect) defaultScaleSelect.value = currentSettings.defaultScale;
  if (defaultViewModeSelect) defaultViewModeSelect.value = currentSettings.defaultViewMode;
  if (defaultThemeSelect) defaultThemeSelect.value = currentSettings.defaultTheme;
  if (defaultColorSchemeSelect) defaultColorSchemeSelect.value = currentSettings.defaultColorScheme;
  if (showBezelCheckbox) showBezelCheckbox.checked = currentSettings.showBezel;
  if (touchSimulationCheckbox) touchSimulationCheckbox.checked = currentSettings.touchSimulation;
  if (showMouseArrowCheckbox) showMouseArrowCheckbox.checked = currentSettings.showMouseArrow;
  if (defaultUrlInput) defaultUrlInput.value = currentSettings.defaultUrl;

  renderCustomPresetsList();
}

/**
 * Read current form state and save.
 */
async function saveAllSettings() {
  const newSettings: Partial<SimulatorSettings> = {
    defaultDevice: defaultDeviceSelect ? defaultDeviceSelect.value : currentSettings.defaultDevice,
    defaultOrientation: defaultOrientationSelect ? (defaultOrientationSelect.value as any) : currentSettings.defaultOrientation,
    defaultScale: defaultScaleSelect ? defaultScaleSelect.value : currentSettings.defaultScale,
    defaultViewMode: defaultViewModeSelect ? (defaultViewModeSelect.value as any) : currentSettings.defaultViewMode,
    defaultTheme: defaultThemeSelect ? defaultThemeSelect.value : currentSettings.defaultTheme,
    defaultColorScheme: defaultColorSchemeSelect ? (defaultColorSchemeSelect.value as any) : currentSettings.defaultColorScheme,
    showBezel: showBezelCheckbox ? showBezelCheckbox.checked : currentSettings.showBezel,
    touchSimulation: touchSimulationCheckbox ? touchSimulationCheckbox.checked : currentSettings.touchSimulation,
    showMouseArrow: showMouseArrowCheckbox ? showMouseArrowCheckbox.checked : currentSettings.showMouseArrow,
    defaultUrl: defaultUrlInput && defaultUrlInput.value.trim() ? defaultUrlInput.value.trim() : 'https://en.wikipedia.org',
    customPresets: currentSettings.customPresets,
  };

  currentSettings = await saveSettings(newSettings);

  // Sync to legacy localStorage keys so simulator updates immediately
  try {
    localStorage.setItem('phone_sim_device', currentSettings.defaultDevice);
    localStorage.setItem('phone_sim_viewmode', currentSettings.defaultViewMode);
    localStorage.setItem('phone_sim_show_arrow', currentSettings.showMouseArrow ? 'true' : 'false');
    localStorage.setItem('phone_sim_last_url', currentSettings.defaultUrl);
  } catch (e) {}

  showStatusMessage('✓ Settings saved successfully!', 'success');
}

/**
 * Reset form and storage to default settings.
 */
async function resetSettingsToDefaults() {
  if (!confirm('Are you sure you want to reset all settings to factory defaults?')) return;
  currentSettings = await saveSettings(DEFAULT_SETTINGS);
  await loadAndPopulateSettings();
  showStatusMessage('✓ Settings reset to default values.', 'success');
}

/**
 * Add a new custom viewport preset.
 */
function handleAddCustomPreset() {
  const name = customNameInput?.value.trim();
  const width = parseInt(customWidthInput?.value || '0', 10);
  const height = parseInt(customHeightInput?.value || '0', 10);
  const dpr = parseFloat(customDprSelect?.value || '2.0');
  const type = customTypeSelect?.value || 'dynamic-island';

  if (!name) {
    showStatusMessage('Please enter a name for the custom device.', 'error');
    customNameInput?.focus();
    return;
  }
  if (!width || width < 100 || width > 5000) {
    showStatusMessage('Please enter a valid width between 100 and 5000 px.', 'error');
    customWidthInput?.focus();
    return;
  }
  if (!height || height < 100 || height > 5000) {
    showStatusMessage('Please enter a valid height between 100 and 5000 px.', 'error');
    customHeightInput?.focus();
    return;
  }

  const newPreset: CustomDevicePreset = {
    id: 'custom-' + Date.now(),
    name,
    width,
    height,
    dpr,
    type,
    category: 'Custom',
  };

  if (!currentSettings.customPresets) {
    currentSettings.customPresets = [];
  }
  currentSettings.customPresets.push(newPreset);
  renderCustomPresetsList();

  // Clear inputs
  if (customNameInput) customNameInput.value = '';
  if (customWidthInput) customWidthInput.value = '';
  if (customHeightInput) customHeightInput.value = '';

  showStatusMessage(`✓ Added "${newPreset.name}" to custom presets. Click "Save Settings" to persist.`, 'success');
}

/**
 * Display ephemeral status banner.
 */
let statusTimeout: any = null;
function showStatusMessage(text: string, type: 'success' | 'error') {
  if (!statusMsg) return;
  clearTimeout(statusTimeout);
  statusMsg.textContent = text;
  statusMsg.className = `status-msg ${type === 'success' ? 'show-success' : 'show-error'}`;
  statusTimeout = setTimeout(() => {
    statusMsg.className = 'status-msg';
  }, 4000);
}

/**
 * Open simulator canvas in a tab.
 */
function openSimulator() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: chrome.runtime.getURL('simulator.html') });
  } else {
    window.open('simulator.html', '_blank');
  }
}

// Event Listeners
function setupEvents() {
  btnSaveSettings?.addEventListener('click', saveAllSettings);
  btnResetDefaults?.addEventListener('click', resetSettingsToDefaults);
  btnAddCustomPreset?.addEventListener('click', handleAddCustomPreset);
  btnOpenSimulator?.addEventListener('click', openSimulator);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initDeviceDropdown();
  setupEvents();
  await loadAndPopulateSettings();
});
