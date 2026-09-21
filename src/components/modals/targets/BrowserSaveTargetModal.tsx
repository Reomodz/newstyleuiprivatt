import React from 'react';
import { Target, X, BookmarkPlus, Shield, Layers, Box, Code2, AlertTriangle } from 'lucide-react';
import { WatchlistProfile } from '../../../types';

interface BrowserSaveTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetKind: 'FIELD' | 'METHOD';
  setTargetKind?: (kind: 'FIELD' | 'METHOD') => void;
  assemblyName: string;
  setAssemblyName: (val: string) => void;
  className: string;
  setClassName: (val: string) => void;
  memberName: string;
  setMemberName: (val: string) => void;
  customName: string;
  setCustomName: (val: string) => void;
  groupName: string;
  setGroupName: (val: string) => void;
  comment: string;
  setComment: (val: string) => void;
  selectedProfileId: string;
  setSelectedProfileId: (id: string) => void;
  profiles?: WatchlistProfile[];
  availableGroups: string[];
  onSave: () => void;
}

export const BrowserSaveTargetModal: React.FC<BrowserSaveTargetModalProps> = ({
  isOpen,
  onClose,
  targetKind,
  assemblyName,
  setAssemblyName,
  className,
  setClassName,
  memberName,
  setMemberName,
  customName,
  setCustomName,
  groupName,
  setGroupName,
  comment,
  setComment,
  selectedProfileId,
  setSelectedProfileId,
  profiles = [],
  availableGroups,
  onSave,
}) => {
  if (!isOpen) return null;

  const hasProfiles = profiles && profiles.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-2 sm:p-4 flex justify-center items-center overflow-y-auto">
      <div className="bg-[#1C1C1F] border border-[#38383E] rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Header */}
        <div className="p-2.5 sm:p-3.5 border-b border-[#2C2C30] flex items-center justify-between shrink-0 bg-[#171719]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-lg shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">Save to Profile Target</h3>
                <span
                  className={`text-[8.5px] font-mono font-bold px-1 py-0.2 rounded border ${
                    targetKind === 'FIELD'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {targetKind}
                </span>
              </div>
              <p className="text-[10px] text-[#8E8E93] truncate mt-0.5">
                Pure semantic symbol (DLL · Class · {targetKind === 'FIELD' ? 'Field' : 'Method'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] rounded-lg transition-colors shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-2.5 sm:p-4 flex-1 overflow-y-auto space-y-2.5 sm:space-y-3">
          {/* Warning banner if no profile is active / created */}
          {!hasProfiles && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <div className="font-semibold text-amber-200">No Active Profile Found</div>
                <div className="text-amber-300/80 mt-0.5">
                  A new <span className="font-semibold text-amber-200">"Default Profile"</span> will be automatically created and activated for you upon saving this target.
                </div>
              </div>
            </div>
          )}

          {/* Target Profile Selection */}
          {hasProfiles && (
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] sm:text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                Destination Profile
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#141416] border border-[#333338] rounded-lg text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.items?.length || 0} targets)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Custom Name / Display Label (Positioned 2nd right after Profile) */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Custom Name / Display Label (Optional)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. PlayerSpeed"
              className="w-full px-2.5 py-1.5 bg-[#141416] border border-[#333338] rounded-lg text-xs text-[#E2E2E4] font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Assembly / DLL (.dll) */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Assembly / DLL</span>
            </label>
            <input
              type="text"
              value={assemblyName}
              onChange={(e) => setAssemblyName(e.target.value)}
              placeholder="e.g. Assembly-CSharp.dll"
              className="w-full px-2.5 py-1.5 bg-[#141416] border border-[#333338] rounded-lg text-xs text-[#E2E2E4] font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Class Name */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
              <Box className="w-3 h-3 text-purple-400" />
              <span>Target Namespace & Class</span>
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. COW.GamePlay:CameraControllerBase or CameraControllerBase"
              className="w-full px-2.5 py-1.5 bg-[#141416] border border-[#333338] rounded-lg text-xs text-[#E2E2E4] font-mono focus:outline-none focus:border-indigo-500"
              required
            />
            <span className="text-[8.5px] text-[#71717A] ml-0.5 font-mono">
              Format: <span className="text-indigo-300">Namespace:ClassName</span> or <span className="text-indigo-300">ClassName</span>.
            </span>
          </div>

          {/* Member Name (Field / Method) */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
              <Code2 className="w-3 h-3 text-emerald-400" />
              <span>{targetKind === 'FIELD' ? 'Field Name' : 'Method Name'}</span>
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder={targetKind === 'FIELD' ? 'e.g. moveSpeed' : 'e.g. Update'}
              className="w-full px-2.5 py-1.5 bg-[#141416] border border-[#333338] rounded-lg text-xs text-[#E2E2E4] font-mono font-semibold focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Group Name */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Group / Category (Optional)
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Player, Combat, Camera"
              className="w-full px-2.5 py-1.5 bg-[#141416] border border-[#333338] rounded-lg text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
            />
            {availableGroups.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-0.5">
                <span className="text-[9px] text-[#71717A]">Quick:</span>
                {availableGroups.slice(0, 5).map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setGroupName(grp)}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-[#242428] hover:bg-[#303036] text-[#A1A1AA] hover:text-white border border-[#38383E] transition-colors"
                  >
                    {grp}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] sm:text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wider">
              Comment / Notes (Optional)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Injected in patch v1.2"
              className="w-full px-2.5 py-1.5 bg-[#141416] border border-[#333338] rounded-lg text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Pure Symbol Notice */}
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[#A5B4FC] text-[10px] flex items-start gap-1.5">
            <Shield className="w-3.5 h-3.5 shrink-0 text-indigo-400 mt-0.5" />
            <span>
              <strong>Zero-Offset Architecture:</strong> Saved without static offsets for dynamic cross-patch stability.
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-2 sm:p-3 border-t border-[#2C2C30] bg-[#171719] flex items-center justify-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A1A1A8] hover:text-white hover:bg-[#26262B] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!className.trim() || !memberName.trim()}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              className.trim() && memberName.trim()
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95 cursor-pointer'
                : 'bg-[#25252A] text-[#636369] border border-[#323238] cursor-not-allowed'
            }`}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Target</span>
          </button>
        </div>
      </div>
    </div>
  );
};
