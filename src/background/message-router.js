import { toErrorPayload } from '../shared/errors.js';

export function createMessageRouter(initialHandlers = {}) {
  const handlers = new Map(Object.entries(initialHandlers));

  function register(type, handler) {
    if (!type || typeof handler !== 'function') throw new Error('消息处理器需要 type 和 handler');
    if (handlers.has(type)) throw new Error(`消息处理器重复注册: ${type}`);
    handlers.set(type, handler);
    return () => handlers.delete(type);
  }

  function listener(message, sender, sendResponse) {
    const handler = handlers.get(message?.type);
    if (!handler) return false;
    try {
      const result = handler(message, sender);
      if (result && typeof result.then === 'function') {
        Promise.resolve(result)
          .then((value) => sendResponse(value ?? { ok: true }))
          .catch((error) => sendResponse({ ok: false, ...toErrorPayload(error) }));
        return true;
      }
      sendResponse(result ?? { ok: true });
    } catch (error) {
      sendResponse({ ok: false, ...toErrorPayload(error) });
    }
    return false;
  }

  return { register, listener };
}
