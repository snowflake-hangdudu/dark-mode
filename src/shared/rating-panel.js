import { onLanguageChange, ready, t } from './i18n.js';

export function initializeRatingPrompt(root) {
  if (!root) return;
  const api = globalThis.browser ?? globalThis.chrome;
  let prompt = null;

  function button(action, label, className) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    node.textContent = label;
    node.addEventListener('click', async () => {
      root.hidden = true;
      try {
        const result = await api.runtime.sendMessage({ type: 'DARK_MODE_RATING_ACTION', action });
        if (action === 'rate' && /^https:\/\//i.test(result?.url || '')) api.tabs.create({ url: result.url });
      } catch { /* 评分入口失败时不影响深色模式。 */ }
      prompt = null;
    });
    return node;
  }

  function render() {
    root.replaceChildren();
    if (!prompt) {
      root.hidden = true;
      return;
    }
    const title = document.createElement('p');
    title.className = 'dm-rating-title';
    title.textContent = t('ratingTitle');
    const text = document.createElement('p');
    text.className = 'dm-rating-text';
    text.textContent = t('ratingText', { count: prompt.count, store: prompt.store });
    const actions = document.createElement('div');
    actions.className = 'dm-rating-actions';
    actions.append(
      button('later', t('ratingLater'), 'btu-btn btu-btn--secondary'),
      button('never', t('ratingNever'), 'btu-btn btu-btn--secondary')
    );
    root.append(title, text, button('rate', t('ratingGo', { store: prompt.store }), 'btu-btn'), actions);
    root.hidden = false;
  }

  async function refresh() {
    try {
      const result = await api.runtime.sendMessage({ type: 'DARK_MODE_RATING_STATUS' });
      prompt = result?.ok ? result.prompt : null;
    } catch {
      prompt = null;
    }
    render();
  }

  onLanguageChange(() => render());
  ready().then(refresh).catch(() => {});
}
