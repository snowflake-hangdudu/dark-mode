const CACHE_KEY = 'dm-ext-cache-v3';
const api = globalThis.browser ?? globalThis.chrome;

let styleElement = null;
let current = { active: false, protectBackgrounds: false };
let sequence = 0;
let scanTimer = 0;
let observer = null;

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (!parsed || typeof parsed.css !== 'string' || !parsed.mode) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload) {
  try {
    if (!payload?.active || !payload.css) localStorage.removeItem(CACHE_KEY);
    else localStorage.setItem(CACHE_KEY, JSON.stringify({
      mode: payload.mode,
      css: payload.css,
      dynamicTheme: payload.dynamicTheme,
      keepMediaColors: payload.keepMediaColors,
      protectBackgrounds: payload.protectBackgrounds === true
    }));
  } catch {
    /* 部分页面禁止本地缓存，下次打开再向后台要一次设置。 */
  }
}

function mountCss(css) {
  const parent = document.head || document.documentElement;
  if (!parent) return;
  if (!styleElement || !styleElement.isConnected) {
    styleElement = document.getElementById('dm-ext-style');
  }
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'dm-ext-style';
    parent.appendChild(styleElement);
  }
  styleElement.textContent = css;
}

function ensureOverlay(name) {
  const root = document.documentElement;
  if (!root) return;
  let node = root.querySelector(`[data-dm-overlay="${name}"]`);
  if (!node) {
    node = document.createElement('div');
    node.setAttribute('data-dm-overlay', name);
    root.appendChild(node);
  }
}

function removeOverlays() {
  document.querySelectorAll('[data-dm-overlay]').forEach((node) => node.remove());
}

function clearBackgroundMarks() {
  document.querySelectorAll('.dm-ext-keep-bg').forEach((node) => node.classList.remove('dm-ext-keep-bg'));
}

function scanBackgrounds() {
  if (!current.protectBackgrounds || !document.body) return;
  const nodes = document.body.getElementsByTagName('*');
  const max = Math.min(nodes.length, 700);
  for (let index = 0; index < max; index += 1) {
    const element = nodes[index];
    if (element.hasAttribute('data-dm-overlay')) continue;
    let image = '';
    try {
      image = getComputedStyle(element).backgroundImage;
    } catch {
      continue;
    }
    if (image && image.includes('url(')) element.classList.add('dm-ext-keep-bg');
  }
}

function watchBackgrounds() {
  if (observer || !document.documentElement) return;
  observer = new MutationObserver(() => {
    if (!current.protectBackgrounds) return;
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanBackgrounds, 200);
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
}

function apply(payload) {
  const root = document.documentElement;
  if (!root) return;
  current = {
    active: Boolean(payload?.active && payload.css),
    protectBackgrounds: Boolean(payload?.protectBackgrounds)
  };
  if (!current.active) {
    globalThis.__dmApplyDynamicTheme?.(payload);
    root.removeAttribute('data-dm-mode');
    mountCss('');
    removeOverlays();
    clearBackgroundMarks();
    if (observer) observer.disconnect();
    observer = null;
    writeCache(null);
    return;
  }
  const paint = payload.mode === 'filter' || payload.mode === 'theme' ? payload.mode : 'dark';
  root.setAttribute('data-dm-mode', paint);
  mountCss(payload.css);
  globalThis.__dmApplyDynamicTheme?.(payload);
  ensureOverlay('warm');
  ensureOverlay('dim');
  writeCache(payload);
  if (current.protectBackgrounds) {
    watchBackgrounds();
    if (document.body) scanBackgrounds();
  } else {
    clearBackgroundMarks();
    if (observer) observer.disconnect();
    observer = null;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function send(message) {
  return new Promise((resolve) => {
    try {
      api.runtime.sendMessage(message, (response) => {
        if (api.runtime.lastError) resolve(null);
        else resolve(response ?? null);
      });
    } catch {
      resolve(null);
    }
  });
}

async function resolve() {
  const id = ++sequence;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches === true;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await send({ type: 'RESOLVE', href: location.href, prefersDark });
    if (id !== sequence) return;
    if (response?.ok) {
      apply(response);
      return;
    }
    await wait(80 * (attempt + 1));
    if (id !== sequence) return;
  }
}

const cached = readCache();
if (cached?.css) {
  apply({ ...cached, active: true });
}
resolve();
api.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'REFRESH') return false;
  resolve().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
  return true;
});
api.storage?.onChanged?.addListener((changes, area) => {
  if (area === 'local') resolve();
});
window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener?.('change', () => resolve());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resolve();
});
document.addEventListener('DOMContentLoaded', () => {
  if (current.protectBackgrounds) scanBackgrounds();
});
setInterval(() => {
  if (document.visibilityState === 'visible') resolve();
}, 30000);
