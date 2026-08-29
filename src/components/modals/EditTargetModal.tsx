import React from 'react';
import { Pencil, X, Sparkles, EyeOff, Eye, ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { WatchlistProfile, WatchlistTargetItem } from '../../types';

interface EditTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: WatchlistProfile | undefined;
  editingTargetItem: WatchlistTargetItem | null;
  editTargetKind: 'FIELD' | 'METHOD';
  setEditTargetKind: (kind: 'FIELD' | 'METHOD') => void;
  editTargetCustomName: string;
  setEditTargetCustomName: (val: string) => void;
  editTargetClassName: string;
  setEditTargetClassName: (val: string) => void;
  editTargetMemberName: string;
  setEditTargetMemberName: (val: string) => void;
  editTargetComment: string;
  setEditTargetComment: (val: string) => void;
  showEditFallbacks: boolean;
  setShowEditFallbacks: (val: boolean) => void;
  editTempFallbackClassInput: string;
  setEditTempFallbackClassInput: (val: string) => void;
  editTempFallbackMemberInput: string;
  setEditTempFallbackMemberInput: (val: string) => void;
  editTargetFallbackClasses: string[];
  setEditTargetFallbackClasses: (val: string[]) => void;
  editTargetFallbackMembers: string[];
  setEditTargetFallbackMembers: (val: string[]) => void;
  handleOpenEditTarget: (target: WatchlistTargetItem) => void;
  handleSaveEditTarget: () => void;
}

