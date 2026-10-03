import test from 'node:test';
import assert from 'node:assert/strict';
import { createMessageRouter } from '../src/background/message-router.js';
import { createSettingsStore } from '../src/storage/store.js';

test('消息路由统一返回异步错误载荷', async () => {
  const router = createMessageRouter({ FAIL: async () => { throw new Error('失败'); } });
  const response = await new Promise((resolve) => {
    assert.equal(router.listener({ type: 'FAIL' }, {}, resolve), true);
  });
  assert.deepEqual(response, { ok: false, code: 'UNKNOWN', message: '失败' });
  assert.equal(router.listener({ type: 'UNKNOWN' }, {}, () => {}), false);
});

test('设置存储只清理自己的 key 并经过 normalize', async () => {
  const values = {};
  const previousChrome = globalThis.chrome;
  globalThis.chrome = { storage: { local: {
    async get(key) { return { [key]: values[key] }; },
    async set(patch) { Object.assign(values, patch); },
    async remove(key) { delete values[key]; }
  } } };
  try {
    const store = createSettingsStore({
      key: 'demo.settings', defaults: { count: 1 },
      normalize: (value) => ({ count: Math.max(0, Number(value.count) || 0) })
    });
    assert.deepEqual(await store.save({ count: -2 }), { count: 0 });
    values.other = { keep: true };
    assert.deepEqual(await store.clear(), { count: 1 });
    assert.deepEqual(values.other, { keep: true });
  } finally {
    globalThis.chrome = previousChrome;
  }
});

test('并发保存设置按顺序合并，不丢失 patch', async () => {
  const values = {};
  const previousChrome = globalThis.chrome;
  globalThis.chrome = { storage: { local: {
    async get(key) { await Promise.resolve(); return { [key]: values[key] }; },
    async set(patch) { await Promise.resolve(); Object.assign(values, patch); },
    async remove(key) { delete values[key]; }
  } } };
  try {
    const store = createSettingsStore({ key: 'concurrent.settings', defaults: { a: 0, b: 0 } });
    await Promise.all([store.save({ a: 1 }), store.save({ b: 2 })]);
    assert.deepEqual(await store.load(), { a: 1, b: 2 });
  } finally {
    globalThis.chrome = previousChrome;
  }
});
