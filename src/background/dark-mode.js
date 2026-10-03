import { loadSettings, saveSettings, STORAGE_KEY } from '../storage/settings.js';
import { decide, inspectUrl, toggleSite } from '../dark/model.js';
import { paintInPage } from '../dark/paint-page.js';
import { buildStylesheet, buildDynamicTheme, paintMode } from '../dark/style.js';
import { fetchStylesheet } from './stylesheet-fetch.js';
import { rememberWebsite } from './rating.js';

function extensionApi() {
  return globalThis.browser ?? globalThis.chrome;
}

function paintBadge(tabId, decision) {
  if (!tabId) return;
  const api = extensionApi();
  api.action?.setBadgeText?.({ tabId, text: decision.badge?.text || '' });
  api.action?.setBadgeBackgroundColor?.({ tabId, color: decision.badge?.color || '#000000' });
}

async function currentTab() {
  const tabs = await extensionApi().tabs?.query?.({ active: true, lastFocusedWindow: true });
  return tabs?.[0] || null;
}

async function resolveForTab(message, sender) {
  const settings = await loadSettings();
  const decision = decide(settings, {
    url: typeof message?.href === 'string' ? message.href : sender?.tab?.url || '',
    prefersDark: message?.prefersDark === true,
    now: new Date()
  });
  paintBadge(sender?.tab?.id, decision);
  rememberWebsite(decision);
  const painted = paintMode(decision);
  return {
    ok: true,
    active: decision.active,
    mode: painted,
    reason: decision.reason,
    css: buildStylesheet(decision),
    dynamicTheme: buildDynamicTheme(decision),
    keepMediaColors: decision.keepMediaColors,
    protectBackgrounds: Boolean(decision.active && painted === 'dark' && decision.protectBackgrounds)
  };
}

function bindMenus() {
  const api = extensionApi();
  const menus = api.contextMenus;
  if (!menus?.onClicked || !menus.create || !menus.removeAll) return;
  menus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== 'toggle-site') return;
    const task = (async () => {
      const target = tab?.url ? tab : await currentTab();
      const inspected = inspectUrl(target?.url || info.pageUrl || '');
      if (!inspected.ok) return;
      const settings = await loadSettings();
      const next = toggleSite(settings, inspected.hostname);
      await saveSettings({ sites: next.sites });
    })();
    Promise.resolve(task).catch(() => {});
  });
  const install = () => {
    menus.removeAll(() => {
      menus.create({
        id: 'toggle-site',
        title: api.i18n?.getMessage?.('contextToggleSite') || 'Toggle dark mode for this site',
        contexts: ['page', 'action']
      });
    });
  };
  api.runtime?.onInstalled?.addListener(install);
  install();
}

function payloadFor(decision) {
  const mode = paintMode(decision);
  return {
    active: Boolean(decision.active),
    mode,
    css: buildStylesheet(decision),
    dynamicTheme: buildDynamicTheme(decision),
    keepMediaColors: decision.keepMediaColors,
    protectBackgrounds: Boolean(decision.active && mode === 'dark' && decision.protectBackgrounds)
  };
}

async function pushTab(api, settings, tab) {
  if (!tab?.id || !/^(https?:|file:)/.test(tab.url || '')) return;
  let prefersDark = false;
  if (settings.followOs) {
    try {
      const [read] = await api.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true
      });
      prefersDark = read?.result === true;
    } catch {
      return;
    }
  }
  const decision = decide(settings, { url: tab.url, prefersDark, now: new Date() });
  paintBadge(tab.id, decision);
  rememberWebsite(decision);
  try {
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/vendor/darkreader.js', 'src/content/dynamic-theme.js']
    });
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      func: paintInPage,
      args: [payloadFor(decision)]
    });
  } catch {
    /* 浏览器不允许改这个页面，例如浏览器自己的商店。 */
  }
}

export async function pushOpenTabs() {
  const api = extensionApi();
  if (!api?.scripting?.executeScript || !api.tabs?.query) return;
  const [settings, tabs] = await Promise.all([loadSettings(), api.tabs.query({})]);
  await Promise.all((tabs || []).map((tab) => pushTab(api, settings, tab)));
}

function bindStoragePush() {
  extensionApi().storage?.onChanged?.addListener?.((changes, area) => {
    if (area !== 'local' || !changes?.[STORAGE_KEY]) return;
    pushOpenTabs().catch(() => {});
  });
}

function clearBadges() {
  const api = extensionApi();
  const clear = api.action?.setBadgeText;
  if (!clear) return;
  clear({ text: '' });
  api.tabs?.query?.({}).then?.((tabs) => {
    for (const tab of tabs || []) {
      if (tab.id) clear({ tabId: tab.id, text: '' });
    }
  }).catch?.(() => {});
}

export function registerDarkMode(router) {
  clearBadges();
  router.register('FETCH_STYLESHEET', fetchStylesheet);
  router.register('RESOLVE', (message, sender) => resolveForTab(message, sender));
  router.register('PUSH_TABS', () => pushOpenTabs());
  bindMenus();
  bindStoragePush();
}
