import { create } from 'zustand';
// 注意：settings直接使用localStorage，不依赖storage工具，避免循环依赖

export interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  priceAlert: boolean;
  searchHistoryEnabled: boolean;
}

interface SettingsState extends AppSettings {
  initialize: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleDarkMode: () => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: true,
  notifications: true,
  priceAlert: true,
  searchHistoryEnabled: true,
};

const STORAGE_KEY = 'zhiyou_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,

  initialize: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        set(settings);
        applyDarkMode(settings.darkMode);
      } else {
        applyDarkMode(DEFAULT_SETTINGS.darkMode);
      }
    } catch {
      applyDarkMode(DEFAULT_SETTINGS.darkMode);
    }
  },

  updateSettings: (settings: Partial<AppSettings>) => {
    const newSettings = { ...get(), ...settings };
    set(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    
    if (settings.darkMode !== undefined) {
      applyDarkMode(settings.darkMode);
    }
  },

  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode;
    get().updateSettings({ darkMode: newDarkMode });
  },

  resetSettings: () => {
    set(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    applyDarkMode(DEFAULT_SETTINGS.darkMode);
  },
}));

function applyDarkMode(dark: boolean) {
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}
