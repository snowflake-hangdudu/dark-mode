import test from 'node:test';
import assert from 'node:assert/strict';
import { exportDocument, settingsFromImport } from '../src/storage/backup.js';
import { DEFAULT_SETTINGS } from '../src/dark/model.js';

test('备份只含可见功能，导入旧备份忽略隐藏字段', () => {
  const legacy = {
    theme: 'dark-crimson', enabled: false, defaultMode: 'filter',
    followOs: true, scheduleEnabled: true, scheduleStart: '01:00', scheduleEnd: '02:00',
    darkScrollbar: false, keepMediaColors: false, protectBackgrounds: true,
    sites: { 'example.com': { mode: 'dark', includeSubdomains: true, customCss: 'body { display:none }', adjust: { brightness: 90 } } }
  };
  const exported = exportDocument(legacy).settings;
  assert.deepEqual(Object.keys(exported), ['theme', 'enabled', 'defaultMode', 'adjust', 'sites']);
  assert.deepEqual(Object.keys(exported.sites['example.com']), ['mode', 'adjust', 'includeSubdomains']);
  for (const wrapped of [legacy, { schema: 1, settings: legacy }]) {
    const imported = settingsFromImport(JSON.stringify(wrapped));
    for (const key of ['followOs', 'scheduleEnabled', 'scheduleStart', 'scheduleEnd', 'darkScrollbar', 'keepMediaColors', 'protectBackgrounds']) {
      assert.equal(imported[key], DEFAULT_SETTINGS[key]);
    }
    assert.equal(imported.sites['example.com'].customCss, '');
    assert.equal(imported.sites['example.com'].adjust.brightness, 90);
    assert.equal(imported.enabled, false);
    assert.equal(imported.defaultMode, 'filter');
    assert.deepEqual(exportDocument(imported).settings, exported);
  }
});

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
