const KEY = 'dark.mode.language';

const messages = {
  'zh-CN': {
    extName: '深色模式 - 网页夜间模式',
    extDesc: '按网站调节亮度、对比度和色温。',
    settingsTitle: '深色模式设置',
    settingsDesc: '扩展偏好设置保存在本机。',
    language: '语言',
    chinese: '简体中文',
    traditionalChinese: '繁體中文',
    english: 'English',
    theme: '主题',
    themeHint: '扩展界面和网页共用这一套主题，改一处两边一起变。',
    themeDefault: '默认主题',
    'theme-obsidian': '曜石黑',
    'theme-deep-ocean': '深海蓝',
    'theme-mist-cyan': '苍雾青',
    'theme-night-purple': '夜雾紫',
    'theme-ember-orange': '余烬橙',
    'theme-copper-smoke': '铜烟棕',
    'theme-dark-crimson': '暗绯红',
    'theme-pine-mist': '松雾绿',
    themeSaved: '主题已保存。',
    themeSaveFailed: '主题未能保存，请重试。',
    settingsLoadFailed: '设置暂时无法读取。',
    settingsSaveFailed: '设置没能保存，请重试。',
    openSettings: '设置',
    back: '返回',
    navLabel: '主导航',
    tabFeature: '功能',
    tabSettings: '设置',
    openFullSettings: '打开完整设置',
    openFullSettingsFailed: '无法打开完整设置页，请从扩展菜单中打开。',
    modeDark: '深色',
    modeFilter: '滤镜',
    modeNormal: '普通',
    modeHintDark: '用当前主题给网页上色',
    modeHintFilter: '只调明暗和色温，不改成深色',
    modeHintNormal: '这个网站保持原样',
    sitesTitle: '网站列表',
    siteInputLabel: '网站域名',
    addSite: '添加',
    sitesEmpty: '还没有单独设置的网站。',
    backup: '备份',
    exportSettings: '导出设置',
    importSettings: '导入设置',
    feedbackLabel: '反馈邮箱',
    ratingTitle: '用着顺手的话 ⭐ 给个好评呗',
    ratingText: '深色模式已经在 {count} 个网站生效。去 {store} 商店点个分，对我们很有帮助。不评也完全没问题。',
    ratingGo: '去 {store} 商店评分 ⭐',
    ratingLater: '下次再说',
    ratingNever: '别再问了',
    invalidHost: '请输入有效的域名，例如 example.com。',
    siteLimit: '最多保存 {n} 个网站。',
    siteAdded: '已添加网站。',
    siteAddFailed: '网站没能添加。',
    siteRemoved: '已移除这个网站。',
    siteSaveFailed: '网站设置没能保存。',
    imported: '设置已导入。',
    importInvalid: '这个文件不是可用的设置备份。',
    includeSubdomains: '含子域',
    removeSite: '移除',
    siteModeAria: '{host} 的模式',
    enableDark: '启用深色模式',
    modeGroup: '模式',
    scopeGroup: '保存范围',
    scopeSite: '此网站',
    scopeAll: '全部网站',
    labelBrightness: '亮度',
    labelContrast: '对比',
    labelSaturation: '饱和',
    labelWarmth: '色温',
    labelDim: '变暗',
    modeHintGlobal: '这个网站还没有单独设置，现在显示的是全局效果。',
    scopeHintSite: '调节会记在当前网站上。已单独设置的其他网站不变。',
    scopeHintAll: '调节会改全部网站的默认效果。已经单独设置过的网站保持不变。',
    resetSite: '恢复此网站',
    resetAdjust: '恢复默认调节',
    noPage: '没有可改色的页面',
    localFile: '本地文件',
    thisPage: '此页面',
    cannotSaveSite: '这个网站暂时不能单独保存。'
  },
  'zh-TW': {
    extName: '深色模式 - 網頁夜間模式',
    extDesc: '按網站調整亮度、對比度和色溫。',
    settingsTitle: '深色模式設定',
    settingsDesc: '擴充功能偏好設定保存在本機。',
    language: '語言',
    chinese: '简体中文',
    traditionalChinese: '繁體中文',
    english: 'English',
    theme: '主題',
    themeHint: '擴充功能介面和網頁共用這一套主題，改一處兩邊一起變。',
    themeDefault: '預設主題',
    'theme-obsidian': '曜石黑',
    'theme-deep-ocean': '深海藍',
    'theme-mist-cyan': '蒼霧青',
    'theme-night-purple': '夜霧紫',
    'theme-ember-orange': '餘燼橙',
    'theme-copper-smoke': '銅煙棕',
    'theme-dark-crimson': '暗緋紅',
    'theme-pine-mist': '松霧綠',
    themeSaved: '主題已儲存。',
    themeSaveFailed: '主題未能儲存，請重試。',
    settingsLoadFailed: '設定暫時無法讀取。',
    settingsSaveFailed: '設定沒能儲存，請重試。',
    openSettings: '設定',
    back: '返回',
    navLabel: '主導覽',
    tabFeature: '功能',
    tabSettings: '設定',
    openFullSettings: '開啟完整設定',
    openFullSettingsFailed: '無法開啟完整設定頁，請從擴充功能選單中開啟。',
    modeDark: '深色',
    modeFilter: '濾鏡',
    modeNormal: '一般',
    modeHintDark: '用目前主題給網頁上色',
    modeHintFilter: '只調明暗和色溫，不改成深色',
    modeHintNormal: '這個網站保持原樣',
    sitesTitle: '網站清單',
    siteInputLabel: '網站網域',
    addSite: '新增',
    sitesEmpty: '還沒有單獨設定的網站。',
    backup: '備份',
    exportSettings: '匯出設定',
    importSettings: '匯入設定',
    feedbackLabel: '回饋信箱',
    ratingTitle: '用著順手的話 ⭐ 給個好評吧',
    ratingText: '深色模式已經在 {count} 個網站生效。去 {store} 商店點個分，對我們很有幫助。不評也完全沒問題。',
    ratingGo: '前往 {store} 商店評分 ⭐',
    ratingLater: '下次再說',
    ratingNever: '不要再問',
    invalidHost: '請輸入有效的網域，例如 example.com。',
    siteLimit: '最多儲存 {n} 個網站。',
    siteAdded: '已新增網站。',
    siteAddFailed: '網站沒能新增。',
    siteRemoved: '已移除這個網站。',
    siteSaveFailed: '網站設定沒能儲存。',
    imported: '設定已匯入。',
    importInvalid: '這個檔案不是可用的設定備份。',
    includeSubdomains: '含子網域',
    removeSite: '移除',
    siteModeAria: '{host} 的模式',
    enableDark: '啟用深色模式',
    modeGroup: '模式',
    scopeGroup: '儲存範圍',
    scopeSite: '此網站',
    scopeAll: '全部網站',
    labelBrightness: '亮度',
    labelContrast: '對比',
    labelSaturation: '飽和',
    labelWarmth: '色溫',
    labelDim: '變暗',
    modeHintGlobal: '這個網站還沒有單獨設定，現在顯示的是全域效果。',
    scopeHintSite: '調整會記在目前網站上。已單獨設定的其他網站不變。',
    scopeHintAll: '調整會改全部網站的預設效果。已經單獨設定過的網站保持不變。',
    resetSite: '還原此網站',
    resetAdjust: '還原預設調整',
    noPage: '沒有可改色的頁面',
    localFile: '本機檔案',
    thisPage: '此頁面',
    cannotSaveSite: '這個網站暫時不能單獨儲存。'
  },
  en: {
    extName: 'Dark Mode - Dark Theme for Websites',
    extDesc: 'Brightness, contrast, and warmth for each site.',
    settingsTitle: 'Dark Mode settings',
    settingsDesc: 'Preferences stay on this device.',
    language: 'Language',
    chinese: '简体中文',
    traditionalChinese: '繁體中文',
    english: 'English',
    theme: 'Theme',
    themeHint: 'The extension and web pages share this theme. Changing it updates both.',
    themeDefault: 'Default theme',
    'theme-obsidian': 'Obsidian',
    'theme-deep-ocean': 'Deep Ocean',
    'theme-mist-cyan': 'Cyan Mist',
    'theme-night-purple': 'Night Purple',
    'theme-ember-orange': 'Ember',
    'theme-copper-smoke': 'Copper Smoke',
    'theme-dark-crimson': 'Dark Crimson',
    'theme-pine-mist': 'Pine Mist',
    themeSaved: 'Theme saved.',
    themeSaveFailed: 'Could not save the theme. Try again.',
    settingsLoadFailed: 'Settings could not be loaded.',
    settingsSaveFailed: 'Could not save settings. Try again.',
    openSettings: 'Settings',
    back: 'Back',
    navLabel: 'Main',
    tabFeature: 'Controls',
    tabSettings: 'Settings',
    openFullSettings: 'Open full settings',
    openFullSettingsFailed: 'Could not open the full settings page. Open it from the extensions menu.',
    modeDark: 'Dark',
    modeFilter: 'Filter',
    modeNormal: 'Normal',
    modeHintDark: 'Paints the page with the current theme',
    modeHintFilter: 'Adjusts brightness and warmth only',
    modeHintNormal: 'Leaves this site unchanged',
    sitesTitle: 'Sites',
    siteInputLabel: 'Site domain',
    addSite: 'Add',
    sitesEmpty: 'No per-site settings yet.',
    backup: 'Backup',
    exportSettings: 'Export settings',
    importSettings: 'Import settings',
    feedbackLabel: 'Feedback email',
    ratingTitle: 'Enjoying dark mode? ⭐',
    ratingText: 'Dark mode is on for {count} websites. A rating on the {store} store would mean a lot. Totally optional.',
    ratingGo: 'Rate on {store} ⭐',
    ratingLater: 'Later',
    ratingNever: 'Don\'t ask again',
    invalidHost: 'Enter a valid domain, such as example.com.',
    siteLimit: 'You can save up to {n} sites.',
    siteAdded: 'Site added.',
    siteAddFailed: 'Could not add the site.',
    siteRemoved: 'Site removed.',
    siteSaveFailed: 'Could not save the site settings.',
    imported: 'Settings imported.',
    importInvalid: 'This file is not a usable settings backup.',
    includeSubdomains: 'Subdomains',
    removeSite: 'Remove',
    siteModeAria: 'Mode for {host}',
    enableDark: 'Enable dark mode',
    modeGroup: 'Mode',
    scopeGroup: 'Apply to',
    scopeSite: 'This site',
    scopeAll: 'All sites',
    labelBrightness: 'Brightness',
    labelContrast: 'Contrast',
    labelSaturation: 'Saturation',
    labelWarmth: 'Warmth',
    labelDim: 'Dim',
    modeHintGlobal: 'This site has no override yet, so the global look is shown.',
    scopeHintSite: 'Changes are saved for this site. Other site overrides stay as they are.',
    scopeHintAll: 'Changes update the default for every site. Sites with their own settings stay as they are.',
    resetSite: 'Reset this site',
    resetAdjust: 'Reset adjustments',
    noPage: 'This page cannot be tinted',
    localFile: 'Local file',
    thisPage: 'This page',
    cannotSaveSite: 'This site cannot be saved on its own yet.'
  }
};