export const EditTargetModal: React.FC<EditTargetModalProps> = ({
  isOpen, onClose, activeProfile, editingTargetItem, editTargetKind, setEditTargetKind,
  editTargetCustomName, setEditTargetCustomName, editTargetClassName, setEditTargetClassName,
  editTargetMemberName, setEditTargetMemberName, editTargetComment, setEditTargetComment,
  showEditFallbacks, setShowEditFallbacks, editTempFallbackClassInput, setEditTempFallbackClassInput,
  editTempFallbackMemberInput, setEditTempFallbackMemberInput, editTargetFallbackClasses, setEditTargetFallbackClasses,
  editTargetFallbackMembers, setEditTargetFallbackMembers, handleSaveEditTarget, handleOpenEditTarget
}) => {
  if (!isOpen || !editingTargetItem) return null;

  return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-2.5 sm:p-4 flex justify-center items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-[#2D2D30] shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-xs sm:text-base font-semibold text-[#E2E2E4] flex items-center gap-2 truncate">
                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">Edit Target</span>
                </h3>
                <span className="text-[9px] sm:text-xs text-indigo-300 font-mono bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded border border-indigo-500/20 truncate max-w-[110px] sm:max-w-[180px]">
                  {activeProfile?.name}
                </span>
              </div>

              {/* Next / Back navigation in Edit modal */}
              <div className="flex items-center gap-1.5 shrink-0">
                {activeProfile && activeProfile.items.length > 1 && (
                  <div className="flex items-center gap-0.5 bg-[#141416] px-1 sm:px-1.5 py-0.5 rounded-lg border border-[#353538]">
                    <span className="text-[8px] sm:text-[10px] text-[#8E8E93] font-mono pr-1">
                      {activeProfile.items.findIndex((i) => i.id === editingTargetItem?.id) + 1}/{activeProfile.items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = activeProfile.items.findIndex((i) => i.id === editingTargetItem?.id);
                        if (curIdx > 0) {
                          handleOpenEditTarget(activeProfile.items[curIdx - 1]);
                        } else {
                          handleOpenEditTarget(activeProfile.items[activeProfile.items.length - 1]);
                        }
                      }}
                      className="p-1 hover:bg-[#262629] text-[#8E8E93] hover:text-white rounded transition-colors"
                      title="Previous Target"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = activeProfile.items.findIndex((i) => i.id === editingTargetItem?.id);
                        if (curIdx >= 0 && curIdx < activeProfile.items.length - 1) {
                          handleOpenEditTarget(activeProfile.items[curIdx + 1]);
                        } else {
                          handleOpenEditTarget(activeProfile.items[0]);
                        }
                      }}
                      className="p-1 hover:bg-[#262629] text-[#8E8E93] hover:text-white rounded transition-colors"
                      title="Next Target"
                    >
                      <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-3 sm:space-y-4 overscroll-contain pr-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Target Type</label>
                <div className="flex items-center gap-3 p-1 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setEditTargetKind('FIELD')}
                    className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all ${
                      editTargetKind === 'FIELD'
                        ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                        : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    Field (Offset)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTargetKind('METHOD')}
                    className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all ${
                      editTargetKind === 'METHOD'
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
                  value={editTargetCustomName}
                  onChange={(e) => setEditTargetCustomName(e.target.value)}
                  placeholder="e.g. PlayerSpeed (Used in code export & display)"
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Primary Class Name</label>
                <input
                  type="text"
                  value={editTargetClassName}
                  onChange={(e) => setEditTargetClassName(e.target.value)}
                  placeholder="e.g. PlayerController"
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">
                  Primary {editTargetKind === 'FIELD' ? 'Field Name' : 'Method Name'}
                </label>
                <input
                  type="text"
                  value={editTargetMemberName}
                  onChange={(e) => setEditTargetMemberName(e.target.value)}
                  placeholder={editTargetKind === 'FIELD' ? 'e.g. moveSpeed' : 'e.g. Update'}
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Comment (Optional)</label>
                <input
                  type="text"
                  value={editTargetComment}
                  onChange={(e) => setEditTargetComment(e.target.value)}
                  placeholder="e.g. Movement multiplier"
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Fallbacks Configuration (Collapsible with Eye/EyeOff logo) */}
              <div className="bg-[#141416] rounded-xl sm:rounded-2xl border border-[#353538] overflow-hidden">
                <button
                  id="btn-toggle-edit-fallbacks"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowEditFallbacks(!showEditFallbacks);
                  }}
                  className="w-full p-2 sm:p-3.5 flex items-center justify-between hover:bg-[#1A1A1E] active:bg-[#18181B] transition-colors cursor-pointer select-none"
                  aria-expanded={showEditFallbacks}
                >
                  <div className="flex items-center gap-2 text-[9px] sm:text-xs font-semibold text-amber-400">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                    <span>Fallback / Alternative Names</span>
                    {(editTargetFallbackClasses.length > 0 || editTargetFallbackMembers.length > 0) && (
                      <span className="text-[8px] sm:text-[10px] bg-amber-500/20 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full font-mono">
                        {editTargetFallbackClasses.length + editTargetFallbackMembers.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-[#202024] hover:bg-[#2A2A30] border border-[#3A3A42] text-[9px] sm:text-xs font-medium text-[#D0D0D5] transition-colors shadow-sm">
                    {showEditFallbacks ? (
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
                        showEditFallbacks ? 'rotate-180 text-amber-400' : 'text-[#8E8E93]'
                      }`}
                    />
                  </div>
                </button>

                {showEditFallbacks && (
                  <div className="p-2 sm:p-3.5 pt-0 border-t border-[#262629] flex flex-col gap-3 mt-2 max-h-56 overflow-y-auto overscroll-contain">
                    <p className="text-[8px] sm:text-[11px] text-[#8E8E93] leading-relaxed">
                      If the primary name isn't found during a scan, these fallbacks are searched in order.
                    </p>

                    {/* Fallback Class Names List */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] sm:text-[11px] font-medium text-[#8E8E93]">
                        Fallback Class Names
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editTempFallbackClassInput}
                          onChange={(e) => setEditTempFallbackClassInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editTempFallbackClassInput.trim()) {
                              e.preventDefault();
                              if (!editTargetFallbackClasses.includes(editTempFallbackClassInput.trim())) {
                                setEditTargetFallbackClasses([...editTargetFallbackClasses, editTempFallbackClassInput.trim()]);
                              }
                              setEditTempFallbackClassInput('');
                            }
                          }}
                          placeholder="e.g. PlayerMovement"
                          className="flex-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editTempFallbackClassInput.trim()) {
                              if (!editTargetFallbackClasses.includes(editTempFallbackClassInput.trim())) {
                                setEditTargetFallbackClasses([...editTargetFallbackClasses, editTempFallbackClassInput.trim()]);
                              }
                              setEditTempFallbackClassInput('');
                            }
                          }}
                          className="p-1.5 sm:p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg sm:rounded-xl border border-indigo-500/40 transition-colors"
                          title="Add Fallback Class"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      {editTargetFallbackClasses.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editTargetFallbackClasses.map((cls, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[11px] font-mono text-sky-300"
                            >
                              {cls}
                              <button
                                type="button"
                                onClick={() => setEditTargetFallbackClasses(editTargetFallbackClasses.filter((_, i) => i !== idx))}
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
                        Fallback {editTargetKind === 'FIELD' ? 'Field' : 'Method'} Names
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editTempFallbackMemberInput}
                          onChange={(e) => setEditTempFallbackMemberInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editTempFallbackMemberInput.trim()) {
                              e.preventDefault();
                              if (!editTargetFallbackMembers.includes(editTempFallbackMemberInput.trim())) {
                                setEditTargetFallbackMembers([...editTargetFallbackMembers, editTempFallbackMemberInput.trim()]);
                              }
                              setEditTempFallbackMemberInput('');
                            }
                          }}
                          placeholder={editTargetKind === 'FIELD' ? 'e.g. speed' : 'e.g. ApplyDamage'}
                          className="flex-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editTempFallbackMemberInput.trim()) {
                              if (!editTargetFallbackMembers.includes(editTempFallbackMemberInput.trim())) {
                                setEditTargetFallbackMembers([...editTargetFallbackMembers, editTempFallbackMemberInput.trim()]);
                              }
                              setEditTempFallbackMemberInput('');
                            }
                          }}
                          className="p-1.5 sm:p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg sm:rounded-xl border border-indigo-500/40 transition-colors"
                          title="Add Fallback Member"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      {editTargetFallbackMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editTargetFallbackMembers.map((mem, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[11px] font-mono text-amber-300"
                            >
                              {mem}
                              <button
                                type="button"
                                onClick={() => setEditTargetFallbackMembers(editTargetFallbackMembers.filter((_, i) => i !== idx))}
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
                onClick={handleSaveEditTarget}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
  );
};
