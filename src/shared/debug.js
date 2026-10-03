import { debugEnabled } from './debug-flag.js';

export function debug(...args) {
  if (debugEnabled()) console.debug('[dark-mode]', ...args);
}
