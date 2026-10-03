import { THEME_IDS } from './page-themes.js';

export const SCHEMA = 1;
export const MAX_SITES = 200;
export const MAX_CSS = 8000;

export const ADJUST_FIELDS = Object.freeze([
  { key: 'brightness', label: '亮度', min: 50, max: 150 },
  { key: 'contrast', label: '对比', min: 50, max: 150 },
  { key: 'saturation', label: '饱和', min: 0, max: 160 },
  { key: 'blueLight', label: '色温', min: 0, max: 100 },
  { key: 'dim', label: '变暗', min: 0, max: 70 }
]);

const ADJUST_LIMITS = Object.fromEntries(ADJUST_FIELDS.map((field) => [field.key, [field.min, field.max]]));
const MODES = new Set(['dark', 'filter', 'off']);
const THEMES = new Set(THEME_IDS);
const BLOCKED_HOST = /(^|\.)chrome\.google\.com$|(^|\.)chromewebstore\.google\.com$|(^|\.)addons\.mozilla\.org$|(^|\.)addons\.allizom\.org$/;

export function defaultAdjust() {
  return { brightness: 100, contrast: 100, saturation: 100, blueLight: 0, dim: 0 };
}

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'obsidian',
  enabled: true,
  followOs: false,
  scheduleEnabled: false,
  scheduleStart: '20:00',
  scheduleEnd: '07:00',
  darkScrollbar: true,
  keepMediaColors: true,
  protectBackgrounds: false,
  defaultMode: 'dark',
  adjust: Object.freeze(defaultAdjust()),
  sites: Object.freeze({})
});

export function clampAdjust(input) {
  const fallback = defaultAdjust();
  const source = input && typeof input === 'object' ? input : {};
  const next = {};
  for (const [key, [min, max]] of Object.entries(ADJUST_LIMITS)) {
    const value = Number(source[key] ?? fallback[key]);
    next[key] = Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback[key];
  }
  return next;
}

export function sanitizeCss(css) {
  return String(css || '')
    .replace(/<\/\s*style/gi, '')
    .replace(/@import\b[^;]*;?/gi, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript\s*:/gi, '')
    .slice(0, MAX_CSS);
}

export function siteKey(hostname) {
  return String(hostname || '').trim().toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
}

export function isSiteKey(value) {
  if (value === 'local-file') return true;
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(value);
}

export function siteKeyFromInput(input) {
  const text = String(input || '').trim();
  if (!text) return '';
  try {
    const url = new URL(text.includes('://') ? text : `https://${text}`);
    return siteKey(url.hostname);
  } catch {
    return siteKey(text.split('/')[0].split(':')[0]);
  }
}

function normalizeTime(value, fallback) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return fallback;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function timeToMinutes(value) {
  const [hour, minute] = normalizeTime(value, '00:00').split(':').map(Number);
  return hour * 60 + minute;
}

export function isWithinSchedule(now, start, end) {
  const current = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (startMin === endMin) return true;
  if (startMin < endMin) return current >= startMin && current < endMin;
  return current >= startMin || current < endMin;
}

function normalizeMode(value, fallback) {
  return MODES.has(value) ? value : fallback;
}

const THEME_ALIASES = Object.freeze({
  default: 'obsidian',
  'cyan-mist': 'mist-cyan',
  'violet-haze': 'night-purple',
  ember: 'ember-orange',
  'bronze-smoke': 'copper-smoke',
  stardust: 'obsidian',
  'mocha-night': 'obsidian'
});

function normalizeTheme(value) {
  const text = THEME_ALIASES[String(value || 'obsidian')] || String(value || 'obsidian');
  if (!THEMES.has(text)) return 'obsidian';
  return text;
}

function normalizeSite(value, fallbackMode) {
  const source = value && typeof value === 'object' ? value : {};
  const mode = normalizeMode(source.mode, fallbackMode === 'off' ? 'dark' : fallbackMode);
  return {
    mode,
    adjust: source.adjust == null ? null : clampAdjust(source.adjust),
    customCss: sanitizeCss(source.customCss),
    includeSubdomains: source.includeSubdomains === true
  };
}

function normalizeSites(value, fallbackMode) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const sites = {};
  for (const [rawKey, rule] of Object.entries(source)) {
    if (Object.keys(sites).length >= MAX_SITES) break;
    const key = siteKey(rawKey);
    if (!isSiteKey(key) || BLOCKED_HOST.test(key)) continue;
    sites[key] = normalizeSite(rule, fallbackMode);
  }
  return sites;
}

export function normalizeSettings(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const defaultMode = normalizeMode(source.defaultMode, DEFAULT_SETTINGS.defaultMode);
  return {
    theme: normalizeTheme(source.theme),
    enabled: source.enabled !== false,
    followOs: source.followOs === true,
    scheduleEnabled: source.scheduleEnabled === true,
    scheduleStart: normalizeTime(source.scheduleStart, DEFAULT_SETTINGS.scheduleStart),
    scheduleEnd: normalizeTime(source.scheduleEnd, DEFAULT_SETTINGS.scheduleEnd),
    darkScrollbar: source.darkScrollbar !== false,
    keepMediaColors: source.keepMediaColors !== false,
    protectBackgrounds: source.protectBackgrounds === true,
    defaultMode,
    adjust: clampAdjust(source.adjust),
    sites: normalizeSites(source.sites, defaultMode)
  };
}

