import React, { useState, useEffect } from 'react';
import { Folder, Layers, X, Check, Search, Plus } from 'lucide-react';
import { WatchlistTargetItem } from '../../../types';

interface SelectTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationGroupName: string;
  destinationSubGroupName?: string;
  availableTargets: WatchlistTargetItem[];
  onConfirmAssign: (targetIds: string[], groupName: string, subGroupName?: string) => void;
  onCreateNewTarget?: (groupName?: string, subGroupName?: string) => void;
}

export const SelectTargetsModal: React.FC<SelectTargetsModalProps> = ({
  isOpen,
  onClose,
  destinationGroupName,
  destinationSubGroupName,
  availableTargets,
  onConfirmAssign,
  onCreateNewTarget,
}) => {
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedTargetIds([]);
      setFilterQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTargets = availableTargets.filter((t) => {
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
    if (selectedTargetIds.length === filteredTargets.length) {
      setSelectedTargetIds([]);
    } else {
      setSelectedTargetIds(filteredTargets.map((t) => t.id));
    }
  };

  const handleConfirm = () => {
    if (selectedTargetIds.length === 0) return;
    onConfirmAssign(selectedTargetIds, destinationGroupName, destinationSubGroupName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-2 sm:p-3 flex justify-center items-center">
      <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[82vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-[#2D2D30] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg border ${
                destinationSubGroupName
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}
            >
              {destinationSubGroupName ? <Layers className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#E2E2E4]">
                {destinationSubGroupName ? 'Add Targets to Sub-Group' : 'Add Targets to Group'}
              </h3>
              <p className="text-[10px] text-[#8E8E93] flex items-center gap-1">
                <span>Inside</span>
                <span className="text-purple-300 font-semibold inline-flex items-center gap-0.5">
                  <Folder className="w-2.5 h-2.5" />
                  {destinationGroupName}
                </span>
                {destinationSubGroupName && (
                  <>
                    <span className="text-[#6C6C70]">›</span>
                    <span className="text-sky-300 font-semibold inline-flex items-center gap-0.5">
                      <Layers className="w-2.5 h-2.5" />
                      {destinationSubGroupName}
                    </span>
                  </>
                )}
              </p>
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

        {/* Content Body */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3">
          {/* Informative Alert Banner */}
          <div
            className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border text-xs ${
              destinationSubGroupName
                ? 'bg-sky-950/20 border-sky-500/30 text-sky-200'
                : 'bg-purple-950/20 border-purple-500/30 text-purple-200'
            }`}
          >
            {destinationSubGroupName ? (
              <Layers className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            ) : (
              <Folder className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            )}
            <span className="text-[11px] leading-tight">
              Select targets below to add them to{' '}
              <strong className="text-white font-semibold">
                {destinationSubGroupName
                  ? `${destinationGroupName} › ${destinationSubGroupName}`
                  : destinationGroupName}
              </strong>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-[#C4C4C8]">
              Available Targets ({selectedTargetIds.length} selected)
            </span>
            {filteredTargets.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {selectedTargetIds.length === filteredTargets.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {availableTargets.length > 4 && (
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter targets..."
                className="w-full pl-7 pr-3 py-1 bg-[#161618] border border-[#2D2D30] rounded-lg text-[10px] text-[#E2E2E4] placeholder-[#6C6C70] focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {availableTargets.length === 0 ? (
            <div className="p-4 text-center bg-[#141416] rounded-xl border border-[#28282C] text-[11px] text-[#71717A] flex flex-col items-center gap-2.5">
              <p>No ungrouped targets available to add.</p>
              {onCreateNewTarget && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateNewTarget(destinationGroupName, destinationSubGroupName);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Target</span>
                </button>
              )}
            </div>
          ) : filteredTargets.length === 0 ? (
            <div className="p-4 text-center bg-[#141416] rounded-xl border border-[#28282C] text-[11px] text-[#71717A]">
              No targets match "{filterQuery}".
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1 bg-[#141416] p-1.5 rounded-xl border border-[#2C2C30]">
              {filteredTargets.map((item) => {
                const isSelected = selectedTargetIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleTarget(item.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/30 border border-indigo-500/40 text-indigo-200'
                        : 'hover:bg-[#1C1C20] border border-transparent text-[#8E8E93]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
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

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#2D2D30] shrink-0 flex items-center justify-end gap-2 bg-[#19191B]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#8E8E93] hover:text-white bg-[#222226] hover:bg-[#2A2A30] border border-[#333338] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedTargetIds.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Add Selected ({selectedTargetIds.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
