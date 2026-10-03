import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { decide } from '../src/dark/model.js';
import { buildDynamicTheme } from '../src/dark/style.js';
import { fetchStylesheet } from '../src/background/stylesheet-fetch.js';

test('动态引擎重复刷新不重建，切换滤镜和关闭会清理，重新开启能恢复', async () => {
  const calls = [];
  const context = vm.createContext({
    document: { readyState: 'complete', hidden: true },
    DarkReader: {
      setFetchMethod() {},
      enable(theme, fixes) { calls.push({ theme, fixes }); },
      disable() { calls.push('disabled'); }
    }
  });
  const source = await readFile(new URL('../src/content/dynamic-theme.js', import.meta.url), 'utf8');
  vm.runInContext(source, context);
  const apply = context.__dmApplyDynamicTheme;
  const payload = { active: true, mode: 'theme', dynamicTheme: buildDynamicTheme(decide({}, { url: 'https://example.com' })), keepMediaColors: true };
  apply(payload);
  apply(payload);
  vm.runInContext(source, context);
  assert.equal(context.__dmApplyDynamicTheme, apply);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].theme.immediateModify, true);
  assert.deepEqual(Array.from(calls[0].fixes.ignoreImageAnalysis), ['*']);
  apply({ ...payload, dynamicTheme: { ...payload.dynamicTheme, brightness: 120 } });
  assert.equal(calls[1].theme.brightness, 120);
  apply({ active: true, mode: 'filter' });
  apply({ active: false });
  assert.equal(calls.length, 3);
  assert.equal(calls[2], 'disabled');
  apply(payload);
  assert.equal(calls.length, 4);
});

test('首次加载保持就绪监听，已加载页面启用不等待可见性事件', async () => {
  const calls = [];
  const document = { readyState: 'loading', hidden: true };
  const context = vm.createContext({ document, DarkReader: {
    setFetchMethod() {}, enable(theme) { calls.push(theme); }, disable() {}
  } });
  vm.runInContext(await readFile(new URL('../src/content/dynamic-theme.js', import.meta.url), 'utf8'), context);
  const payload = { active: true, mode: 'theme', dynamicTheme: { mode: 1 } };
  context.__dmApplyDynamicTheme(payload);
  assert.equal(calls[0].immediateModify, false);
  document.readyState = 'complete';
  document.hidden = false;
  context.__dmApplyDynamicTheme(payload);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].immediateModify, true);
  context.__dmApplyDynamicTheme(payload);
  assert.equal(calls.length, 2);
});

test('样式表读取限制来源、协议、响应类型、大小与重定向', async () => {
  const originalFetch = globalThis.fetch;
  const sender = { tab: { url: 'https://example.com' } };
  const href = 'https://cdn.example.com/main.css';
  try {
    let options;
    globalThis.fetch = async (_url, opts) => {
      options = opts;
      return new Response('body { color: red; }', { headers: { 'Content-Type': 'text/css' } });
    };
    assert.equal((await fetchStylesheet({ href }, sender)).text, 'body { color: red; }');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'manual');
    globalThis.fetch = async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } });
    assert.deepEqual((await fetchStylesheet({ href }, sender)).bytes, [1, 2, 3]);
    await assert.rejects(fetchStylesheet({ href }, {}), /Page sender/);
    for (const url of ['file:///secret', 'https://localhost/a.css', 'http://127.0.0.1/a.css', 'https://name:password@example.com/a.css']) {
      await assert.rejects(fetchStylesheet({ href: url }, sender));
    }
    globalThis.fetch = async () => new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } });
    await assert.rejects(fetchStylesheet({ href }, sender), /Expected a stylesheet/);
    globalThis.fetch = async () => new Response('x'.repeat(2 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'text/css' } });
    await assert.rejects(fetchStylesheet({ href }, sender), /too large/);
    globalThis.fetch = async () => new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/private.css' } });
    await assert.rejects(fetchStylesheet({ href }, sender), /Local network/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('两种浏览器都先加载本地动态引擎，保留文档启动时机', async () => {
  for (const path of ['manifest.json', 'manifest.firefox.json']) {
    const manifest = JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
    assert.deepEqual(manifest.content_scripts[0].js, ['src/vendor/darkreader.js', 'src/content/dynamic-theme.js', 'src/content/content.js']);
    assert.equal(manifest.content_scripts[0].run_at, 'document_start');
  }
  const vendor = await readFile(new URL('../src/vendor/darkreader.js', import.meta.url), 'utf8');
  assert.match(vendor, /const chrome = \{ runtime: \{\} \}/);
  assert.doesNotMatch(vendor, /\beval\s*\(|new Function\s*\(/);
});
