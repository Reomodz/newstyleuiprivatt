import React from 'react';
import { BookmarkPlus, Code2, Check } from 'lucide-react';
import { CodeStylePreset } from '../../types';
import { CODE_STYLE_PRESETS, getCodeTemplate } from '../../services/formatters';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  newProfileName: string;
  setNewProfileName: (val: string) => void;
  newProfileDesc: string;
  setNewProfileDesc: (val: string) => void;
  newProfileCodeStyle: CodeStylePreset;
  setNewProfileCodeStyle: (val: CodeStylePreset) => void;
  newProfileCustomTemplate: string;
  setNewProfileCustomTemplate: React.Dispatch<React.SetStateAction<string>>;
  handleCreateProfile: () => void;
}

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen, onClose, newProfileName, setNewProfileName, newProfileDesc, setNewProfileDesc,
  newProfileCodeStyle, setNewProfileCodeStyle, newProfileCustomTemplate, setNewProfileCustomTemplate,
  handleCreateProfile
}) => {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start sm:items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl p-3 sm:p-5 max-w-lg w-full shadow-2xl flex flex-col gap-2.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 mt-8 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[80dvh] sm:max-h-[85vh] overflow-y-auto overscroll-contain">
            <h3 className="text-sm sm:text-base font-semibold text-[#E2E2E4] flex items-center gap-2">
              <BookmarkPlus className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              <span>Create Profile</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-medium text-[#8E8E93] ml-1">Profile Name</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g. Combat & Weapon Offsets"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-medium text-[#8E8E93] ml-1">Description (Optional)</label>
              <input
                type="text"
                value={newProfileDesc}
                onChange={(e) => setNewProfileDesc(e.target.value)}
                placeholder="e.g. Target pointers for game v1.4"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Code Output Style Selection */}
            <div className="flex flex-col gap-2.5 pt-1 border-t border-[#2D2D30]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] sm:text-xs font-semibold text-[#E2E2E4] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                  <span>Code Style Output</span>
                </label>
                <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Default format for copy & export</span>
              </div>

              {/* Preset selection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CODE_STYLE_PRESETS.map((preset) => {
                  const isSelected = newProfileCodeStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setNewProfileCodeStyle(preset.id as CodeStylePreset)}
                      className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                          : 'bg-[#141416] border-[#353538] hover:border-[#4A4A50]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] sm:text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-[#E2E2E4]'}`}>
                          {preset.label}
                        </span>
                        {isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />}
                      </div>
                      <span className="text-[9px] sm:text-[11px] font-mono text-[#8E8E93] truncate">
                        {preset.template}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Template Editor */}
              {newProfileCodeStyle === 'custom' && (
                <div className="flex flex-col gap-2 p-2 sm:p-3 bg-[#141416] border border-indigo-500/30 rounded-xl sm:rounded-2xl animate-in fade-in duration-150 mt-1">
                  <label className="text-[9px] sm:text-[11px] font-medium text-indigo-300">Custom Template String</label>
                  <input
                    type="text"
                    value={newProfileCustomTemplate}
                    onChange={(e) => setNewProfileCustomTemplate(e.target.value)}
                    placeholder="e.g. constexpr uintptr_t {name} = {offset};"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Placeholders:</span>
                    {['{name}', '{offset}', '{class}', '{rva}', '{type}', '{comment}'].map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setNewProfileCustomTemplate((prev) => `${prev} ${token}`.trim())}
                        className="px-1.5 sm:px-2 py-0.5 rounded bg-[#242428] hover:bg-[#323236] border border-[#3E3E44] text-[9px] sm:text-[10px] font-mono text-indigo-300 transition-colors"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="p-2 sm:p-3 bg-[#141416] border border-[#2D2D30] rounded-lg sm:rounded-xl flex flex-col gap-1">
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#8E8E93]">
                  <span className="font-semibold uppercase tracking-wider">Preview</span>
                  <span className="font-mono">{newProfileCodeStyle}</span>
                </div>
                <div className="font-mono text-[10px] sm:text-xs text-amber-300 bg-[#1A1A1D] p-1.5 sm:p-2 rounded-md sm:rounded-lg border border-[#28282B] overflow-x-auto whitespace-pre">
                  {getCodeTemplate(newProfileCodeStyle, newProfileCustomTemplate)
                    .replace(/{name}/g, 'moveSpeed')
                    .replace(/{offset}/g, '0x28')
                    .replace(/{class}/g, 'PlayerController')
                    .replace(/{type}/g, 'float')
                    .replace(/{rva}/g, '0x1A2B3C')
                    .replace(/{comment}/g, 'Movement speed')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 sm:gap-3 mt-2">
              <button
                onClick={onClose}
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium text-[#8E8E93] hover:text-white bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProfile}
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
  );
};
