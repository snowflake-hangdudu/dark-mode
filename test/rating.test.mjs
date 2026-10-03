import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRemoteConfig } from '../src/background/remote-config.js';
import { noteWebsiteUse, ratingPrompt } from '../src/shared/rating.js';

const version = '1.0.0';
const rating = {
  enabled: true,
  minSuccess: 3,
  edge: 'https://microsoftedge.microsoft.com/addons/detail/dark-mode/example',
  chrome: 'https://chromewebstore.google.com/detail/dark-mode/example',
  firefox: '',
  url: 'https://example.com/rate'
};

test('评分按用过的网站计数，同一个网站只算一次', () => {
  let state = noteWebsiteUse(null, 'https://ignored', version).state;
  state = noteWebsiteUse(state, 'www.bilibili.com', version).state;
  state = noteWebsiteUse(state, 'bilibili.com', version).state;
  state = noteWebsiteUse(state, 'youtube.com', version).state;
  assert.equal(ratingPrompt(state, rating, 'edge', false), null);
  state = noteWebsiteUse(state, 'github.com', version).state;
  state = noteWebsiteUse(state, 'local-file', version).state;
  const prompt = ratingPrompt(state, rating, 'edge', false);
  assert.equal(prompt.count, 3);
  assert.equal(prompt.store, 'Edge');
  assert.match(prompt.url, /^https:\/\/microsoftedge\.microsoft\.com\//);
});

test('未开启、没有商店链接或选择下次再说时不提示', () => {
  const state = ['a.com', 'b.com', 'c.com'].reduce((current, host) => noteWebsiteUse(current, host, version).state, null);
  assert.equal(ratingPrompt(state, { ...rating, enabled: false }, 'chrome', false), null);
  assert.equal(ratingPrompt(state, { ...rating, edge: '', chrome: 'http://insecure.example', firefox: '', url: '' }, 'chrome', false), null);
  const later = { ...state, dismissedUntilNextSite: true };
  assert.equal(ratingPrompt(later, rating, 'chrome', false), null);
  const again = noteWebsiteUse(later, 'd.com', version).state;
  assert.equal(again.dismissedUntilNextSite, false);
  assert.equal(ratingPrompt(again, rating, 'chrome', false).count, 4);
  assert.equal(ratingPrompt({ ...again, neverAsk: true }, rating, 'chrome', false), null);
  assert.equal(ratingPrompt(again, rating, 'chrome', true), null);
});

test('远程配置保留评分字段，并丢掉非 https 链接', () => {
  const config = normalizeRemoteConfig({
    enabled: true,
    rating: { enabled: false, minSuccess: 3, edge: 'http://bad.example', chrome: '', firefox: '', url: '' }
  });
  assert.equal(config.rating.enabled, false);
  assert.equal(config.rating.minSuccess, 3);
  assert.equal(config.rating.edge, '');
});
