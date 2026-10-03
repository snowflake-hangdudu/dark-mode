import test from 'node:test';
import assert from 'node:assert/strict';
import { languagesHaveSameKeys, normalizePreference, saveLanguage, t, themeLabel } from '../src/shared/i18n.js';

test('简体、繁体和英文使用同一套文案键', () => {
  assert.equal(languagesHaveSameKeys(), true);
});

test('语言切换会换成对应文案', async () => {
  assert.equal(normalizePreference('zh-tw'), 'zh-TW');
  await saveLanguage('en');
  assert.equal(t('language'), 'Language');
  assert.equal(t('siteLimit', { n: 12 }), 'You can save up to 12 sites.');
  assert.equal(themeLabel('ember-orange'), 'Ember');
  await saveLanguage('zh-TW');
  assert.equal(t('language'), '語言');
  assert.equal(t('traditionalChinese'), '繁體中文');
  assert.equal(t('modeFilter'), '濾鏡');
  await saveLanguage('zh-CN');
  assert.equal(t('addSite'), '添加');
  assert.equal(t('themeDefault'), '默认主题');
});
