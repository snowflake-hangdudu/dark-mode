import { SCHEMA, normalizeSettings } from '../dark/model.js';

export function exportDocument(settings, now = new Date()) {
  return {
    schema: SCHEMA,
    exportedAt: now.toISOString(),
    settings: normalizeSettings(settings)
  };
}

export function settingsFromImport(text) {
  const parsed = JSON.parse(String(text || ''));
  const wrapped = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed.settings : null;
  const incoming = wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped) ? wrapped : parsed;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    throw new Error('导入内容不是设置');
  }
  return normalizeSettings(incoming);
}
