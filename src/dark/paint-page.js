export function paintInPage(payload) {
  const cacheKey = 'dm-ext-cache-v3';
  const root = document.documentElement;
  if (!root) return;
  const active = Boolean(payload?.active && payload.css);
  let style = document.getElementById('dm-ext-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dm-ext-style';
    (document.head || root).appendChild(style);
  }
  if (!active) {
    globalThis.__dmApplyDynamicTheme?.(payload);
    root.removeAttribute('data-dm-mode');
    style.textContent = '';
    root.querySelectorAll('[data-dm-overlay]').forEach((node) => node.remove());
    try { localStorage.removeItem(cacheKey); } catch { /* 部分页面禁止本地缓存。 */ }
    return;
  }
  const paint = payload.mode === 'filter' || payload.mode === 'theme' ? payload.mode : 'dark';
  root.setAttribute('data-dm-mode', paint);
  style.textContent = payload.css;
  globalThis.__dmApplyDynamicTheme?.(payload);
  for (const name of ['warm', 'dim']) {
    if (!root.querySelector(`[data-dm-overlay="${name}"]`)) {
      const node = document.createElement('div');
      node.setAttribute('data-dm-overlay', name);
      root.appendChild(node);
    }
  }
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      mode: payload.mode,
      css: payload.css,
      dynamicTheme: payload.dynamicTheme,
      keepMediaColors: payload.keepMediaColors,
      protectBackgrounds: payload.protectBackgrounds === true
    }));
  } catch { /* 部分页面禁止本地缓存。 */ }
}