export function inspectUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'unsupported', hostname: '' };
  }
  if (parsed.protocol === 'file:') return { ok: true, reason: '', hostname: 'local-file' };
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'unsupported', hostname: '' };
  }
  const hostname = siteKey(parsed.hostname);
  if (!hostname || !isSiteKey(hostname) || BLOCKED_HOST.test(hostname)) {
    return { ok: false, reason: 'unsupported', hostname: '' };
  }
  return { ok: true, reason: '', hostname };
}

export function lookupSite(sites, hostname) {
  const key = siteKey(hostname);
  if (!key || !sites) return null;
  if (sites[key]) return { key, rule: sites[key], exact: true };
  const labels = key.split('.');
  for (let index = 1; index <= labels.length - 2; index += 1) {
    const parent = labels.slice(index).join('.');
    const rule = sites[parent];
    if (rule?.includeSubdomains) return { key: parent, rule, exact: false };
  }
  return null;
}

function pauseReason(settings, prefersDark, now) {
  if (!settings.followOs && !settings.scheduleEnabled) return '';
  const byOs = settings.followOs && prefersDark;
  const bySchedule = settings.scheduleEnabled && isWithinSchedule(now, settings.scheduleStart, settings.scheduleEnd);
  if (byOs || bySchedule) return '';
  if (settings.followOs && settings.scheduleEnabled) return 'paused-both';
  return settings.followOs ? 'paused-os' : 'paused-schedule';
}

function badgeFor() {
  return { text: '', color: '#000000' };
}

export function decide(settings, context = {}) {
  const normalized = normalizeSettings(settings);
  const now = context.now instanceof Date ? context.now : new Date();
  const prefersDark = context.prefersDark === true;
  const inspected = inspectUrl(context.url || '');
  const base = {
    hostname: inspected.hostname,
    inheritedFrom: '',
    hasSiteRule: false,
    adjust: normalized.adjust,
    customCss: '',
    darkScrollbar: normalized.darkScrollbar,
    keepMediaColors: normalized.keepMediaColors,
    protectBackgrounds: normalized.protectBackgrounds,
    theme: normalized.theme
  };

  if (!inspected.ok) {
    return { ...base, active: false, mode: 'off', reason: 'unsupported', badge: badgeFor(false, 'off', 'unsupported') };
  }
  if (!normalized.enabled) {
    return { ...base, active: false, mode: 'off', reason: 'disabled', badge: badgeFor(false, 'off', 'disabled') };
  }
  const pause = pauseReason(normalized, prefersDark, now);
  if (pause) {
    return { ...base, active: false, mode: 'off', reason: pause, badge: badgeFor(false, 'off', pause) };
  }

  const found = lookupSite(normalized.sites, inspected.hostname);
  const mode = found?.rule.mode || normalized.defaultMode;
  const adjust = found?.rule.adjust ? clampAdjust(found.rule.adjust) : normalized.adjust;
  const shared = {
    ...base,
    hasSiteRule: Boolean(found?.exact),
    inheritedFrom: found && !found.exact ? found.key : '',
    adjust,
    customCss: found?.rule.customCss || ''
  };
  if (mode === 'off') {
    return { ...shared, active: false, mode: 'off', reason: found ? 'site-off' : 'default-off', badge: badgeFor(false, 'off', 'site-off') };
  }
  return { ...shared, active: true, mode, reason: 'active', badge: badgeFor(true, mode, 'active') };
}

export function displayHost(hostname) {
  return hostname === 'local-file' ? '本地文件' : (hostname || '此页面');
}

export function modeLabel(mode) {
  if (mode === 'filter') return '滤镜';
  if (mode === 'off') return '普通';
  return '深色';
}

export function describeDecision(decision) {
  const host = displayHost(decision?.hostname);
  switch (decision?.reason) {
    case 'disabled':
      return '深色模式已关闭';
    case 'unsupported':
      return '这个页面不能改色';
    case 'paused-os':
      return '系统当前是浅色，已暂停';
    case 'paused-schedule':
      return '当前不在定时时段，已暂停';
    case 'paused-both':
      return '系统是浅色，而且不在定时里，已暂停';
    case 'site-off':
      return `${host} 保持原来的颜色`;
    case 'default-off':
      return '默认是普通模式，这个网站不会改色';
    case 'active':
      if (decision.inheritedFrom) return `${host} 正在套用 ${decision.inheritedFrom} 的${modeLabel(decision.mode)}`;
      return `${host} 正在使用${modeLabel(decision.mode)}`;
    default:
      return '等待当前页面';
  }
}

export function withSitePatch(settings, hostname, patch) {
  const normalized = normalizeSettings(settings);
  const key = siteKey(hostname);
  if (!isSiteKey(key) || BLOCKED_HOST.test(key)) return normalized;
  const current = normalized.sites[key] || { mode: normalized.defaultMode === 'off' ? 'dark' : normalized.defaultMode, adjust: null, customCss: '', includeSubdomains: false };
  const sites = { ...normalized.sites, [key]: normalizeSite({ ...current, ...patch }, normalized.defaultMode) };
  return normalizeSettings({ ...normalized, sites });
}

export function withoutSite(settings, hostname) {
  const normalized = normalizeSettings(settings);
  const key = siteKey(hostname);
  if (!normalized.sites[key]) return normalized;
  const sites = { ...normalized.sites };
  delete sites[key];
  return { ...normalized, sites };
}

export function toggleSite(settings, hostname) {
  const normalized = normalizeSettings(settings);
  const found = lookupSite(normalized.sites, hostname);
  const current = found?.rule.mode || normalized.defaultMode;
  const next = current === 'off' ? (normalized.defaultMode === 'off' ? 'dark' : normalized.defaultMode) : 'off';
  return withSitePatch(normalized, hostname, { mode: next });
}
