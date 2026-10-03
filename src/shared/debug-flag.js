export const SHOW_DEBUG = false; // @pack:debug

export function debugEnabled() {
  if (SHOW_DEBUG === false) return false;
  try {
    const browserAPI = globalThis.browser ?? globalThis.chrome;
    if (browserAPI.runtime.getManifest()?.update_url) return false;
  } catch {
    return false;
  }
  return true;
}
