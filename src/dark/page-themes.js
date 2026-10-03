import themeData from '../ui/themes/themes-ambient-full.json' with { type: 'json' };

export const THEME_IDS = Object.freeze(themeData.themes.map((theme) => theme.id));

export function pageThemeById(id) {
  return themeData.themes.find((theme) => theme.id === id)
    || themeData.themes.find((theme) => theme.id === 'obsidian')
    || null;
}
