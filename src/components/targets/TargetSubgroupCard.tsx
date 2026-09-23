import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WatchlistTargetItem } from '../../types';
import { AppThemeSettings } from '../../types/theme';

export interface TargetSubgroupCardProps {
  parentGroupName: string;
  subGroupName: string | null;
  items: WatchlistTargetItem[];
  availableCount: number;
  isDragOver: boolean;
  tabletLayout?: 'grid' | 'list';
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onAddTargets: () => void;
  onDeleteSubgroup: () => void;
  themeSettings?: AppThemeSettings;
  renderCard: (item: WatchlistTargetItem, isFirst: boolean, isLast: boolean) => React.ReactNode;
}

export const TargetSubgroupCard: React.FC<TargetSubgroupCardProps> = ({
  subGroupName,
  items,
  availableCount,
  isDragOver,
  tabletLayout = 'grid',
  onDragOver,
  onDragLeave,
  onDrop,
  onAddTargets,
  onDeleteSubgroup,
  themeSettings,
  renderCard,
}) => {
  const isNamedSubgroup = Boolean(subGroupName);

  const isAtmosphereOn = themeSettings?.enableAtmosphere ?? true;
  const isTranslucent = isAtmosphereOn && Boolean(themeSettings?.customBgImage || (themeSettings?.cardOpacity && themeSettings.cardOpacity < 100));

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-col gap-1.5 target-subgroup-card ${
        isNamedSubgroup
          ? `p-1.5 sm:p-2 rounded-lg border transition-all ${
              isDragOver
                ? 'border-sky-500 bg-sky-950/20'
                : isTranslucent
                ? 'border-white/10 hover:border-white/15'
                : 'border-[#232328] bg-[#121214]/80'
            }`
          : ''
      }`}
    >
      {/* Sub-Group Header (if named) */}
      {isNamedSubgroup && (
        <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-[#202024] flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1 text-sky-400 font-mono text-[10px] sm:text-[10.5px] font-semibold truncate">
            <span className="text-[#6C6C70]">↳</span>
            <span className="truncate">{subGroupName}</span>
            <span className="text-[8.5px] px-1 py-0.2 rounded bg-[#1C1C20] text-[#8E8E93] border border-[#2A2A30] shrink-0">
              {items.length}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Add Target Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddTargets();
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-semibold text-sky-300 hover:text-white bg-sky-600/20 hover:bg-sky-600/35 border border-sky-500/30 hover:border-sky-500/50 rounded transition-colors shrink-0 active:scale-95 shadow-sm"
              title={`Add targets to sub-group ${subGroupName}`}
            >
              <Plus className="w-2.5 h-2.5 text-sky-400" />
              <span>Target</span>
              {availableCount > 0 && (
                <span className="text-[8px] font-mono px-0.5 rounded bg-sky-500/25 text-sky-300">
                  {availableCount}
                </span>
              )}
            </button>

            {items.length === 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSubgroup();
                }}
                className="p-1 text-[#8E8E93] hover:text-red-400 bg-[#1A1A1E] hover:bg-[#222226] border border-[#2B2B30] rounded transition-colors shrink-0"
                title="Delete empty sub-group"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cards Grid or Empty State */}
      {items.length === 0 && isNamedSubgroup ? (
        <div className="p-2 text-center text-[#71717A] bg-[#121214]/60 rounded-lg border border-dashed border-[#28282C] text-[10px] flex flex-col items-center gap-0.5">
          <span>No targets in this sub-group yet.</span>
          <span className="text-[#55555A]">Click Add Target above to select targets.</span>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 ${
            tabletLayout === 'list'
              ? 'md:grid-cols-1'
              : 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
          } gap-2 sm:gap-2.5`}
        >
          {items.map((item, idx) =>
            renderCard(item, idx === 0, idx === items.length - 1)
          )}
        </div>
      )}
    </div>
  );
};