let preference = 'auto';
let current = 'zh-CN';
const listeners = new Set();
let readyPromise;

function extensionApi() {
  return globalThis.browser ?? globalThis.chrome;
}

function storageGet(key) {
  const storage = extensionApi()?.storage?.local;
  if (typeof storage?.get !== 'function') return Promise.resolve({});
  try {
    const result = storage.get(key);
    if (result && typeof result.then === 'function') return result;
  } catch {
    /* 回退到回调形式。 */
  }
  return new Promise((resolve) => {
    try {
      storage.get(key, (value) => resolve(value || {}));
    } catch {
      resolve({});
    }
  });
}

function storageSet(value) {
  const storage = extensionApi()?.storage?.local;
  if (typeof storage?.set !== 'function') return Promise.resolve();
  try {
    const result = storage.set(value);
    if (result && typeof result.then === 'function') return result;
  } catch {
    /* 回退到回调形式。 */
  }
  return new Promise((resolve) => {
    try {
      storage.set(value, () => resolve());
    } catch {
      resolve();
    }
  });
}

export function browserLanguage() {
  const ui = String(extensionApi()?.i18n?.getUILanguage?.() || globalThis.navigator?.language || 'zh-CN')
    .toLowerCase()
    .replace(/_/g, '-');
  if (/^zh-(?:tw|hk|mo|hant)(?:-|$)/.test(ui)) return 'zh-TW';
  if (/^zh(?:-cn|-sg|-hans)?(?:-|$)/.test(ui) || ui === 'zh') return 'zh-CN';
  if (/^en(?:-|$)/.test(ui)) return 'en';
  return 'zh-CN';
}

