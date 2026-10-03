export const RATING_STATE_KEY = 'dark.mode.rating';
export const DEFAULT_MIN_SUCCESS = 3;
const MAX_SITES = 40;

export function httpsUrl(value) {
  const url = String(value || '').trim();
  return /^https:\/\//i.test(url) ? url.slice(0, 1000) : '';
}

export function normalizeRating(value) {
  const rating = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const min = Number(rating.minSuccess);
  return {
    enabled: rating.enabled === true,
    minSuccess: Number.isFinite(min) && min > 0 ? Math.min(Math.floor(min), 100) : DEFAULT_MIN_SUCCESS,
    edge: httpsUrl(rating.edge),
    chrome: httpsUrl(rating.chrome),
    firefox: httpsUrl(rating.firefox),
    url: httpsUrl(rating.url)
  };
}

export function detectBrowserStore(manifest, userAgent = '') {
  if (manifest?.browser_specific_settings?.gecko || /\bFirefox\//i.test(userAgent)) return 'firefox';
  if (/\bEdg(?:A|iOS)?\//i.test(userAgent)) return 'edge';
  return 'chrome';
}

export function ratingTarget(rating, store) {
  const url = httpsUrl(rating?.[store]) || httpsUrl(rating?.url);
  const labels = { edge: 'Edge', chrome: 'Chrome', firefox: 'Firefox' };
  return url ? { url, store: labels[store] || 'Chrome' } : null;
}

export function emptyRatingState(version) {
  return { forVersion: version, sites: [], neverAsk: false, dismissedUntilNextSite: false };
}

export function normalizeRatingState(value, version) {
  if (!value || typeof value !== 'object' || value.forVersion !== version) return emptyRatingState(version);
  const sites = [];
  for (const item of Array.isArray(value.sites) ? value.sites : []) {
    const host = usableHost(item);
    if (!host || sites.includes(host)) continue;
    sites.push(host);
    if (sites.length >= MAX_SITES) break;
  }
  return {
    forVersion: version,
    sites,
    neverAsk: value.neverAsk === true,
    dismissedUntilNextSite: value.dismissedUntilNextSite === true
  };
}

export function noteWebsiteUse(state, hostname, version) {
  const current = normalizeRatingState(state, version);
  const host = usableHost(hostname);
  if (!host || current.sites.includes(host)) return { state: current, added: false };
  return {
    added: true,
    state: {
      ...current,
      sites: [...current.sites, host].slice(-MAX_SITES),
      dismissedUntilNextSite: false
    }
  };
}

export function ratingPrompt(state, rating, store, sessionHidden = false) {
  const current = normalizeRatingState(state, state?.forVersion || '');
  const target = ratingTarget(rating, store);
  if (!rating?.enabled || !target || sessionHidden || current.neverAsk || current.dismissedUntilNextSite) return null;
  if (current.sites.length < rating.minSuccess) return null;
  return { ...target, count: current.sites.length };
}

function usableHost(hostname) {
  const host = String(hostname || '').trim().toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  if (!host || host === 'local-file') return '';
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(host)) return '';
  return host;
}
