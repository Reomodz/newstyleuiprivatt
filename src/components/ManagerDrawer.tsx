import React, { useState, useRef } from 'react';
import {
  Palette,
  Upload,
  Image as ImageIcon,
  Sliders,
  RotateCcw,
  X,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { AppThemeSettings, AccentColor } from '../types/theme';
import { ACCENT_COLOR_MAP, PRESET_WALLPAPERS } from '../hooks/useAppSettings';

interface ManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppThemeSettings;
  updateSettings: (partial: Partial<AppThemeSettings>) => void;
  resetToDefaults: () => void;
  handleUploadImage: (file: File) => Promise<string>;
  showToast?: (msg: string) => void;
}

export const ManagerDrawer: React.FC<ManagerDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  updateSettings,
  resetToDefaults,
  handleUploadImage,
  showToast,
}) => {
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const dataUrl = await handleUploadImage(file);
      updateSettings({ customBgImage: dataUrl });
      showToast?.('Custom wallpaper applied');
    } catch {
      showToast?.('Failed to process image file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    updateSettings({ customBgImage: trimmed });
    setImageUrlInput('');
    showToast?.('Custom wallpaper applied from URL');
  };

  const handleRemoveWallpaper = () => {
    updateSettings({ customBgImage: null });
    showToast?.('Custom wallpaper removed');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Invisible non-blocking backdrop so background & app remain 100% visible and interactive click closes */}
      <div
        className="absolute inset-0 pointer-events-auto bg-transparent transition-opacity"
        onClick={onClose}
      />

      {/* Floating Translucent Customizer Panel: directly shows the wallpaper behind it */}
      <div
        className="pointer-events-auto w-[90vw] sm:w-[350px] border-l border-white/10 h-full flex flex-col justify-between text-[#E2E2E4] shadow-2xl transition-all duration-200 relative z-10 overflow-hidden"
        style={{
          backgroundColor: settings.customBgImage
            ? `rgba(20, 20, 24, ${Math.max(0.35, (settings.cardOpacity / 100) * 0.65)})`
            : 'rgba(22, 22, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Dynamic Accent Left Line */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[2.5px] transition-all z-20"
          style={{
            background: 'linear-gradient(180deg, var(--app-accent-hex), rgba(var(--app-accent-rgb), 0.35))',
            boxShadow: '0 0 10px rgba(var(--app-accent-rgb), 0.6)',
          }}
        />

        {/* Compact Header */}
        <div
          className="flex items-center justify-between px-3.5 py-3 border-b border-white/10 shrink-0"
          style={{
            backgroundColor: settings.customBgImage ? 'rgba(20, 20, 24, 0.4)' : 'rgba(18, 18, 20, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: 'rgba(var(--app-accent-rgb), 0.15)',
                border: '1px solid rgba(var(--app-accent-rgb), 0.35)',
                color: 'var(--app-accent-hex)',
              }}
            >
              <Palette className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-bold text-xs sm:text-sm text-white leading-none">Appearance & Theme</h2>
              <span className="text-[10px] text-[#8E8E93]">Live real-time preview</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Scrollable Settings Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4">
          {/* SECTION 1: ACCENT COLOR (App-wide) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A5] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" style={{ color: 'var(--app-accent-hex)' }} />
                <span>Accent Color</span>
              </label>
              <span className="text-[10px] font-bold" style={{ color: 'var(--app-accent-hex)' }}>
                {ACCENT_COLOR_MAP[settings.accentColor]?.name}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5 bg-black/25 border border-white/10 p-1.5 rounded-xl backdrop-blur-md">
              {(Object.keys(ACCENT_COLOR_MAP) as AccentColor[]).map((key) => {
                const item = ACCENT_COLOR_MAP[key];
                const isSelected = settings.accentColor === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateSettings({ accentColor: key })}
                    className="group relative flex items-center justify-center p-0.5 rounded-lg transition-transform hover:scale-110 active:scale-95"
                    title={item.name}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#121214] shadow-md scale-105' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: item.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white drop-shadow-md stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: BACKGROUND WALLPAPER */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A5] flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span>Background Wallpaper</span>
              </label>
              {settings.customBgImage && (
                <button
                  onClick={handleRemoveWallpaper}
                  className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Active Wallpaper Thumbnail Badge */}
            {settings.customBgImage && (
              <div className="flex items-center justify-between p-1.5 bg-black/25 border border-white/10 rounded-xl gap-2 backdrop-blur-md">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={settings.customBgImage}
                    alt="Active Wallpaper"
                    className="w-10 h-7 rounded-lg object-cover shrink-0 border border-white/20"
                  />
                  <div className="text-[10px] truncate text-[#A0A0A5]">Custom Wallpaper Active</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-medium transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Upload or Preset Grid */}
            <div className="space-y-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-[#E2E2E4] hover:text-white border border-white/10 rounded-xl text-[11px] font-semibold transition-all active:scale-[0.99] shadow-sm backdrop-blur-md"
              >
                <Upload className="w-3 h-3" style={{ color: 'var(--app-accent-hex)' }} />
                <span>{isUploading ? 'Compressing Image...' : 'Upload Image from Device'}</span>
              </button>

              {/* Paste URL */}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Or paste image URL..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
                  className="flex-1 px-2.5 py-1 bg-black/25 border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-[#E2E2E4] placeholder-[#6C6C70] focus:outline-none transition-colors backdrop-blur-md"
                />
                <button
                  onClick={handleApplyUrl}
                  disabled={!imageUrlInput.trim()}
                  className="px-2.5 py-1 text-white text-xs font-semibold rounded-xl border border-white/10 transition-colors shrink-0 disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--app-accent-hex)',
                  }}
                >
                  Apply
                </button>
              </div>

              {/* Curated Wallpaper Presets */}
              <div className="pt-0.5">
                <span className="text-[10px] text-[#8E8E93] font-medium block mb-1">Curated Themes</span>
                <div className="grid grid-cols-4 gap-1">
                  {PRESET_WALLPAPERS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => updateSettings({ customBgImage: preset.url })}
                      className="group relative rounded-lg overflow-hidden border border-white/10 hover:border-indigo-500 aspect-video transition-all active:scale-95"
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      {settings.customBgImage === preset.url && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(var(--app-accent-rgb), 0.5)' }}
                        >
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: CUSTOMIZER SLIDERS */}
          <div className="space-y-2.5 pt-1 border-t border-white/10">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A5] flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-sky-400" />
              <span>Display & Atmosphere Tuning</span>
            </label>

            {/* Slider 1: Dim */}
            <div className="space-y-1 bg-black/25 border border-white/10 p-2 rounded-xl backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C7C7CC] font-medium text-[11px]">Background Dimming</span>
                <span className="font-mono font-bold text-xs" style={{ color: 'var(--app-accent-hex)' }}>
                  {settings.bgDim}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={settings.bgDim}
                onChange={(e) => updateSettings({ bgDim: Number(e.target.value) })}
                className="w-full h-1.5 bg-[#252528] rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--app-accent-hex)' }}
              />
              <span className="text-[9.5px] text-[#8E8E93] block">
                Dark ambient dimming to enhance text readability
              </span>
            </div>

            {/* Slider 2: Blur */}
            <div className="space-y-1 bg-black/25 border border-white/10 p-2 rounded-xl backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C7C7CC] font-medium text-[11px]">Background Blur</span>
                <span className="font-mono text-sky-400 font-bold text-xs">{settings.bgBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={settings.bgBlur}
                onChange={(e) => updateSettings({ bgBlur: Number(e.target.value) })}
                className="w-full h-1.5 bg-[#252528] rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <span className="text-[9.5px] text-[#8E8E93] block">
                Soft neutral diffusion without white fogging
              </span>
            </div>

            {/* Slider 3: Card Opacity (Glassmorphism) */}
            <div className="space-y-1 bg-black/25 border border-white/10 p-2 rounded-xl backdrop-blur-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#C7C7CC] font-medium text-[11px]">Card & Panel Opacity</span>
                <span className="font-mono text-emerald-400 font-bold text-xs">{settings.cardOpacity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="2"
                value={settings.cardOpacity}
                onChange={(e) => updateSettings({ cardOpacity: Number(e.target.value) })}
                className="w-full h-1.5 bg-[#252528] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[9.5px] text-[#8E8E93] block">
                {settings.cardOpacity === 100
                  ? 'Solid opaque containers'
                  : 'Frosted glassmorphism over wallpaper'}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Bottom Actions */}
        <div
          className="px-3.5 py-2.5 border-t border-white/10 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: settings.customBgImage ? 'rgba(20, 20, 24, 0.45)' : 'rgba(18, 18, 20, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <button
            onClick={() => {
              resetToDefaults();
              showToast?.('Appearance reset to default');
            }}
            className="flex items-center gap-1 text-[11px] text-[#8E8E93] hover:text-[#E2E2E4] px-2 py-1 rounded-lg hover:bg-white/10 transition-colors font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1 text-white rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95"
            style={{
              backgroundColor: 'var(--app-accent-hex)',
              boxShadow: '0 2px 10px rgba(var(--app-accent-rgb), 0.35)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

