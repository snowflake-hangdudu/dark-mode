import { createSettingsStore } from './store.js';
import { DEFAULT_SETTINGS, normalizeSettings } from '../dark/model.js';

const STORAGE_KEY = "dark.mode" + '.settings.v1';

export { DEFAULT_SETTINGS, STORAGE_KEY, normalizeSettings };

const store = createSettingsStore({ key: STORAGE_KEY, defaults: DEFAULT_SETTINGS, normalize: normalizeSettings });

export const loadSettings = store.load;
export const saveSettings = store.save;
export const clearSettings = store.clear;
