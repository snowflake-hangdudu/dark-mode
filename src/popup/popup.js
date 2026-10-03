import { loadSettings, saveSettings } from '../storage/settings.js';
import { initializeRatingPrompt } from '../shared/rating-panel.js';
import { applyTheme, loadThemeDefinitions, renderThemePicker, resolveTheme, syncThemePicker, themesByMode } from '../ui/themes/theme.js';
import { apply, language, onLanguageChange, ready, saveLanguage, t, themeLabel } from '../shared/i18n.js';
import {
  MAX_SITES,
  decide,
  defaultAdjust,
  inspectUrl,
  lookupSite,
  withSitePatch,
  withoutSite
} from '../dark/model.js';
import { paintInPage } from '../dark/paint-page.js';
import { buildStylesheet, buildDynamicTheme, paintMode } from '../dark/style.js';

const browserAPI = globalThis.browser ?? globalThis.chrome;
const root = document.body;
initializeRatingPrompt(document.querySelector('#rating-prompt'));
const languageSelect = document.querySelector('#language-select');
const themePicker = document.querySelector('#theme-picker');
const themeStatus = document.querySelector('#theme-status');
const featurePanel = document.querySelector('#feature-panel');
const settingsPanel = document.querySelector('#settings-panel');
const openSettings = document.querySelector('#open-settings');
const backButton = document.querySelector('#back-feature');
const powerButton = document.querySelector('#power');
const powerDot = document.querySelector('#power-dot');
const powerMeta = document.querySelector('#power-meta');
const modeScopeNote = document.querySelector('#mode-scope-note');
const scopeHint = document.querySelector('#scope-hint');
const resetButton = document.querySelector('#reset-site');
const modeButtons = [...document.querySelectorAll('#mode-group [data-mode]')];
const sliderKeys = ['brightness', 'contrast', 'saturation', 'blueLight', 'dim'];
let themes = [];
let settings = {};
let scope = 'site';
let page = { ok: false, hostname: '' };
let writing = false;
let settingsReady = false;

function selectView(name, focus = false) {
  const showSettings = name === 'settings';
  featurePanel.classList.toggle('is-active', !showSettings);
  settingsPanel.classList.toggle('is-active', showSettings);
  featurePanel.toggleAttribute('inert', showSettings);
  settingsPanel.toggleAttribute('inert', !showSettings);
  openSettings.classList.toggle('is-active', !showSettings);
  backButton.classList.toggle('is-active', showSettings);
  openSettings.toggleAttribute('inert', showSettings);
  backButton.toggleAttribute('inert', !showSettings);
  if (focus) (showSettings ? backButton : openSettings).focus();
}

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

function hostLabel(hostname) {
  if (hostname === 'local-file') return t('localFile');
  return hostname || t('thisPage');
}

function showThemeStatus(message, tone = 'info') {
  themeStatus.textContent = message;
  themeStatus.dataset.tone = tone;
  themeStatus.classList.toggle('hidden', !message);
}

function currentDecision() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return decide(settings, { url: page.url || '', prefersDark, now: new Date() });
}

function selectedMode() {
  if (!page.ok) return 'off';
  if (scope === 'all') return settings.defaultMode;
  const found = lookupSite(settings.sites, page.hostname);
  return found?.exact ? found.rule.mode : (found?.rule.mode || settings.defaultMode);
}

function selectedAdjust() {
  if (scope === 'site' && page.ok) {
    const found = lookupSite(settings.sites, page.hostname);
    if (found?.exact && found.rule.adjust) return found.rule.adjust;
  }
  return settings.adjust || defaultAdjust();
}

function render() {
  const decision = page.ok || page.url ? currentDecision() : null;
  powerButton.classList.toggle('on', settings.enabled !== false);
  powerButton.setAttribute('aria-checked', String(settings.enabled !== false));
  powerDot.classList.toggle('is-on', Boolean(decision?.active));
  powerDot.classList.toggle('is-off', !decision?.active);
  powerMeta.textContent = page.ok ? hostLabel(page.hostname) : t('noPage');
  const mode = selectedMode();
  for (const button of modeButtons) {
    button.setAttribute('aria-checked', String(button.dataset.mode === mode));
  }
  const adjust = selectedAdjust();
  for (const key of sliderKeys) {
    const input = document.querySelector(`#${key}`);
    const output = document.querySelector(`#${key}-value`);
    if (document.activeElement !== input) input.value = String(adjust[key]);
    output.textContent = input.value;
  }
  document.querySelector('#scope-site').setAttribute('aria-pressed', String(scope === 'site'));
  document.querySelector('#scope-all').setAttribute('aria-pressed', String(scope === 'all'));
  const exact = page.ok && lookupSite(settings.sites, page.hostname)?.exact;
  const showGlobal = scope === 'site' && page.ok && !exact;
  modeScopeNote.classList.toggle('hidden', !showGlobal);
  modeScopeNote.textContent = showGlobal ? t('modeHintGlobal') : '';
  scopeHint.textContent = scope === 'site' ? t('scopeHintSite') : t('scopeHintAll');
  resetButton.textContent = scope === 'site' ? t('resetSite') : t('resetAdjust');
  featurePanel.classList.toggle('is-locked', !page.ok && scope === 'site');
}

