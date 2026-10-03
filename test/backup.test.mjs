import test from 'node:test';
import assert from 'node:assert/strict';
import { exportDocument, settingsFromImport } from '../src/storage/backup.js';

function installChrome() {
  const values = {};
  globalThis.chrome = {
    storage: {
      local: {
        async get(key) { return { [key]: values[key] }; },
        async set(patch) { Object.assign(values, patch); },
        async remove(key) { delete values[key]; }
      },
      onChanged: { addListener() {} }
    }
  };
  return values;
}

test('导出的文件可以导回，并替换掉原来的网站', async () => {
  installChrome();
  const { loadSettings, saveSettings } = await import('../src/storage/settings.js');
  await saveSettings({
    theme: 'pine-mist',
    adjust: { brightness: 80, contrast: 110, saturation: 90, blueLight: 20, dim: 10 },
    sites: { 'example.com': { mode: 'off', includeSubdomains: true } }
  });
  const exported = exportDocument(await loadSettings(), new Date('2026-10-04T00:00:00.000Z'));
  const text = JSON.stringify(exported);
  await saveSettings({ theme: 'obsidian', sites: { 'bilibili.com': { mode: 'dark' } } });

  const stored = await saveSettings(settingsFromImport(text));
  assert.equal(exported.schema, 1);
  assert.equal(exported.exportedAt, '2026-10-04T00:00:00.000Z');
  assert.equal(stored.theme, 'pine-mist');
  assert.equal(stored.adjust.brightness, 80);
  assert.equal(stored.adjust.dim, 10);
  assert.equal(stored.sites['example.com'].mode, 'off');
  assert.equal(stored.sites['example.com'].includeSubdomains, true);
  assert.equal(stored.sites['bilibili.com'], undefined);
  assert.equal(settingsFromImport(JSON.stringify({ theme: 'ember-orange', sites: {} })).theme, 'ember-orange');
  assert.throws(() => settingsFromImport('{'), SyntaxError);
  assert.throws(() => settingsFromImport('[]'));
  assert.throws(() => settingsFromImport('null'));
});
