import { loadRemoteConfig } from './remote-config.js';
import {
  RATING_STATE_KEY,
  detectBrowserStore,
  normalizeRatingState,
  noteWebsiteUse,
  ratingPrompt
} from '../shared/rating.js';

function extensionApi() {
  return globalThis.browser ?? globalThis.chrome;
}

function sessionKey(version) {
  return `dark.mode.rating.session.${version}`;
}

let chain = Promise.resolve();

export function rememberWebsite(decision) {
  if (!decision?.active || !decision.hostname || decision.hostname === 'local-file') return;
  const api = extensionApi();
  chain = chain.then(() => recordHost(api, decision.hostname)).catch(() => {});
}

async function recordHost(api, hostname) {
  const version = api.runtime.getManifest().version;
  const stored = await api.storage.local.get(RATING_STATE_KEY);
  const next = noteWebsiteUse(stored?.[RATING_STATE_KEY], hostname, version);
  if (!next.added) return;
  await api.storage.local.set({ [RATING_STATE_KEY]: next.state });
}

async function readPrompt(api) {
  const manifest = api.runtime.getManifest();
  const version = manifest.version;
  const sessionStore = api.storage.session;
  const [config, stored, session] = await Promise.all([
    loadRemoteConfig('zh', api),
    api.storage.local.get(RATING_STATE_KEY),
    sessionStore ? sessionStore.get(sessionKey(version)).catch(() => ({})) : Promise.resolve({})
  ]);
  const state = normalizeRatingState(stored?.[RATING_STATE_KEY], version);
  const store = detectBrowserStore(manifest, globalThis.navigator?.userAgent || '');
  return ratingPrompt(state, config.rating, store, Boolean(session?.[sessionKey(version)]));
}

function trusted(sender, api) {
  return !sender?.id || sender.id === api.runtime.id;
}

export function registerRating(router) {
  router.register('DARK_MODE_RATING_STATUS', async (_message, sender) => {
    const api = extensionApi();
    if (!trusted(sender, api)) throw new Error('Invalid sender');
    return { ok: true, prompt: await readPrompt(api) };
  });
  router.register('DARK_MODE_RATING_ACTION', async (message, sender) => {
    const api = extensionApi();
    if (!trusted(sender, api)) throw new Error('Invalid sender');
    const version = api.runtime.getManifest().version;
    const action = message?.action;
    if (action === 'rate') {
      const prompt = await readPrompt(api);
      await api.storage.session?.set?.({ [sessionKey(version)]: 1 });
      return { ok: true, url: prompt?.url || '' };
    }
    if (action !== 'later' && action !== 'never') return { ok: false };
    const stored = await api.storage.local.get(RATING_STATE_KEY);
    const state = normalizeRatingState(stored?.[RATING_STATE_KEY], version);
    await api.storage.local.set({
      [RATING_STATE_KEY]: {
        ...state,
        neverAsk: action === 'never' ? true : state.neverAsk,
        dismissedUntilNextSite: action === 'later'
      }
    });
    return { ok: true };
  });
}
