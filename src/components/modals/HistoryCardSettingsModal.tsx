import React from 'react';
import { Settings2, X, RotateCcw } from 'lucide-react';
import { HistoryCardViewSettings, DEFAULT_HISTORY_VIEW_SETTINGS } from '../../types';

interface HistoryCardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HistoryCardViewSettings;
  setConfig: React.Dispatch<React.SetStateAction<HistoryCardViewSettings>>;
  showToast: (msg: string) => void;
}

export const HistoryCardSettingsModal: React.FC<HistoryCardSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  showToast,
}) => {
  const updateConfig = (updates: Partial<HistoryCardViewSettings>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('il2cpp_history_view_settings', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-2.5 sm:p-4 flex justify-center items-start sm:items-center">
      <div className="bg-[#1C1C1F] border border-[#35353A] rounded-xl sm:rounded-3xl p-3 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-2.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 mt-8 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-[#2C2C30]">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="p-1.5 sm:p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg sm:rounded-xl">
              <Settings2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xs sm:text-base font-bold text-[#E2E2E4]">History Card Settings</h3>
              <p className="text-[9px] sm:text-xs text-[#8E8E93]">Customize scan log layout, density, and tags</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] rounded-md sm:rounded-lg transition-colors"
            title="Close settings"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Modal Content / Options List */}
        <div className="flex flex-col gap-2 sm:gap-3 overflow-y-auto pr-0.5">
          {/* Tablet & Desktop Layout Style (Hidden on Mobile, shown on Tablet & Desktop) */}
          <div className="hidden md:flex bg-[#141416] p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-[#27272A] flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-[#D8D8DC]">Card Layout</span>
              <span className="text-[9px] text-indigo-400 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                Tablet & Desktop Only
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                onClick={() => updateConfig({ tabletLayout: 'list' })}
                className={`py-1.5 px-2.5 sm:px-3 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${
                  (config.tabletLayout || 'list') === 'list'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                    : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                }`}
              >
                List View (Default)
              </button>
              <button
                onClick={() => updateConfig({ tabletLayout: 'grid' })}
                className={`py-1.5 px-2.5 sm:px-3 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${
                  config.tabletLayout === 'grid'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                    : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                }`}
              >
                Grid View (2 Cols)
              </button>
            </div>
          </div>

          {/* Density Segment */}
          <div className="bg-[#141416] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#27272A] flex flex-col gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs font-semibold text-[#D8D8DC]">Card Density & Spacing</span>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                onClick={() => updateConfig({ density: 'compact' })}
                className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${
                  (config.density || 'compact') === 'compact'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                    : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                }`}
              >
                Compact (Default)
              </button>
              <button
                onClick={() => updateConfig({ density: 'comfortable' })}
                className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${
                  config.density === 'comfortable'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                    : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                }`}
              >
                Comfortable
              </button>
            </div>
          </div>

          {/* Toggle Options Grid */}
          <div className="flex flex-col gap-1 sm:gap-2 bg-[#141416] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#27272A]">
            <span className="text-[10px] sm:text-xs font-semibold text-[#D8D8DC] mb-0.5 sm:mb-1">Display & Tag Visibility</span>

            {/* Show Scan Metadata */}
            <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer">
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Scan Metadata</span>
                <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Source mode, resolved count, and scan timestamp</span>
              </div>
              <input
                type="checkbox"
                checked={config.showMetadata}
                onChange={(e) => updateConfig({ showMetadata: e.target.checked })}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
              />
            </label>

            {/* Show Offset / RVA Preview Tags */}
            <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Offset & RVA Tags</span>
                <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Preview individual resolved offset hex tags</span>
              </div>
              <input
                type="checkbox"
                checked={config.showOffsetTags}
                onChange={(e) => updateConfig({ showOffsetTags: e.target.checked })}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
              />
            </label>

            {/* Show Code Style Preset Badge */}
            <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Code Style Badge</span>
                <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display C++, C#, Cheat Engine preset label</span>
              </div>
              <input
                type="checkbox"
                checked={config.showCodeStyleBadge}
                onChange={(e) => updateConfig({ showCodeStyleBadge: e.target.checked })}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
              />
            </label>

            {/* Show Quick Action Buttons */}
            <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
              <div className="flex flex-col">
                <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Quick Action Buttons</span>
                <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Direct copy, download, and delete icons on cards</span>
              </div>
              <input
                type="checkbox"
                checked={config.showQuickActions}
                onChange={(e) => updateConfig({ showQuickActions: e.target.checked })}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-[#2C2C30]">
          <button
            onClick={() => {
              setConfig(DEFAULT_HISTORY_VIEW_SETTINGS);
              try {
                localStorage.setItem('il2cpp_history_view_settings', JSON.stringify(DEFAULT_HISTORY_VIEW_SETTINGS));
              } catch {}
              showToast('Reset history card settings to default');
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#8E8E93] hover:text-white hover:bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
            title="Reset all settings to default"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