export function normalizePreference(value) {
  if (value === 'auto' || value == null || value === '') return 'auto';
  if (value === 'en') return 'en';
  if (value === 'zh-TW' || value === 'zh-tw') return 'zh-TW';
  if (value === 'zh-CN' || value === 'zh-cn') return 'zh-CN';
  return 'auto';
}

export function resolveLanguage(pref) {
  const normalized = normalizePreference(pref);
  return normalized === 'auto' ? browserLanguage() : normalized;
}

export function t(key, values) {
  const template = messages[current]?.[key] ?? messages['zh-CN']?.[key] ?? messages.en?.[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => String(values?.[name] ?? ''));
}

export function language() {
  return current;
}

export function preferenceValue() {
  return preference;
}

function htmlLang(value) {
  if (value === 'en') return 'en';
  if (value === 'zh-TW') return 'zh-TW';
  return 'zh-CN';
}

export function apply(scope) {
  const node = scope?.querySelectorAll ? scope : globalThis.document;
  if (!node?.querySelectorAll) return current;
  if (node.documentElement) node.documentElement.lang = htmlLang(current);
  node.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  node.querySelectorAll('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAria));
  });
  node.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.title = t(element.dataset.i18nTitle);
  });
  node.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  return current;
}

function emit() {
  listeners.forEach((listener) => {
    try { listener({ preference, language: current }); } catch {
      /* 单个界面失败不影响其他监听。 */
    }
  });
}

