import { clampAdjust } from './model.js';
import { pageThemeById } from './page-themes.js';

function filterValue(mode, adjust) {
  const value = clampAdjust(adjust);
  const parts = [];
  if (mode === 'dark') parts.push('invert(1)', 'hue-rotate(180deg)');
  if (value.brightness !== 100) parts.push(`brightness(${(value.brightness / 100).toFixed(2)})`);
  if (value.contrast !== 100) parts.push(`contrast(${(value.contrast / 100).toFixed(2)})`);
  if (value.saturation !== 100) parts.push(`saturate(${(value.saturation / 100).toFixed(2)})`);
  return parts.join(' ');
}

function overlayCss(warm, dim) {
  return `
html[data-dm-mode] [data-dm-overlay] {
  all: initial;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  pointer-events: none !important;
  display: block !important;
}
html[data-dm-mode] [data-dm-overlay="warm"] {
  z-index: 2147483646 !important;
  background: #ffb15a !important;
  mix-blend-mode: multiply !important;
  opacity: ${(warm * 0.55).toFixed(3)} !important;
  visibility: ${warm > 0 ? 'visible' : 'hidden'} !important;
}
html[data-dm-mode] [data-dm-overlay="dim"] {
  z-index: 2147483647 !important;
  background: #000000 !important;
  opacity: ${dim.toFixed(3)} !important;
  visibility: ${dim > 0 ? 'visible' : 'hidden'} !important;
}`;
}

function channelHex(value) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

function parseColor(color) {
  const text = String(color || '').trim();
  const rgba = text.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] == null ? 1 : Number(rgba[4])];
  const hex = text.match(/^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i);
  if (!hex) return null;
  const raw = hex[1].length === 3 ? hex[1].split('').map((part) => part + part).join('') : hex[1];
  return [
    parseInt(raw.slice(0, 2), 16),
    parseInt(raw.slice(2, 4), 16),
    parseInt(raw.slice(4, 6), 16),
    raw.length >= 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1
  ];
}

function solidColor(color, background) {
  const src = parseColor(color);
  const base = parseColor(background) || [9, 10, 13, 1];
  if (!src) return String(background || '#090A0D');
  const alpha = src[3];
  const mixed = [0, 1, 2].map((index) => src[index] * alpha + base[index] * (1 - alpha));
  return `#${mixed.map(channelHex).join('')}`.toUpperCase();
}

function pageColors(theme) {
  const background = solidColor(theme.colors.background, '#090A0D');
  const colors = { background };
  for (const [key, value] of Object.entries(theme.colors)) {
    colors[key] = key === 'background' ? background : solidColor(value, background);
  }
  return colors;
}
export function buildDynamicTheme(decision) {
  if (!decision?.active || decision.mode !== 'dark') return null;
  const theme = pageThemeById(decision.theme);
  if (!theme) return null;
  const colors = pageColors(theme);
  const adjust = clampAdjust(decision.adjust);
  return {
    mode: 1,
    brightness: adjust.brightness,
    contrast: adjust.contrast,
    darkSchemeBackgroundColor: colors.background,
    darkSchemeTextColor: colors.textPrimary,
    scrollbarColor: decision.darkScrollbar ? 'auto' : '',
    selectionColor: 'auto',
    styleSystemControls: true,
    useFont: false,
    // Saturation is applied separately without changing the page's layout.
    grayscale: 0,
    sepia: 0
  };
}

function buildThemeStylesheet(theme, decision, warm, dim) {
  const saturation = clampAdjust(decision.adjust).saturation;
  const media = saturation !== 100
    ? `html[data-dm-mode="theme"] :is(img, video, canvas) { filter: saturate(${(saturation / 100).toFixed(2)}) !important; }`
    : '';
  // Dynamic engine owns colors. Never paint transparent containers, links,
  // controls or fixed headers with blanket overrides.
  return `${media}\n${overlayCss(warm, dim)}`.trim();
}

export function paintMode(decision) {
  if (!decision?.active) return 'off';
  if (decision.mode === 'filter') return 'filter';
  return pageThemeById(decision.theme) ? 'theme' : 'dark';
}

export function buildStylesheet(decision) {
  if (!decision?.active || (decision.mode !== 'dark' && decision.mode !== 'filter')) return '';
  const dim = Math.min(0.7, Math.max(0, Number(decision.adjust?.dim) || 0) / 100);
  const warm = Math.min(1, Math.max(0, Number(decision.adjust?.blueLight) || 0) / 100);
  const pageTheme = decision.mode === 'dark' ? pageThemeById(decision.theme) : null;
  if (pageTheme) return buildThemeStylesheet(pageTheme, decision, warm, dim);
  const filter = filterValue(decision.mode, decision.adjust);
  const scheme = decision.mode === 'dark' || decision.darkScrollbar ? 'color-scheme: dark !important;' : '';
  const media = decision.mode === 'dark' && decision.keepMediaColors
    ? 'html[data-dm-mode="dark"] :is(img, video, canvas, svg, embed, object, iframe, picture) { filter: invert(1) hue-rotate(180deg) !important; }'
    : '';
  const backgrounds = decision.mode === 'dark' && decision.protectBackgrounds
    ? 'html[data-dm-mode="dark"] .dm-ext-keep-bg { filter: invert(1) hue-rotate(180deg) !important; }'
    : '';
  const filterRule = filter ? `filter: ${filter} !important;` : '';
  return `
html[data-dm-mode="dark"], html[data-dm-mode="filter"] { min-height: 100% !important; background-color: #111111 !important; ${scheme} }
html[data-dm-mode="dark"] > body { min-height: 100vh !important; ${filterRule} background-color: #ffffff !important; }
html[data-dm-mode="filter"] > body { min-height: 100vh !important; ${filterRule} }
${media}
${backgrounds}
${overlayCss(warm, dim)}
`.trim();
}
