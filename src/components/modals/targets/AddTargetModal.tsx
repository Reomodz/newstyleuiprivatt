import React from 'react';
import { Plus, X, Sparkles, EyeOff, Eye, ChevronDown, Target, Sliders, Hash } from 'lucide-react';
import { WatchlistProfile } from '../../../types';

interface AddTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: WatchlistProfile | undefined;
  newTargetKind: 'FIELD' | 'METHOD';
  setNewTargetKind: (kind: 'FIELD' | 'METHOD') => void;
  newTargetCustomName: string;
  setNewTargetCustomName: (val: string) => void;
  newTargetIsCustom?: boolean;
  setNewTargetIsCustom?: (val: boolean) => void;
  newTargetDefaultOffset?: string;
  setNewTargetDefaultOffset?: (val: string) => void;
  newTargetGroupName?: string;
  setNewTargetGroupName?: (val: string) => void;
  newTargetSubGroupName?: string;
  setNewTargetSubGroupName?: (val: string) => void;
  availableGroups?: string[];
  availableSubGroups?: string[];
  newTargetAssemblyName: string;
  setNewTargetAssemblyName: (val: string) => void;
  newTargetClassName: string;
  setNewTargetClassName: (val: string) => void;
  newTargetMemberName: string;
  setNewTargetMemberName: (val: string) => void;
  newTargetComment: string;
  setNewTargetComment: (val: string) => void;
  showAddFallbacks: boolean;
  setShowAddFallbacks: (val: boolean) => void;
  tempFallbackClassInput: string;
  setTempFallbackClassInput: (val: string) => void;
  tempFallbackMemberInput: string;
  setTempFallbackMemberInput: (val: string) => void;
  newTargetFallbackClasses: string[];
  setNewTargetFallbackClasses: (val: string[]) => void;
  newTargetFallbackMembers: string[];
  setNewTargetFallbackMembers: (val: string[]) => void;
  handleAddTarget: () => void;
}

