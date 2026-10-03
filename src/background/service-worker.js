import { debug } from '../shared/debug.js';
import { createMessageRouter } from './message-router.js';
import { registerBackgroundHandlers } from './app.js';


const router = createMessageRouter({
  PING: () => ({ ok: true, plugin: "dark-mode" })
});

registerBackgroundHandlers(router);

chrome.runtime.onInstalled.addListener(({ reason }) => {
  debug('installed', reason);
});

chrome.runtime.onMessage.addListener(router.listener);
