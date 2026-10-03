import test from 'node:test';
import assert from 'node:assert/strict';

test('后台 Worker 可加载并注册唯一消息监听器', async () => {
  const previousChrome = globalThis.chrome;
  const listeners = [];
  globalThis.chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: { addListener(listener) { listeners.push(listener); } },
      getManifest: () => ({ version: '0.1.0' }),
      getURL: (path = '') => `chrome-extension://test/${path}`
    },
    storage: { local: { async get() { return {}; }, async set() {}, async remove() {} } }
  };
  try {
    await import(`../src/background/service-worker.js?test=${Date.now()}`);
    assert.equal(listeners.length, 1);
    const response = await new Promise((resolve) => listeners[0]({ type: 'PING' }, {}, resolve));
    assert.equal(response.ok, true);
    assert.equal(response.plugin, "dark-mode");
  } finally {
    globalThis.chrome = previousChrome;
  }
});
