const MAX_BYTES = 2 * 1024 * 1024;

function stylesheetUrl(href) {
  const url = new URL(href);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error('Unsupported stylesheet URL');
  const host = url.hostname;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host.includes(':') || /^\d+(\.\d+){3}$/.test(host) || !host.includes('.')) {
    throw new Error('Local network stylesheet requests are not allowed');
  }
  return url;
}

export async function fetchStylesheet(message, sender) {
  if (!sender?.tab || !/^https?:/.test(sender.url || sender.tab.url || '')) throw new Error('Page sender required');
  let url = stylesheetUrl(message?.href);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    for (let redirect = 0; redirect < 5; redirect += 1) {
      const response = await fetch(url.href, { credentials: 'omit', redirect: 'manual', signal: controller.signal });
      if (response.status >= 300 && response.status < 400) {
        url = stylesheetUrl(new URL(response.headers.get('location'), url).href);
        continue;
      }
      if (!response.ok) throw new Error(`Stylesheet HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') || '';
      const image = /^image\/(png|jpeg|webp|gif|avif|svg\+xml)(?:;|$)/i.test(contentType);
      if (!image && !/^(text\/css|text\/plain|application\/octet-stream)(?:;|$)/i.test(contentType)) {
        throw new Error('Expected a stylesheet response');
      }
      if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Stylesheet too large');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let bytes = 0;
      let text = '';
      const chunks = [];
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > MAX_BYTES) throw new Error('Stylesheet too large');
          if (image) chunks.push(chunk.value);
          else text += decoder.decode(chunk.value, { stream: true });
        }
        text += decoder.decode();
      } finally {
        await reader.cancel().catch(() => {});
      }
      if (image) {
        const data = new Uint8Array(bytes);
        let offset = 0;
        for (const chunk of chunks) {
          data.set(chunk, offset);
          offset += chunk.byteLength;
        }
        return { ok: true, bytes: Array.from(data), contentType };
      }
      return { ok: true, text, contentType };
    }
    throw new Error('Too many stylesheet redirects');
  } finally {
    clearTimeout(timer);
  }
}