export const AddTargetModal: React.FC<AddTargetModalProps> = ({
  isOpen, onClose, activeProfile, newTargetKind, setNewTargetKind,
  newTargetCustomName, setNewTargetCustomName,
  newTargetIsCustom = false, setNewTargetIsCustom,
  newTargetDefaultOffset = '', setNewTargetDefaultOffset,
  newTargetAssemblyName, setNewTargetAssemblyName,
  newTargetClassName, setNewTargetClassName,
  newTargetMemberName, setNewTargetMemberName, newTargetComment, setNewTargetComment,
  showAddFallbacks, setShowAddFallbacks, tempFallbackClassInput, setTempFallbackClassInput,
  tempFallbackMemberInput, setTempFallbackMemberInput, newTargetFallbackClasses, setNewTargetFallbackClasses,
  newTargetFallbackMembers, setNewTargetFallbackMembers, handleAddTarget
}) => {
  if (!isOpen) return null;

  const isFormValid = newTargetIsCustom
    ? Boolean(newTargetCustomName.trim() && newTargetDefaultOffset.trim())
    : Boolean(newTargetClassName.trim() && newTargetMemberName.trim());

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-2 sm:p-3 flex justify-center items-center">
      <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[82vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-3 sm:p-4 border-b border-[#2D2D30] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#E2E2E4] truncate">Add Target</h3>
                <span className={`text-[8.5px] sm:text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                  newTargetIsCustom
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-[#222226] text-[#A0A0A5] border-[#353538]'
                }`}>
                  {newTargetIsCustom ? 'Direct Offset' : 'IL2CPP Scan'}
                </span>
              </div>
              <p className="text-[10px] text-[#8E8E93] truncate">
                Profile: <span className="text-indigo-300 font-semibold">{activeProfile?.name || 'Active'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Logo on top left side of X close button to toggle Direct Offset mode with one click */}
            <button
              type="button"
              id="btn-toggle-direct-offset-header"
              onClick={() => setNewTargetIsCustom?.(!newTargetIsCustom)}
              title={newTargetIsCustom ? "Direct Offset Mode Active (Click to switch to Standard Scan)" : "Switch to Direct Offset Mode"}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all ${
                newTargetIsCustom
                  ? 'bg-indigo-600/25 text-indigo-300 border-indigo-500/50 shadow-sm'
                  : 'bg-[#262629] hover:bg-[#323236] text-[#A0A0A5] hover:text-white border-[#353538]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>{newTargetIsCustom ? 'Direct Mode' : 'Direct Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => onClose()}
              className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-2.5 sm:p-3.5 flex-1 overflow-y-auto space-y-2.5 sm:space-y-3 overscroll-contain pr-1.5">
          {newTargetIsCustom ? (
            /* DIRECT OFFSET MODE: Assembly, Namespace, Class, Member & Fallbacks are hidden */
            <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
              {/* Custom Target Name (Required in direct mode) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] sm:text-[10px] font-medium text-[#E2E2E4] ml-0.5 flex items-center justify-between">
                  <span>Custom Target Name <span className="text-red-400">*</span></span>
                  <span className="text-[8px] sm:text-[9px] text-indigo-300 font-normal">Primary Identifier</span>
                </label>
                <input
                  type="text"
                  value={newTargetCustomName}
                  onChange={(e) => setNewTargetCustomName(e.target.value)}
                  placeholder="e.g. Player GodMode, Gold Base Offset, CameraFOV"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#141416] border border-[#353538] focus:border-indigo-500 rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none font-mono placeholder:text-[#55555A]"
                  autoFocus
                />
              </div>

              {/* Default Offset Field */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] sm:text-[10px] font-medium text-[#E2E2E4] ml-0.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-emerald-400" />
                    <span>Default Offset (Hex) <span className="text-red-400">*</span></span>
                  </span>
                  <span className="text-[8.5px] sm:text-[9px] text-[#8E8E93] font-mono">
                    {newTargetKind === 'FIELD' ? 'Memory Offset' : 'Method RVA'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newTargetDefaultOffset}
                    onChange={(e) => setNewTargetDefaultOffset?.(e.target.value)}
                    placeholder="e.g. 0x48, 0x1A2B00, or 0x0"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#141416] border border-[#353538] focus:border-emerald-500 rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-emerald-300 focus:outline-none font-mono placeholder:text-[#55555A]"
                  />
                </div>
                {/* Quick Helper Chips */}
                <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                  <span className="text-[8px] sm:text-[9px] text-[#71717A] mr-1">Quick presets:</span>
                  {['0x0', '0x10', '0x18', '0x20', '0x48', '0x5C', '0x100'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewTargetDefaultOffset?.(preset)}
                      className="px-1.5 py-0.5 bg-[#202024] hover:bg-[#2A2A30] text-[#A0A0A8] hover:text-emerald-300 border border-[#323236] rounded text-[8px] sm:text-[9px] font-mono transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment in direct mode */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] sm:text-[10px] font-medium text-[#8E8E93] ml-0.5">Comment / Notes (Optional)</label>
                <input
                  type="text"
                  value={newTargetComment}
                  onChange={(e) => setNewTargetComment(e.target.value)}
                  placeholder="e.g. Base pointer offset"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#141416] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ) : (
            /* STANDARD METADATA SCANNING MODE */
            <div className="space-y-2.5 sm:space-y-3 animate-in fade-in duration-200">
              {/* Target Type Selector in Main Add Target UI */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] sm:text-[10px] font-medium text-[#8E8E93] ml-0.5">Target Type</label>
                <div className="flex items-center gap-2 p-1 bg-[#141416] border border-[#353538] rounded-lg sm:rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewTargetKind('FIELD')}
                    className={`flex-1 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-bold transition-all ${
                      newTargetKind === 'FIELD'
                        ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                        : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    Field (Offset)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTargetKind('METHOD')}
                    className={`flex-1 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-bold transition-all ${
                      newTargetKind === 'METHOD'
                        ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                        : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    Method (RVA)
                  </button>
                </div>
              </div>

              {/* Custom Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] sm:text-[10px] font-medium text-[#8E8E93] ml-0.5">
                  Custom Name / Display Label (Optional)
                </label>
                <input
                  type="text"
                  value={newTargetCustomName}
                  onChange={(e) => setNewTargetCustomName(e.target.value)}
                  placeholder="e.g. PlayerSpeed"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#141416] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono placeholder:text-[#55555A]"
                />
              </div>

              {/* Assembly / DLL Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] sm:text-[10px] font-medium text-[#8E8E93] ml-0.5">
                  Assembly / DLL (.dll) (Optional)
                </label>
                <input
                  type="text"
                  value={newTargetAssemblyName}
                  onChange={(e) => setNewTargetAssemblyName(e.target.value)}
                  placeholder="e.g. Assembly-CSharp.dll"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#141416] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono placeholder:text-[#55555A]"
                />
              </div>

              {/* Combined Class Name Field */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between ml-0.5">
                  <label className="text-[9px] sm:text-[10px] font-medium text-[#8E8E93]">
                    Target Namespace & Class
                  </label>
                </div>
                <input
                  type="text"
                  value={newTargetClassName}
                  onChange={(e) => setNewTargetClassName(e.target.value)}
                  placeholder="e.g. COW.GamePlay::CameraControllerBase or CameraControllerBase"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#141416] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono placeholder:text-[#55555A]"
                />
                <span className="text-[8.5px] sm:text-[9px] text-[#71717A] ml-0.5 font-mono">
                  Format: <span className="text-indigo-300">Namespace::ClassName</span> (e.g. <span className="text-amber-300">COW.GamePlay::Player</span>) or just <span className="text-indigo-300">ClassName</span> if no namespace.
                </span>
              </div>

              {/* Member Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] sm:text-[10px] font-medium text-[#8E8E93] ml-0.5">
                  {newTargetKind === 'FIELD' ? 'Field Name' : 'Method Name'}
                </label>
                <input
                  type="text"
                  value={newTargetMemberName}
                  onChange={(e) => setNewTargetMemberName(e.target.value)}
                  placeholder={newTargetKind === 'FIELD' ? 'e.g. moveSpeed' : 'e.g. Update'}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#141416] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] sm:text-[10px] font-medium text-[#8E8E93] ml-0.5">Comment (Optional)</label>
                <input
                  type="text"
                  value={newTargetComment}
                  onChange={(e) => setNewTargetComment(e.target.value)}
                  placeholder="e.g. Movement multiplier"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#141416] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Fallbacks Configuration (Collapsible) */}
              <div className="bg-[#141416] rounded-lg sm:rounded-xl border border-[#353538] overflow-hidden">
                <button
                  id="btn-toggle-add-fallbacks"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAddFallbacks(!showAddFallbacks);
                  }}
                  className="w-full p-2 sm:p-2.5 flex items-center justify-between hover:bg-[#1A1A1E] active:bg-[#18181B] transition-colors cursor-pointer select-none"
                  aria-expanded={showAddFallbacks}
                >
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-semibold text-amber-400">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Fallback Names (Optional)</span>
                    {(newTargetFallbackClasses.length > 0 || newTargetFallbackMembers.length > 0) && (
                      <span className="text-[8px] sm:text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-mono">
                        {newTargetFallbackClasses.length + newTargetFallbackMembers.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md sm:rounded-lg bg-[#202024] hover:bg-[#2A2A30] border border-[#3A3A42] text-[8px] sm:text-[10px] font-medium text-[#D0D0D5] transition-colors shadow-sm">
                    {showAddFallbacks ? (
                      <>
                        <EyeOff className="w-2.5 h-2.5 text-amber-400" />
                        <span className="text-amber-300 font-semibold">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-2.5 h-2.5 text-indigo-400" />
                        <span className="text-[#E2E2E4] font-semibold">Show</span>
                      </>
                    )}
                    <ChevronDown
                      className={`w-2.5 h-2.5 transition-transform duration-200 ${
                        showAddFallbacks ? 'rotate-180 text-amber-400' : 'text-[#8E8E93]'
                      }`}
                    />
                  </div>
                </button>

                {showAddFallbacks && (
                  <div className="p-2 sm:p-2.5 pt-0 border-t border-[#262629] flex flex-col gap-2 mt-1.5 max-h-48 overflow-y-auto overscroll-contain">
                    <p className="text-[8px] sm:text-[10px] text-[#8E8E93] leading-relaxed">
                      If the primary name is missing after game updates, the scanner will automatically try these fallbacks.
                    </p>

                    {/* Fallback Class Names List */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] sm:text-[10px] font-medium text-[#8E8E93]">
                        Fallback Class Names
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempFallbackClassInput}
                          onChange={(e) => setTempFallbackClassInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tempFallbackClassInput.trim()) {
                              e.preventDefault();
                              if (!newTargetFallbackClasses.includes(tempFallbackClassInput.trim())) {
                                setNewTargetFallbackClasses([...newTargetFallbackClasses, tempFallbackClassInput.trim()]);
                              }
                              setTempFallbackClassInput('');
                            }
                          }}
                          placeholder="e.g. COW.GamePlay::CameraController"
                          className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#353538] rounded-md text-[9px] sm:text-[11px] text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (tempFallbackClassInput.trim()) {
                              if (!newTargetFallbackClasses.includes(tempFallbackClassInput.trim())) {
                                setNewTargetFallbackClasses([...newTargetFallbackClasses, tempFallbackClassInput.trim()]);
                              }
                              setTempFallbackClassInput('');
                            }
                          }}
                          className="p-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-md border border-indigo-500/40 transition-colors"
                          title="Add Fallback Class"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {newTargetFallbackClasses.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {newTargetFallbackClasses.map((cls, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[10px] font-mono text-sky-300"
                            >
                              {cls}
                              <button
                                type="button"
                                onClick={() => setNewTargetFallbackClasses(newTargetFallbackClasses.filter((_, i) => i !== idx))}
                                className="text-[#8E8E93] hover:text-red-400 p-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fallback Member Names List */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] sm:text-[10px] font-medium text-[#8E8E93]">
                        Fallback {newTargetKind === 'FIELD' ? 'Field' : 'Method'} Names
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempFallbackMemberInput}
                          onChange={(e) => setTempFallbackMemberInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tempFallbackMemberInput.trim()) {
                              e.preventDefault();
                              if (!newTargetFallbackMembers.includes(tempFallbackMemberInput.trim())) {
                                setNewTargetFallbackMembers([...newTargetFallbackMembers, tempFallbackMemberInput.trim()]);
                              }
                              setTempFallbackMemberInput('');
                            }
                          }}
                          placeholder={newTargetKind === 'FIELD' ? 'e.g. speed' : 'e.g. ApplyDamage'}
                          className="flex-1 px-2 py-1 bg-[#1A1A1D] border border-[#353538] rounded-md text-[9px] sm:text-[11px] text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (tempFallbackMemberInput.trim()) {
                              if (!newTargetFallbackMembers.includes(tempFallbackMemberInput.trim())) {
                                setNewTargetFallbackMembers([...newTargetFallbackMembers, tempFallbackMemberInput.trim()]);
                              }
                              setTempFallbackMemberInput('');
                            }
                          }}
                          className="p-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-md border border-indigo-500/40 transition-colors"
                          title="Add Fallback Member"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {newTargetFallbackMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {newTargetFallbackMembers.map((mem, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[10px] font-mono text-amber-300"
                            >
                              {mem}
                              <button
                                type="button"
                                onClick={() => setNewTargetFallbackMembers(newTargetFallbackMembers.filter((_, i) => i !== idx))}
                                className="text-[#8E8E93] hover:text-red-400 p-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer */}
        <div className="p-2.5 sm:p-3 border-t border-[#2D2D30] shrink-0 bg-[#1E1E20] flex items-center justify-end gap-2">
          <button
            onClick={() => onClose()}
            className="px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-medium text-[#8E8E93] hover:text-white bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddTarget}
            disabled={!isFormValid}
            className={`px-3.5 sm:px-4 py-1.5 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-md transition-all ${
              isFormValid
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20 cursor-pointer'
                : 'bg-indigo-600/40 text-white/50 cursor-not-allowed'
            }`}
          >
            Add Target
          </button>
        </div>
      </div>
    </div>
  );
};
