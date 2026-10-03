import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeSettings } from '../src/dark/model.js';
import { applyTheme, resolveTheme, themesFromData } from '../src/ui/themes/theme.js';

function fakeRoot() {
  const props = new Map();
  return {
    dataset: {},
    style: {
      setProperty(name, value) { props.set(name, value); },
      removeProperty(name) { props.delete(name); }
    },
    get(name) { return props.get(name); }
  };
}

test('氛围主题 JSON 会带上背景光和效果', async () => {
  const data = JSON.parse(await readFile(new URL('../src/ui/themes/themes-ambient-full.json', import.meta.url), 'utf8'));
  const themes = themesFromData(data);
  assert.equal(themes.length, 8);
  assert.equal(themes.filter((theme) => theme.mode === 'dark').length, 8);
  assert.equal(themes.some((theme) => theme.mode === 'light'), false);
  assert.ok(themes.every((theme) => theme.gradients.background.includes('radial-gradient')));
  assert.equal(resolveTheme('missing', themes).id, 'obsidian');
  assert.equal(resolveTheme('default', themes).id, 'obsidian');

  const root = fakeRoot();
  assert.equal(applyTheme(root, 'ember-orange', themes), true);
  assert.equal(root.dataset.theme, 'ember-orange');
  assert.equal(root.dataset.themeMode, 'dark');
  assert.match(root.get('--theme-background'), /^#/);
  assert.match(root.get('--theme-gradient-background'), /radial-gradient/);
  assert.equal(root.get('--theme-gradient-preview'), themes.find((theme) => theme.id === 'ember-orange').gradients.preview);
  assert.equal(root.get('--theme-surface-blur'), '14px');
});

test('旧的默认主题名会落到曜石黑', () => {
  assert.equal(normalizeSettings({ theme: 'default' }).theme, 'obsidian');
  assert.equal(normalizeSettings({ theme: 'tokyo-love' }).theme, 'obsidian');
  assert.equal(normalizeSettings({ theme: 'ember' }).theme, 'ember-orange');
  assert.equal(normalizeSettings({}).theme, 'obsidian');
  assert.equal('pageTheme' in normalizeSettings({ theme: 'ember', pageTheme: 'cyan-mist' }), false);
});
