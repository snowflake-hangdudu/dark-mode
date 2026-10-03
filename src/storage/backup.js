import { SCHEMA, normalizeSettings } from '../dark/model.js';

// Backup is a public, editable format: expose only controls still present in
// the UI. Internal compatibility defaults must not leak into exported JSON.
function visibleSettings(settings) {
  const normalized = normalizeSettings(settings);
  return {
    theme: normalized.theme,
    enabled: normalized.enabled,
    defaultMode: normalized.defaultMode,
    adjust: normalized.adjust,
    sites: Object.fromEntries(Object.entries(normalized.sites).map(([host, rule]) => [host, {
      mode: rule.mode,
      adjust: rule.adjust,
      includeSubdomains: rule.includeSubdomains
    }]))
  };
}

export function exportDocument(settings, now = new Date()) {
  return {
    schema: SCHEMA,
    exportedAt: now.toISOString(),
    settings: visibleSettings(settings)
  };
}

export function settingsFromImport(text) {
  const parsed = JSON.parse(String(text || ''));
  const wrapped = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed.settings : null;
  const incoming = wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped) ? wrapped : parsed;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    throw new Error('导入内容不是设置');
  }
  // Drop hidden legacy features before normalization. Returning the internal
  // defaults also clears old hidden values when the store merges this import.
  return normalizeSettings(visibleSettings(incoming));
}
