import { exportDocument, settingsFromImport } from '../storage/backup.js';
import { loadSettings, saveSettings } from '../storage/settings.js';
import { applyTheme, loadThemeDefinitions, renderThemePicker, resolveTheme, syncThemePicker, themesByMode } from '../ui/themes/theme.js';
import { apply, language, onLanguageChange, ready, saveLanguage, t, themeLabel } from '../shared/i18n.js';
import {
  MAX_SITES,
  isSiteKey,
  siteKeyFromInput,
  withSitePatch,
  withoutSite
} from '../dark/model.js';

const root = document.body;
const languageSelect = document.querySelector('#language-select');
const themePicker = document.querySelector('#theme-picker');
const themeStatus = document.querySelector('#theme-status');
const saveStatus = document.querySelector('#save-status');
const siteList = document.querySelector('#site-list');
const siteEmpty = document.querySelector('#site-empty');
let settings = {};
let themes = [];

function uiThemes() {
  return themesByMode(themes, 'dark');
}

function refreshThemeLabels() {
  syncThemePicker(themePicker, uiThemes(), settings.theme, themeLabel);
}

function paintLanguage() {
  apply(document);
  refreshThemeLabels();
  languageSelect.value = language();
}

function showThemeStatus(message, tone = 'info') {
  themeStatus.textContent = message;
  themeStatus.dataset.tone = tone;
  themeStatus.classList.toggle('hidden', !message);
}

function showStatus(message, tone = 'info') {
  saveStatus.textContent = message;
  saveStatus.dataset.tone = tone === 'error' ? 'error' : tone;
  saveStatus.classList.toggle('hidden', !message);
}

async function persist(patch, message) {
  settings = await saveSettings(patch);
  renderSites();
  if (message) showStatus(message, 'ok');
}

function renderSites() {
  siteList.replaceChildren();
  const entries = Object.entries(settings.sites || {});
  siteEmpty.classList.toggle('hidden', entries.length > 0);
  for (const [host, rule] of entries) {
    const item = document.createElement('li');
    item.className = 'dm-site';
    const name = document.createElement('strong');
    name.textContent = host;
    const mode = document.createElement('select');
    mode.setAttribute('aria-label', t('siteModeAria', { host }));
    for (const [value, key] of [['dark', 'modeDark'], ['filter', 'modeFilter'], ['off', 'modeNormal']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = t(key);
      option.selected = rule.mode === value;
      mode.append(option);
    }
    mode.addEventListener('change', () => {
      persist({ sites: withSitePatch(settings, host, { mode: mode.value }).sites }).catch(() => showStatus(t('siteSaveFailed'), 'error'));
    });
    const subdomains = document.createElement('label');
    subdomains.className = 'dm-check';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = rule.includeSubdomains === true;
    checkbox.addEventListener('change', () => {
      persist({ sites: withSitePatch(settings, host, { includeSubdomains: checkbox.checked }).sites }).catch(() => showStatus(t('siteSaveFailed'), 'error'));
    });
    subdomains.append(checkbox, document.createTextNode(t('includeSubdomains')));
    const remove = document.createElement('button');
    remove.className = 'btu-btn btu-btn--ghost';
    remove.type = 'button';
    remove.textContent = t('removeSite');
    remove.addEventListener('click', () => {
      persist({ sites: withoutSite(settings, host).sites }, t('siteRemoved')).catch(() => showStatus(t('siteSaveFailed'), 'error'));
    });
    item.append(name, mode, subdomains, remove);
    siteList.append(item);
  }
}

async function init() {
  await ready();
  const [loadedThemes, initialSettings] = await Promise.all([loadThemeDefinitions(), loadSettings()]);
  themes = loadedThemes;
  settings = initialSettings;
  renderThemePicker(themePicker, uiThemes());
  const selectedTheme = resolveTheme(settings.theme, uiThemes())?.id || 'obsidian';
  syncThemePicker(themePicker, uiThemes(), selectedTheme, themeLabel);
  applyTheme(root, selectedTheme, uiThemes());
  paintLanguage();
  renderSites();

  themePicker.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-theme-id]');
    if (!button) return;
    const previous = settings.theme || 'obsidian';
    const nextTheme = button.dataset.themeId;
    applyTheme(root, nextTheme, uiThemes());
    syncThemePicker(themePicker, uiThemes(), nextTheme, themeLabel);
    try {
      settings = await saveSettings({ theme: nextTheme });
      showThemeStatus(t('themeSaved'), 'ok');
    } catch {
      applyTheme(root, previous, uiThemes());
      syncThemePicker(themePicker, uiThemes(), previous, themeLabel);
      showThemeStatus(t('themeSaveFailed'), 'error');
    }
  });

}

languageSelect.addEventListener('change', () => {
  saveLanguage(languageSelect.value).catch(() => showStatus(t('settingsSaveFailed'), 'error'));
});
onLanguageChange(() => {
  paintLanguage();
  renderSites();
});

document.querySelector('#add-site').addEventListener('click', () => {
  const input = document.querySelector('#site-input');
  const key = siteKeyFromInput(input.value);
  if (!isSiteKey(key)) {
    showStatus(t('invalidHost'), 'error');
    return;
  }
  if (!settings.sites[key] && Object.keys(settings.sites).length >= MAX_SITES) {
    showStatus(t('siteLimit', { n: MAX_SITES }), 'error');
    return;
  }
  persist({ sites: withSitePatch(settings, key, { mode: settings.defaultMode === 'off' ? 'dark' : settings.defaultMode }).sites }, t('siteAdded'))
    .then(() => { input.value = ''; })
    .catch(() => showStatus(t('siteAddFailed'), 'error'));
});

document.querySelector('#export-settings').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(exportDocument(settings), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'dark-mode-settings.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
});

document.querySelector('#import-settings').addEventListener('click', () => document.querySelector('#import-file').click());
document.querySelector('#import-file').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    const normalized = settingsFromImport(await file.text());
    settings = await saveSettings(normalized);
    const selectedTheme = resolveTheme(settings.theme, uiThemes())?.id || 'obsidian';
    syncThemePicker(themePicker, uiThemes(), selectedTheme, themeLabel);
    applyTheme(root, selectedTheme, uiThemes());
    renderSites();
    showStatus(t('imported'), 'ok');
  } catch {
    showStatus(t('importInvalid'), 'error');
  }
});

init().catch(() => showThemeStatus(t('settingsLoadFailed'), 'error'));