export function ready() {
  if (!readyPromise) {
    readyPromise = storageGet(KEY).then((stored) => {
      preference = normalizePreference(stored?.[KEY]);
      current = resolveLanguage(preference);
      return { preference, language: current };
    }).catch(() => ({ preference, language: current }));
  }
  return readyPromise;
}

export async function saveLanguage(value) {
  preference = normalizePreference(value);
  current = resolveLanguage(preference);
  await storageSet({ [KEY]: preference });
  emit();
  return { preference, language: current };
}

export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function themeLabel(id, fallback = '') {
  const key = id === 'default' ? 'themeDefault' : `theme-${id}`;
  const translated = t(key);
  return translated === key ? (fallback || id) : translated;
}

export function languagesHaveSameKeys() {
  const base = Object.keys(messages['zh-CN']);
  return ['zh-TW', 'en'].every((lang) => {
    const keys = Object.keys(messages[lang]);
    return keys.length === base.length && base.every((key) => Object.prototype.hasOwnProperty.call(messages[lang], key));
  });
}

extensionApi()?.storage?.onChanged?.addListener?.((changes, areaName) => {
  if (areaName !== 'local' || !changes?.[KEY]) return;
  const nextPreference = normalizePreference(changes[KEY].newValue);
  const nextLanguage = resolveLanguage(nextPreference);
  if (nextPreference === preference && nextLanguage === current) return;
  preference = nextPreference;
  current = nextLanguage;
  emit();
});
