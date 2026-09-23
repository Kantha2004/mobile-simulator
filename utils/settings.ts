// utils/settings.ts - Centralized Settings Storage for Phone Simulator

export interface CustomDevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  dpr: number;
  type: string;
  category?: string;
  os?: string;
}

export interface SimulatorSettings {
  defaultDevice: string;
  defaultOrientation: 'portrait' | 'landscape';
  defaultScale: string;
  defaultViewMode: 'browser' | 'pwa' | 'fullscreen';
  defaultTheme: string;
  defaultColorScheme: 'dark' | 'light';
  showBezel: boolean;
  touchSimulation: boolean;
  showMouseArrow: boolean;
  defaultUrl: string;
  customPresets: CustomDevicePreset[];
}

export const DEFAULT_SETTINGS: SimulatorSettings = {
  defaultDevice: 'iphone-15-pro',
  defaultOrientation: 'portrait',
  defaultScale: 'fit',
  defaultViewMode: 'browser',
  defaultTheme: 'titanium-dark',
  defaultColorScheme: 'dark',
  showBezel: true,
  touchSimulation: true,
  showMouseArrow: true,
  defaultUrl: 'https://en.wikipedia.org',
  customPresets: [],
};

const STORAGE_KEY = 'phone_sim_user_settings';

/**
 * Loads user settings from chrome.storage.sync (falling back to storage.local or localStorage).
 */
export async function getSettings(): Promise<SimulatorSettings> {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const storage = chrome.storage.sync || chrome.storage.local;
      const res = await storage.get(STORAGE_KEY);
      if (res && res[STORAGE_KEY]) {
        return { ...DEFAULT_SETTINGS, ...(res[STORAGE_KEY] as Partial<SimulatorSettings>) };
      }
    }
  } catch (e) {
    console.warn('[Phone Simulator] Failed to read from chrome.storage:', e);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}

  return { ...DEFAULT_SETTINGS };
}

/**
 * Saves user settings to chrome.storage.sync and localStorage.
 */
export async function saveSettings(settings: Partial<SimulatorSettings>): Promise<SimulatorSettings> {
  const current = await getSettings();
  const updated: SimulatorSettings = { ...current, ...settings };

  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const storage = chrome.storage.sync || chrome.storage.local;
      await storage.set({ [STORAGE_KEY]: updated });
    }
  } catch (e) {
    console.warn('[Phone Simulator] Failed to write to chrome.storage:', e);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}

  return updated;
}
