import { registerDarkMode } from './dark-mode.js';
import { registerRating } from './rating.js';
import { registerRemoteConfig } from './remote-config.js';

// 业务后台入口：此文件生成后不受公共模板同步管理。
export function registerBackgroundHandlers(router) {
  registerDarkMode(router);
  registerRemoteConfig(router);
  registerRating(router);
}
