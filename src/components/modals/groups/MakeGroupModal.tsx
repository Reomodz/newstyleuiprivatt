import React, { useState, useEffect } from 'react';
import { FolderPlus, X, Check, Search } from 'lucide-react';
import { WatchlistTargetItem } from '../../../types';

interface MakeGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  ungroupedTargets: WatchlistTargetItem[];
  existingGroupNames: string[];
  onConfirmCreateGroup: (groupName: string, targetIds: string[]) => void;
}

export const MakeGroupModal: React.FC<MakeGroupModalProps> = ({
  isOpen,
  onClose,
  ungroupedTargets,
  existingGroupNames,
  onConfirmCreateGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setSelectedTargetIds([]);
      setFilterQuery('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUngrouped = ungroupedTargets.filter((t) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const name = (t.customName || '').toLowerCase();
    const cls = t.className.toLowerCase();
    const mem = t.memberName.toLowerCase();
    return name.includes(q) || cls.includes(q) || mem.includes(q);
  });

  const toggleTarget = (id: string) => {
    setSelectedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTargetIds.length === filteredUngrouped.length) {
      setSelectedTargetIds([]);
    } else {
      setSelectedTargetIds(filteredUngrouped.map((t) => t.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) {
      setError('Please enter a group name');
      return;
    }
    if (existingGroupNames.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      setError(`A group named "${trimmed}" already exists`);
      return;
    }

    onConfirmCreateGroup(trimmed, selectedTargetIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-2 sm:p-3 flex justify-center items-center">
      <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[82vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-[#2D2D30] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#E2E2E4]">Make New Group</h3>
              <p className="text-[10px] text-[#8E8E93]">Organize targets into a categorized section</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3 sm:space-y-4">
            {/* Group Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-semibold text-[#C4C4C8] flex items-center justify-between">
                <span>Group Name <span className="text-red-400">*</span></span>
                <span className="text-[9px] text-[#8E8E93] font-normal">e.g. Combat, Player, Network</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter group name..."
                autoFocus
                className="w-full px-3 py-2 bg-[#141416] border border-[#353538] focus:border-purple-500 rounded-xl text-xs sm:text-sm text-[#E2E2E4] placeholder-[#5A5A60] focus:outline-none transition-colors"
              />
              {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
            </div>

            {/* Select Ungrouped Targets Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#26262A]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] sm:text-xs font-semibold text-[#C4C4C8]">
                    Add Ungrouped Targets (Optional)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#252528] text-purple-300 border border-purple-500/20">
                    {selectedTargetIds.length} / {ungroupedTargets.length}
                  </span>
                </div>
                {filteredUngrouped.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    {selectedTargetIds.length === filteredUngrouped.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {ungroupedTargets.length > 4 && (
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Filter ungrouped targets..."
                    className="w-full pl-7 pr-3 py-1 bg-[#161618] border border-[#2D2D30] rounded-lg text-[10px] text-[#E2E2E4] placeholder-[#6C6C70] focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              {ungroupedTargets.length === 0 ? (
                <div className="p-3 text-center bg-[#141416] rounded-xl border border-[#28282C] text-[11px] text-[#71717A]">
                  No ungrouped targets currently. An empty group will be created so you can add targets to it anytime.
                </div>
              ) : filteredUngrouped.length === 0 ? (
                <div className="p-3 text-center bg-[#141416] rounded-xl border border-[#28282C] text-[11px] text-[#71717A]">
                  No targets match "{filterQuery}".
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 bg-[#141416] p-1.5 rounded-xl border border-[#2C2C30]">
                  {filteredUngrouped.map((item) => {
                    const isSelected = selectedTargetIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleTarget(item.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-950/30 border border-purple-500/40 text-purple-200'
                            : 'hover:bg-[#1C1C20] border border-transparent text-[#8E8E93]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'border-[#424248] bg-[#1A1A1E]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-white font-semibold' : 'text-[#C4C4C8]'}`}>
                            {item.customName || `${item.className}.${item.memberName}`}
                          </span>
                          {item.customName && (
                            <span className="text-[9px] font-mono text-[#71717A] truncate">
                              {item.className}.{item.memberName}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[8px] px-1 py-0.2 rounded font-mono font-semibold shrink-0 ${
                            item.kind === 'FIELD'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {item.kind}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 border-t border-[#2D2D30] shrink-0 flex items-center justify-end gap-2 bg-[#19191B]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8E8E93] hover:text-white bg-[#222226] hover:bg-[#2A2A30] border border-[#333338] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 transition-all active:scale-95"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
