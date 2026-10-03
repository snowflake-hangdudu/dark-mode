// Shared by document_start and immediate popup/background injection.
// Repeated injection must retain the engine and its existing observers.
if (!globalThis.__dmApplyDynamicTheme) {
  (() => {
    let signature = '';
    const engine = globalThis.DarkReader;
    const api = globalThis.browser ?? globalThis.chrome;
    engine.setFetchMethod(async (href) => {
      const url = new URL(href, location.href);
      if (!/^https?:$/.test(url.protocol)) throw new Error('Unsupported stylesheet URL');
      if (!api?.runtime?.id || url.origin === location.origin) return fetch(url.href, { credentials: 'omit' });
      const response = await new Promise((resolve, reject) => {
        api.runtime.sendMessage({ type: 'FETCH_STYLESHEET', href: url.href }, (reply) => {
          const error = api.runtime.lastError;
          if (error || !reply?.ok) reject(new Error(error?.message || reply?.message || 'Stylesheet fetch failed'));
          else resolve(reply);
        });
      });
      return new Response(response.bytes ? new Uint8Array(response.bytes) : response.text, {
        headers: { 'Content-Type': response.contentType || 'text/css' }
      });
    });
    globalThis.__dmApplyDynamicTheme = (payload) => {
      const active = payload?.active && payload.mode === 'theme' && payload.dynamicTheme;
      // The engine snapshots visibility when first injected (possibly in a
      // background tab). A later popup activation must not wait for another
      // visibility event when this document is already ready.
      const immediateModify = typeof document !== 'undefined' && document.readyState !== 'loading';
      const next = active ? JSON.stringify([payload.dynamicTheme, payload.keepMediaColors, immediateModify]) : '';
      if (next === signature) return;
      if (active) {
        engine.enable({ ...payload.dynamicTheme, immediateModify }, {
          // Preserve photographs, covers and sprites; no blanket image inversion.
          ignoreImageAnalysis: payload.keepMediaColors !== false ? ['*'] : [],
          ignoreInlineStyle: ['[data-dm-overlay]'],
          disableStyleSheetsProxy: true,
          disableCustomElementRegistryProxy: true,
          css: ''
        });
      } else {
        engine.disable();
      }
      signature = next;
    };
  })();
}
