import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRemoteConfig, normalizeRemoteConfig, REMOTE_CONFIG_URL } from '../src/background/remote-config.js';
import { versionSupported } from '../src/shared/remote-panel.js';

const payload = { enabled: true, minExtensionVersion: '1.0.0', notice: { enabled: true, pinned: 'Hello', recent: ['Update'] }, coop: { enabled: true, body: 'QQ: 748604487' } };

test('公告兼容字符串和数组，版本门槛按数字比较', () => {
  const config = normalizeRemoteConfig(payload);
  assert.deepEqual(config.notice.pinned, ['Hello']);
  assert.deepEqual(config.notice.recent, ['Update']);
  assert.equal(versionSupported('1.10.0', '1.2.0'), true);
  assert.equal(versionSupported('1.0.0', '1.0.1'), false);
  assert.throws(() => normalizeRemoteConfig([]));
});

test('固定接口按语言缓存，重复读取不重复联网，断网回退到缓存', async () => {
  const previousFetch = globalThis.fetch;
  const storage = {};
  const api = { storage: { local: { async get(key) { return { [key]: storage[key] }; }, async set(value) { Object.assign(storage, value); } } } };
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(url);
    return { ok: true, async json() { return payload; } };
  };
  try {
    const [first, concurrent] = await Promise.all([loadRemoteConfig('en', api), loadRemoteConfig('en', api)]);
    assert.deepEqual(first, concurrent);
    assert.deepEqual(requests, [REMOTE_CONFIG_URL + '?lang=en']);
    await loadRemoteConfig('en', api);
    assert.equal(requests.length, 1);
    await loadRemoteConfig('zh-TW', api);
    assert.equal(requests[1], REMOTE_CONFIG_URL);
    storage['dark.mode.remote.en'].savedAt = 0;
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.deepEqual(await loadRemoteConfig('en', api), first);
    assert.equal((await loadRemoteConfig('zh', { storage: { local: { async get() { return {}; } } } })).notice.enabled, false);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
