export function createSettingsStore({ key, defaults = {}, normalize = (value) => value }) {
  if (!key) throw new Error('设置存储必须提供独立 key');
  const browserAPI = globalThis.browser ?? globalThis.chrome;
  const storage = browserAPI?.storage?.local;
  if (!storage) throw new Error('当前扩展环境不支持本地设置存储');
  let writeQueue = Promise.resolve();

  function normalizeValue(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return normalize({ ...defaults, ...source });
  }

  async function load() {
    const data = await storage.get(key);
    return normalizeValue(data[key]);
  }

  async function save(patch) {
    const operation = writeQueue.then(async () => {
      const next = normalizeValue({ ...(await load()), ...(patch || {}) });
      await storage.set({ [key]: next });
      return next;
    });
    writeQueue = operation.catch(() => {});
    return operation;
  }

  async function clear() {
    const operation = writeQueue.then(async () => {
      await storage.remove(key);
      return normalizeValue({});
    });
    writeQueue = operation.catch(() => {});
    return operation;
  }

  return { key, defaults, normalize: normalizeValue, load, save, clear };
}
