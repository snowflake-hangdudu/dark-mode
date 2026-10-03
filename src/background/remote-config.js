import { normalizeRating } from '../shared/rating.js';

export const REMOTE_CONFIG_URL = 'http://124.222.62.190:8081/api/config/dark-mode';
const CACHE_TTL = 30 * 60 * 1000;
const pending = new Map();
const text = value => typeof value === 'string' ? value.trim().slice(0, 4000) : '';
const lines = value => (Array.isArray(value) ? value : [value]).map(text).filter(Boolean).slice(0, 20);

export function normalizeRemoteConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid remote config');
  const notice = value.notice || {};
  const coop = value.coop || {};
  return {
    enabled: value.enabled !== false,
    minExtensionVersion: text(value.minExtensionVersion),
    notice: {
      enabled: notice.enabled === true,
      title: text(notice.title),
      updated: text(notice.updated),
      pinned: lines(notice.pinned),
      recent: lines(notice.recent),
      knownIssues: lines(notice.knownIssues),
      roadmap: {
        feedback: lines(notice.roadmap?.feedback),
        upcoming: lines(notice.roadmap?.upcoming),
        planned: lines(notice.roadmap?.planned)
      }
    },
    coop: { enabled: coop.enabled === true, title: text(coop.title), body: text(coop.body) },
    rating: normalizeRating(value.rating)
  };
}

export async function loadRemoteConfig(language = 'zh', api = globalThis.browser ?? globalThis.chrome) {
  const lang = language === 'en' ? 'en' : 'zh';
  if (pending.has(lang)) return pending.get(lang);
  const task = (async () => {
    const key = 'dark.mode.remote.' + lang;
    let cached;
    try { cached = (await api.storage.local.get(key))[key]; } catch {}
    if (cached?.config && Date.now() - cached.savedAt < CACHE_TTL) {
      try { return normalizeRemoteConfig(cached.config); } catch {}
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(REMOTE_CONFIG_URL + (lang === 'en' ? '?lang=en' : ''), { signal: controller.signal, cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error('Remote HTTP ' + response.status);
      const config = normalizeRemoteConfig(await response.json());
      try { await api.storage.local.set({ [key]: { savedAt: Date.now(), config } }); } catch {}
      return config;
    } catch {
      if (cached?.config) {
        try { return normalizeRemoteConfig(cached.config); } catch {}
      }
      return normalizeRemoteConfig({ enabled: true, notice: { enabled: false }, coop: { enabled: false } });
    } finally {
      clearTimeout(timer);
    }
  })();
  pending.set(lang, task);
  try { return await task; } finally { pending.delete(lang); }
}

export function registerRemoteConfig(router) {
  router.register('DARK_MODE_REMOTE_CONFIG', async (message, sender) => {
    const api = globalThis.browser ?? globalThis.chrome;
    if (sender?.id && sender.id !== api.runtime.id) throw new Error('Invalid sender');
    return { ok: true, config: await loadRemoteConfig(message.language, api) };
  });
}