async function paintActiveTab() {
  if (!browserAPI.scripting?.executeScript || !browserAPI.tabs?.query) return;
  try {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^(https?:|file:)/.test(tab.url || '')) return;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
    const decision = decide(settings, { url: tab.url, prefersDark, now: new Date() });
    const mode = paintMode(decision);
    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/vendor/darkreader.js', 'src/content/dynamic-theme.js']
    });
    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      func: paintInPage,
      args: [{
        active: Boolean(decision.active),
        mode,
        css: buildStylesheet(decision),
        dynamicTheme: buildDynamicTheme(decision),
        keepMediaColors: decision.keepMediaColors,
        protectBackgrounds: Boolean(decision.active && mode === 'dark' && decision.protectBackgrounds)
      }]
    });
  } catch {
    /* 这个页面不允许注入时，刷新后由内容脚本再试一次。 */
  }
}

async function persist(patch) {
  settingsReady = true;
  writing = true;
  settings = { ...settings, ...patch };
  render();
  const painted = paintActiveTab();
  try {
    settings = await saveSettings(patch);
    render();
    await painted;
    await paintActiveTab();
  } catch {
    /* 保存失败时保持当前界面，下次打开再读存储。 */
  } finally {
    writing = false;
  }
}

async function updateSite(patch) {
  if (!page.ok) return;
  if (!settings.sites[page.hostname] && Object.keys(settings.sites).length >= MAX_SITES) return;
  const next = withSitePatch(settings, page.hostname, patch);
  if (!next.sites[page.hostname]) return;
  await persist({ sites: next.sites });
}

function sliderPatch() {
  const adjust = {};
  for (const key of sliderKeys) adjust[key] = Number(document.querySelector(`#${key}`).value);
  return adjust;
}

let sliderTimer = 0;
function queueSliderSave() {
  clearTimeout(sliderTimer);
  sliderTimer = setTimeout(() => {
    const adjust = sliderPatch();
    if (scope === 'all') persist({ adjust });
    else updateSite({ adjust });
  }, 80);
}

async function init() {
  await ready();
  const [loadedThemes, loadedSettings] = await Promise.all([loadThemeDefinitions(), loadSettings()]);
  themes = loadedThemes;
  if (!settingsReady) settings = loadedSettings;
  renderThemePicker(themePicker, uiThemes());
  const selectedTheme = resolveTheme(settings.theme, uiThemes())?.id || 'obsidian';
  syncThemePicker(themePicker, uiThemes(), selectedTheme, themeLabel);
  applyTheme(root, selectedTheme, uiThemes());
  paintLanguage();
  const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
  page = { ...(tab?.url ? inspectUrl(tab.url) : { ok: false, hostname: '' }), url: tab?.url || '' };
  render();
  paintActiveTab().catch(() => {});

  themePicker.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-theme-id]');
    if (!button) return;
    const nextTheme = button.dataset.themeId;
    applyTheme(root, nextTheme, uiThemes());
    syncThemePicker(themePicker, uiThemes(), nextTheme, themeLabel);
    try {
      settings = await saveSettings({ theme: nextTheme });
      showThemeStatus(t('themeSaved'), 'ok');
      await paintActiveTab();
    } catch {
      const previous = resolveTheme(settings.theme, uiThemes())?.id || 'obsidian';
      applyTheme(root, previous, uiThemes());
      syncThemePicker(themePicker, uiThemes(), previous, themeLabel);
      showThemeStatus(t('themeSaveFailed'), 'error');
    }
  });

}

openSettings.addEventListener('click', () => selectView('settings', true));
backButton.addEventListener('click', () => selectView('feature', true));
document.querySelector('#open-full-settings').addEventListener('click', async () => {
  try {
    await browserAPI.runtime.openOptionsPage();
  } catch {
    showThemeStatus(t('openFullSettingsFailed'), 'error');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && settingsPanel.classList.contains('is-active')) {
    selectView('feature', true);
  }
});

languageSelect.addEventListener('change', () => {
  saveLanguage(languageSelect.value).catch(() => showThemeStatus(t('settingsSaveFailed'), 'error'));
});
onLanguageChange(() => {
  paintLanguage();
  render();
});

powerButton.addEventListener('click', () => {
  const enabled = settings.enabled === false;
  persist({ enabled });
});
document.querySelector('#scope-site').addEventListener('click', () => { scope = 'site'; render(); });
document.querySelector('#scope-all').addEventListener('click', () => { scope = 'all'; render(); });

for (const button of modeButtons) {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    if (scope === 'all') persist({ defaultMode: mode });
    else updateSite({ mode });
  });
}

for (const key of sliderKeys) {
  const input = document.querySelector(`#${key}`);
  input.addEventListener('input', () => {
    document.querySelector(`#${key}-value`).textContent = input.value;
    queueSliderSave();
  });
}

resetButton.addEventListener('click', () => {
  if (scope === 'all') persist({ adjust: defaultAdjust() });
  else if (page.ok) persist({ sites: withoutSite(settings, page.hostname).sites });
});

browserAPI.storage?.onChanged?.addListener(() => {
  if (writing) return;
  loadSettings().then((next) => {
    settings = next;
    render();
  }).catch(() => {});
});

init().catch(() => {
  showThemeStatus(t('settingsLoadFailed'), 'error');
});
