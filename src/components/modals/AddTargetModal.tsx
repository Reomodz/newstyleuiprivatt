import React from 'react';
import { Plus, X, Sparkles, EyeOff, Eye, ChevronDown } from 'lucide-react';
import { WatchlistProfile } from '../../types';

interface AddTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: WatchlistProfile | undefined;
  newTargetKind: 'FIELD' | 'METHOD';
  setNewTargetKind: (kind: 'FIELD' | 'METHOD') => void;
  newTargetCustomName: string;
  setNewTargetCustomName: (val: string) => void;
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
  newTargetCustomName, setNewTargetCustomName, newTargetClassName, setNewTargetClassName,
  newTargetMemberName, setNewTargetMemberName, newTargetComment, setNewTargetComment,
  showAddFallbacks, setShowAddFallbacks, tempFallbackClassInput, setTempFallbackClassInput,
  tempFallbackMemberInput, setTempFallbackMemberInput, newTargetFallbackClasses, setNewTargetFallbackClasses,
  newTargetFallbackMembers, setNewTargetFallbackMembers, handleAddTarget
}) => {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-2.5 sm:p-4 flex justify-center items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-[#2D2D30] shrink-0 flex items-center justify-between">
              <h3 className="text-xs sm:text-base font-semibold text-[#E2E2E4] flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-indigo-400" />
                <span>Add Target to <span className="text-indigo-400">{activeProfile?.name}</span></span>
              </h3>
              <button
                type="button"
                onClick={() => onClose()}
                className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-3 sm:space-y-4 overscroll-contain pr-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Target Type</label>
              <div className="flex items-center gap-3 p-1 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl">
                <button
                  type="button"
                  onClick={() => setNewTargetKind('FIELD')}
                  className={`flex-1 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all ${
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
                  className={`flex-1 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all ${
                    newTargetKind === 'METHOD'
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                      : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  Method (RVA)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">
                Custom Name / Display Label (Optional)
              </label>
              <input
                type="text"
                value={newTargetCustomName}
                onChange={(e) => setNewTargetCustomName(e.target.value)}
                placeholder="e.g. PlayerSpeed (Used in code export & display)"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Class Name</label>
              <input
                type="text"
                value={newTargetClassName}
                onChange={(e) => setNewTargetClassName(e.target.value)}
                placeholder="e.g. PlayerController"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">
                {newTargetKind === 'FIELD' ? 'Field Name' : 'Method Name'}
              </label>
              <input
                type="text"
                value={newTargetMemberName}
                onChange={(e) => setNewTargetMemberName(e.target.value)}
                placeholder={newTargetKind === 'FIELD' ? 'e.g. moveSpeed' : 'e.g. Update'}
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Comment (Optional)</label>
              <input
                type="text"
                value={newTargetComment}
                onChange={(e) => setNewTargetComment(e.target.value)}
                placeholder="e.g. Movement multiplier"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Fallbacks Configuration (Collapsible with Eye/EyeOff logo) */}
            <div className="bg-[#141416] rounded-xl sm:rounded-2xl border border-[#353538] overflow-hidden">
              <button
                id="btn-toggle-add-fallbacks"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAddFallbacks(!showAddFallbacks);
                }}
                className="w-full p-1.5 sm:p-3.5 flex items-center justify-between hover:bg-[#1A1A1E] active:bg-[#18181B] transition-colors cursor-pointer select-none"
                aria-expanded={showAddFallbacks}
              >
                <div className="flex items-center gap-2 text-[9px] sm:text-xs font-semibold text-amber-400">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  <span>Fallback Names (Optional)</span>
                  {(newTargetFallbackClasses.length > 0 || newTargetFallbackMembers.length > 0) && (
                    <span className="text-[8px] sm:text-[10px] bg-amber-500/20 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full font-mono">
                      {newTargetFallbackClasses.length + newTargetFallbackMembers.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-[#202024] hover:bg-[#2A2A30] border border-[#3A3A42] text-[9px] sm:text-xs font-medium text-[#D0D0D5] transition-colors shadow-sm">
                  {showAddFallbacks ? (
                    <>
                      <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                      <span className="text-amber-300 font-semibold">Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                      <span className="text-[#E2E2E4] font-semibold">Show</span>
                    </>
                  )}
                  <ChevronDown
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${
                      showAddFallbacks ? 'rotate-180 text-amber-400' : 'text-[#8E8E93]'
                    }`}
                  />
                </div>
              </button>

              {showAddFallbacks && (
                <div className="p-1.5 sm:p-3.5 pt-0 border-t border-[#262629] flex flex-col gap-3 mt-2 max-h-56 overflow-y-auto overscroll-contain">
                  <p className="text-[8px] sm:text-[11px] text-[#8E8E93] leading-relaxed">
                    If the game updates and the primary name is missing, the scanner will automatically try these fallbacks.
                  </p>

                  {/* Fallback Class Names List */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] sm:text-[11px] font-medium text-[#8E8E93]">
                      Fallback Class Names
                    </label>
                    <div className="flex items-center gap-1.5">
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
                        placeholder="e.g. PlayerMovement"
                        className="flex-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
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
                        className="p-1.5 sm:p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg sm:rounded-xl border border-indigo-500/40 transition-colors"
                        title="Add Fallback Class"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    {newTargetFallbackClasses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newTargetFallbackClasses.map((cls, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[11px] font-mono text-sky-300"
                          >
                            {cls}
                            <button
                              type="button"
                              onClick={() => setNewTargetFallbackClasses(newTargetFallbackClasses.filter((_, i) => i !== idx))}
                              className="text-[#8E8E93] hover:text-red-400 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fallback Member Names List */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] sm:text-[11px] font-medium text-[#8E8E93]">
                      Fallback {newTargetKind === 'FIELD' ? 'Field' : 'Method'} Names
                    </label>
                    <div className="flex items-center gap-1.5">
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
                        className="flex-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
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
                        className="p-1.5 sm:p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg sm:rounded-xl border border-indigo-500/40 transition-colors"
                        title="Add Fallback Member"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    {newTargetFallbackMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newTargetFallbackMembers.map((mem, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[11px] font-mono text-amber-300"
                          >
                            {mem}
                            <button
                              type="button"
                              onClick={() => setNewTargetFallbackMembers(newTargetFallbackMembers.filter((_, i) => i !== idx))}
                              className="text-[#8E8E93] hover:text-red-400 p-0.5"
                            >
                              <X className="w-3 h-3" />
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

            {/* Modal Sticky Footer */}
            <div className="p-3 sm:p-4 border-t border-[#2D2D30] shrink-0 bg-[#1E1E20] flex items-center justify-end gap-2.5 sm:gap-3">
              <button
                onClick={() => onClose()}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-sm font-medium text-[#8E8E93] hover:text-white bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTarget}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
              >
                Add Target
              </button>
            </div>
          </div>
        </div>
  );
};
