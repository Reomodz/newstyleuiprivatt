import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppThemeSettings, DEFAULT_THEME_SETTINGS, AccentColor } from '../types/theme';

const STORAGE_KEY = 'il2cpp_app_theme_settings';

export const ACCENT_COLOR_MAP: Record<AccentColor, { name: string; hex: string; rgb: string; border: string; bg: string }> = {
  indigo: {
    name: 'Indigo Pulse',
    hex: '#6366F1',
    rgb: '99, 102, 241',
    border: 'border-indigo-500',
    bg: 'bg-indigo-500',
  },
  cyan: {
    name: 'Neon Cyan',
    hex: '#06B6D4',
    rgb: '6, 182, 212',
    border: 'border-cyan-500',
    bg: 'bg-cyan-500',
  },
  emerald: {
    name: 'Matrix Emerald',
    hex: '#10B981',
    rgb: '16, 185, 129',
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
  },
  amber: {
    name: 'Cyber Amber',
    hex: '#F59E0B',
    rgb: '245, 158, 11',
    border: 'border-amber-500',
    bg: 'bg-amber-500',
  },
  crimson: {
    name: 'Crimson Red',
    hex: '#EF4444',
    rgb: '239, 68, 68',
    border: 'border-red-500',
    bg: 'bg-red-500',
  },
  violet: {
    name: 'Deep Violet',
    hex: '#8B5CF6',
    rgb: '139, 92, 246',
    border: 'border-violet-500',
    bg: 'bg-violet-500',
  },
};

export const PRESET_WALLPAPERS = [
  {
    id: 'abstract_mesh',
    name: 'Dark Mesh',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop',
  },
  {
    id: 'cyberpunk_neon',
    name: 'Cyber Horizon',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1920&auto=format&fit=crop',
  },
  {
    id: 'deep_space',
    name: 'Cosmic Nebula',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop',
  },
  {
    id: 'minimal_flow',
    name: 'Silk Aurora',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1920&auto=format&fit=crop',
  },
];

export function useAppSettings() {
  const [settings, setSettings] = useState<AppThemeSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_THEME_SETTINGS;
  });

  // Persist to localStorage
  const updateSettings = useCallback((partial: Partial<AppThemeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to save theme settings to localStorage:', err);
      }
      return next;
    });
  }, []);

  // Reset to default
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_THEME_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_THEME_SETTINGS));
    } catch {
      // fallback
    }
  }, []);

  const isAtmosphereActive = settings.enableAtmosphere ?? true;

  // Effective theme settings:
  // When Atmosphere & Wallpaper is OFF: hide wallpaper, default dimming: 90, blur: 25, opacity: 100
  // When Atmosphere & Wallpaper is ON: restore user's custom tuning automatically
  const effectiveSettings: AppThemeSettings = useMemo(() => {
    if (!isAtmosphereActive) {
      return {
        ...settings,
        bgDim: 90,
        bgBlur: 25,
        cardOpacity: 100,
        customBgImage: null,
      };
    }
    return settings;
  }, [settings, isAtmosphereActive]);

  // Update theme classes and CSS variables on :root
  useEffect(() => {
    const root = document.documentElement;

    // Theme mode class: Locked to Night mode as requested
    root.classList.remove('theme-day', 'theme-oled');
    root.classList.add('theme-night');

    // Accent color CSS variables
    const accent = ACCENT_COLOR_MAP[settings.accentColor] || ACCENT_COLOR_MAP.indigo;
    root.style.setProperty('--app-accent-hex', accent.hex);
    root.style.setProperty('--app-accent-rgb', accent.rgb);

    const isAtmosphereOn = settings.enableAtmosphere ?? true;
    const effectiveCardOpacity = isAtmosphereOn ? settings.cardOpacity : 100;
    const effectiveBlur = isAtmosphereOn ? settings.bgBlur : 25;
    const effectiveDim = isAtmosphereOn ? settings.bgDim : 90;

    // CSS variables for atmosphere, blur & card/panel display
    const opacityNorm = effectiveCardOpacity / 100;
    root.style.setProperty('--card-opacity', opacityNorm.toString());
    root.style.setProperty('--panel-opacity', Math.max(0.25, opacityNorm * 0.75).toFixed(3));
    root.style.setProperty('--group-opacity', Math.max(0.18, opacityNorm * 0.52).toFixed(3));
    root.style.setProperty('--subgroup-opacity', Math.max(0.10, opacityNorm * 0.35).toFixed(3));
    root.style.setProperty('--header-opacity', Math.max(0.35, opacityNorm * 0.88).toFixed(3));
    root.style.setProperty('--bg-blur', `${effectiveBlur}px`);
    root.style.setProperty('--glass-blur', `${Math.max(10, effectiveBlur)}px`);
    root.style.setProperty('--bg-dim', (effectiveDim / 100).toString());

    // Enable custom translucent class if atmosphere is ON and cardOpacity < 100 or custom background is set
    if (isAtmosphereOn && (settings.cardOpacity < 100 || settings.customBgImage)) {
      root.classList.add('custom-card-translucent');
    } else {
      root.classList.remove('custom-card-translucent');
    }

    // Toggle has-custom-bg class so wallpaper can show through in all theme modes
    if (isAtmosphereOn && settings.customBgImage) {
      root.classList.add('has-custom-bg');
    } else {
      root.classList.remove('has-custom-bg');
    }
  }, [settings]);

  // Image compressor helper for file upload
  const handleUploadImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    settings,
    effectiveSettings,
    updateSettings,
    resetToDefaults,
    handleUploadImage,
  };
}
