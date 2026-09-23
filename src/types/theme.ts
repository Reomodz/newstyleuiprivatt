export type ThemeMode = 'night' | 'day' | 'oled';

export type AccentColor = 'indigo' | 'cyan' | 'emerald' | 'amber' | 'crimson' | 'violet';

export interface AppThemeSettings {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  customBgImage: string | null;
  bgDim: number; // 0 to 90
  bgBlur: number; // 0 to 25 (px)
  cardOpacity: number; // 50 to 100 (%)
  enableAtmosphere?: boolean; // Master switch for Wallpaper & Atmosphere Tuning
}

export const DEFAULT_THEME_SETTINGS: AppThemeSettings = {
  themeMode: 'night',
  accentColor: 'indigo',
  customBgImage: null,
  bgDim: 40,
  bgBlur: 6,
  cardOpacity: 92,
  enableAtmosphere: true,
};
