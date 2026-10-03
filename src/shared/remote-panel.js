import { language, onLanguageChange, ready } from './i18n.js';

const labels = {
  'zh-CN': { notice: '公告', coop: '开发合作', known: '使用说明', upcoming: '即将更新', planned: '计划中' },
  'zh-TW': { notice: '公告', coop: '開發合作', known: '使用說明', upcoming: '即將更新', planned: '計劃中' },
  en: { notice: 'Notices', coop: 'Development Partnerships', known: 'Usage notes', upcoming: 'Coming soon', planned: 'Planned' }
};

export function versionSupported(current, minimum) {
  const left = String(current).split('.').map(Number);
  const right = String(minimum || '0').split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if ((left[i] || 0) !== (right[i] || 0)) return (left[i] || 0) > (right[i] || 0);
  }
  return true;
}

export function renderRemotePanel(root, config, currentVersion, lang = 'zh-CN') {
  root.replaceChildren();
  root.hidden = true;
  if (!config?.enabled || !versionSupported(currentVersion, config.minExtensionVersion)) return;
  const copy = labels[lang] || labels['zh-CN'];
  function section(title) {
    const details = document.createElement('details');
    details.className = 'dm-remote-section';
    const summary = document.createElement('summary');
    summary.textContent = title;
    details.append(summary);
    root.append(details);
    return details;
  }
  function list(parent, values, title = '') {
    if (!values?.length) return;
    if (title) {
      const heading = document.createElement('strong');
      heading.textContent = title;
      parent.append(heading);
    }
    const ul = document.createElement('ul');
    for (const value of values) {
      const li = document.createElement('li');
      li.textContent = value;
      ul.append(li);
    }
    parent.append(ul);
  }
  if (config.notice?.enabled) {
    const notice = config.notice;
    const details = section(notice.title || copy.notice);
    if (notice.updated) {
      const date = document.createElement('small');
      date.textContent = notice.updated;
      details.append(date);
    }
    list(details, notice.pinned);
    list(details, notice.recent);
    list(details, notice.knownIssues, copy.known);
    list(details, notice.roadmap?.upcoming, copy.upcoming);
    list(details, notice.roadmap?.planned, copy.planned);
    list(details, notice.roadmap?.feedback);
  }
  if (config.coop?.enabled && config.coop.body) {
    const details = section(config.coop.title || copy.coop);
    const body = document.createElement('p');
    body.textContent = config.coop.body;
    details.append(body);
  }
  root.hidden = !root.childElementCount;
}

export function initializeRemotePanel(root) {
  if (!root) return;
  const api = globalThis.browser ?? globalThis.chrome;
  let revision = 0;
  async function update() {
    const current = ++revision;
    try {
      const lang = language();
      const result = await api.runtime.sendMessage({ type: 'DARK_MODE_REMOTE_CONFIG', language: lang === 'en' ? 'en' : 'zh' });
      if (current === revision && result?.ok) renderRemotePanel(root, result.config, api.runtime.getManifest().version, lang);
    } catch { /* 配置站不可达时不影响本地设置。 */ }
  }
  onLanguageChange(() => { root.hidden = true; update(); });
  ready().then(update).catch(() => {});
}
