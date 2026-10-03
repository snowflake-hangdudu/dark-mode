import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decide,
  isWithinSchedule,
  normalizeSettings,
  toggleSite,
  withSitePatch
} from '../src/dark/model.js';
import { paintInPage } from '../src/dark/paint-page.js';
import { buildStylesheet, buildDynamicTheme } from '../src/dark/style.js';

const at = (hour, minute) => new Date(2026, 9, 4, hour, minute, 0);

test('跨夜定时只在晚上到清晨生效', () => {
  assert.equal(isWithinSchedule(at(21, 0), '20:00', '07:00'), true);
  assert.equal(isWithinSchedule(at(6, 59), '20:00', '07:00'), true);
  assert.equal(isWithinSchedule(at(7, 0), '20:00', '07:00'), false);
  assert.equal(isWithinSchedule(at(12, 0), '20:00', '07:00'), false);
  assert.equal(isWithinSchedule(at(12, 0), '09:00', '09:00'), true);
});

test('网站规则优先，子域只在勾选后继承', () => {
  const settings = normalizeSettings({
    defaultMode: 'dark',
    sites: {
      'example.com': { mode: 'filter', includeSubdomains: true },
      'news.example.com': { mode: 'off', includeSubdomains: true }
    }
  });
  assert.equal(decide(settings, { url: 'https://www.example.com/a' }).mode, 'filter');
  assert.equal(decide(settings, { url: 'https://news.example.com/' }).reason, 'site-off');
  const child = decide(settings, { url: 'https://a.news.example.com/' });
  assert.equal(child.active, false);
  const inherited = decide(settings, { url: 'https://blog.example.com/post' });
  assert.equal(inherited.mode, 'filter');
  assert.equal(inherited.inheritedFrom, 'example.com');
  const isolated = decide(normalizeSettings({
    sites: { 'example.com': { mode: 'filter', includeSubdomains: false } }
  }), { url: 'https://blog.example.com/' });
  assert.equal(isolated.mode, 'dark');
});

test('总开关、系统颜色和定时会暂停页面', () => {
  const base = { followOs: true, scheduleEnabled: true, scheduleStart: '20:00', scheduleEnd: '07:00' };
  assert.equal(decide(base, { url: 'https://example.com', prefersDark: false, now: at(12, 0) }).reason, 'paused-both');
  assert.equal(decide(base, { url: 'https://example.com', prefersDark: false, now: at(21, 0) }).active, true);
  assert.equal(decide({ ...base, enabled: false }, { url: 'https://example.com', prefersDark: true, now: at(21, 0) }).reason, 'disabled');
  assert.equal(decide({}, { url: 'chrome://settings' }).reason, 'unsupported');
  assert.equal(decide({}, { url: 'https://chromewebstore.google.com/detail/x' }).reason, 'unsupported');
  assert.equal(decide({}, { url: 'https://microsoftedge.microsoft.com/addons/detail/x' }).active, true);
  const source = paintInPage.toString();
  assert.match(source, /dm-ext-style/);
  assert.match(source, /dm-ext-cache-v3/);
  assert.doesNotMatch(source, /\bCACHE_KEY\b/);
});

test('切换只改当前网站', () => {
  const off = toggleSite({ defaultMode: 'dark' }, 'example.com');
  assert.equal(off.sites['example.com'].mode, 'off');
  assert.equal(off.defaultMode, 'dark');
  assert.equal(toggleSite(off, 'example.com').sites['example.com'].mode, 'dark');
});

test('动态着色保留透明层和媒体，滤镜不反相', () => {
  const dark = decide({
    adjust: { brightness: 90, contrast: 110, saturation: 80, blueLight: 40, dim: 20 },
    keepMediaColors: true
  }, { url: 'https://example.com' });
  const darkCss = buildStylesheet(dark);
  const dynamic = buildDynamicTheme(dark);
  assert.equal(dynamic.darkSchemeBackgroundColor, '#090A0D');
  assert.equal(dynamic.brightness, 90);
  assert.equal(dynamic.contrast, 110);
  assert.doesNotMatch(darkCss, /background-color:/);
  assert.doesNotMatch(darkCss, /rgba\(/);
  assert.match(darkCss, /saturate\(0\.80\)/);
  assert.doesNotMatch(darkCss, /background-blend-mode: multiply/);
  assert.doesNotMatch(darkCss, /background-image: none/);
  assert.match(darkCss, /opacity: 0\.200/);
  assert.doesNotMatch(darkCss, /invert\(1\)/);
  assert.doesNotMatch(darkCss, /@import|expression\(|javascript:/);

  const filter = decide(withSitePatch({}, 'example.com', {
    mode: 'filter',
    customCss: '@import url(https://example.com/x.css); body { color: red; }'
  }), { url: 'https://example.com' });
  const filterCss = buildStylesheet(filter);
  assert.equal(filter.mode, 'filter');
  assert.doesNotMatch(filterCss, /invert\(1\)/);
  assert.doesNotMatch(filterCss, /body \{ color: red; \}/);
  assert.doesNotMatch(filterCss, /@import/);
  assert.equal(buildStylesheet(decide({ enabled: false }, { url: 'https://example.com' })), '');
  const ember = buildStylesheet(decide({ theme: 'ember-orange' }, { url: 'https://example.com' }));
  assert.equal(buildDynamicTheme(decide({ theme: 'ember-orange' }, { url: 'https://example.com' })).darkSchemeBackgroundColor, '#140D08');
  assert.doesNotMatch(ember, /background-color:/);
  assert.equal(decide({ theme: 'ember' }, { url: 'https://example.com' }).theme, 'ember-orange');
});
