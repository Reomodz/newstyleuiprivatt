import React from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
  Eye,
  FolderMinus,
  Trash2,
  Folder,
  Sparkles,
} from 'lucide-react';
import { WatchlistTargetItem, TargetCardViewSettings } from '../../types';
import { il2cppEngine } from '../../services/il2cppEngine';

export interface TargetCardProps {
  item: WatchlistTargetItem;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  cardViewSettings: TargetCardViewSettings;
  isBeingDragged: boolean;
  isDropTarget: boolean;
  dragOverPosition: 'before' | 'after' | null;
  onDragStart: (e: React.DragEvent, item: WatchlistTargetItem) => void;
  onDragOver: (e: React.DragEvent, item: WatchlistTargetItem) => void;
  onDragLeave: (e: React.DragEvent, item: WatchlistTargetItem) => void;
  onDrop: (e: React.DragEvent, item: WatchlistTargetItem) => void;
  onView: (item: WatchlistTargetItem) => void;
  onEdit: (item: WatchlistTargetItem) => void;
  onMove: (itemId: string, direction: 'up' | 'down') => void;
  onAssign: (itemId: string, groupName: string | undefined, subGroupName: string | undefined) => void;
  onDelete: (item: WatchlistTargetItem) => void;
  onNavigateToBrowser?: (classIndex?: number, memberKind?: 'FIELD' | 'METHOD', memberName?: string) => void;
  isDumpLoaded?: boolean;
}

export const TargetCard: React.FC<TargetCardProps> = React.memo(({
  item,
  isFirstInGroup,
  isLastInGroup,
  cardViewSettings,
  isBeingDragged,
  isDropTarget,
  dragOverPosition,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onView,
  onEdit,
  onMove,
  onAssign,
  onDelete,
  onNavigateToBrowser,
  isDumpLoaded = true,
}) => {
  const hasFallbacks =
    (item.fallbackClassNames && item.fallbackClassNames.length > 0) ||
    (item.fallbackMemberNames && item.fallbackMemberNames.length > 0);

  const isCompact = cardViewSettings.density === 'compact';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDragOver={(e) => onDragOver(e, item)}
      onDragLeave={(e) => onDragLeave(e, item)}
      onDrop={(e) => onDrop(e, item)}
      onClick={() => onView(item)}
      className={`bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] hover:bg-[#232326] border transition-all relative cursor-pointer active:scale-[0.99] group/card ${
        isBeingDragged
          ? 'opacity-40 border-indigo-500 scale-[0.98] ring-1 ring-indigo-500/50'
          : 'border-[#2D2D30] hover:border-indigo-500/40'
      } ${isCompact ? 'p-2 sm:p-2.5 gap-1' : 'p-2.5 sm:p-3 gap-1.5'} rounded-xl shadow-sm flex flex-col`}
    >
      {/* Drop Insertion Line Indicator */}
      {isDropTarget && dragOverPosition === 'before' && (
        <div className="absolute -top-1 left-2 right-2 h-0.5 sm:h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] z-30 pointer-events-none animate-pulse" />
      )}
      {isDropTarget && dragOverPosition === 'after' && (
        <div className="absolute -bottom-1 left-2 right-2 h-0.5 sm:h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] z-30 pointer-events-none animate-pulse" />
      )}

      <div className="flex items-start justify-between gap-2">
        {/* Drag Handle */}
        <div
          className="pt-0.5 text-[#55555A] hover:text-[#A0A0A5] cursor-grab active:cursor-grabbing shrink-0"
          title="Drag to reposition target in profile"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {/* Primary Header: Custom Name Text OR Member Name if no custom name */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {cardViewSettings.showCustomName !== false && item.customName?.trim() ? (
              <span className="font-bold text-xs sm:text-sm text-white group-hover/card:text-indigo-200 transition-colors truncate max-w-[220px] sm:max-w-[340px]">
                {item.customName}
              </span>
            ) : (
              <span className="font-mono text-xs font-semibold text-sky-300 truncate max-w-[220px] sm:max-w-[340px]">
                {item.memberName}
              </span>
            )}

            {/* Assembly / DLL badge */}
            {cardViewSettings.showAssemblyName !== false && (item.assemblyName || item.resolvedAssemblyName) && (
              <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate max-w-[140px]">
                {item.resolvedAssemblyName || item.assemblyName}
              </span>
            )}

            {/* Group / Subgroup badge in flat view */}
            {!cardViewSettings.showGroups && item.groupName && (
              <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 truncate max-w-[130px] flex items-center gap-0.5">
                <Folder className="w-2.5 h-2.5 shrink-0" />
                {item.groupName}{item.subGroupName ? ` / ${item.subGroupName}` : ''}
              </span>
            )}

            {cardViewSettings.showKindBadge && (
              <span
                className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                  item.kind === 'FIELD'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {item.kind}
              </span>
            )}
          </div>

          {/* Resolved Offset / RVA pill if scanned */}
          {(item.offsetHex || item.rvaHex) && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[9px] sm:text-[10px] font-mono">
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                {item.offsetHex || item.rvaHex}
              </span>
              {item.typeName && (
                <span className="text-[#8E8E93] truncate max-w-[140px]">
                  {item.typeName}
                </span>
              )}
            </div>
          )}

          {/* Comments Preview */}
          {cardViewSettings.showComments && item.comment && (
            <div className="text-[9px] sm:text-[10px] text-[#8E8E93] italic line-clamp-1">
              // {item.comment}
            </div>
          )}

          {/* Fallbacks Preview */}
          {cardViewSettings.showFallbacks && hasFallbacks && (
            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-amber-400/90 mt-0.5 flex-wrap font-mono">
              <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span className="text-[#8E8E93]">Fallbacks:</span>
              {item.fallbackClassNames && item.fallbackClassNames.length > 0 && (
                <span className="bg-[#141416] px-1 py-0.2 rounded border border-[#353538] text-[#C4C4C8]">
                  Class: {item.fallbackClassNames.join(', ')}
                </span>
              )}
              {item.fallbackMemberNames && item.fallbackMemberNames.length > 0 && (
                <span className="bg-[#141416] px-1 py-0.2 rounded border border-[#353538] text-[#C4C4C8]">
                  Field: {item.fallbackMemberNames.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons: Move Up/Down, Edit (Pencil), Delete */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Quick Move Up / Move Down for Touch/Keyboard users */}
          <div className="flex items-center bg-[#18181A] border border-[#2D2D30] rounded-md p-0.5 sm:opacity-0 group-hover/card:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMove(item.id, 'up');
              }}
              disabled={isFirstInGroup}
              className="p-0.5 text-[#8E8E93] hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded transition-colors"
              title="Move Up in profile"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMove(item.id, 'down');
              }}
              disabled={isLastInGroup}
              className="p-0.5 text-[#8E8E93] hover:text-white disabled:opacity-20 disabled:pointer-events-none rounded transition-colors"
              title="Move Down in profile"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-indigo-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
            title="Edit Target & Fallbacks"
          >
            <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {isDumpLoaded && onNavigateToBrowser && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const targetClass = item.resolvedClassName || item.className;
                const targetNs = item.namespaceName;
                const classIdx = il2cppEngine.findClassIndexForTarget(targetClass, targetNs);
                onNavigateToBrowser(classIdx, item.kind, item.memberName);
              }}
              className="p-1 sm:p-1.5 text-sky-400 hover:text-sky-200 bg-sky-600/20 hover:bg-sky-600/35 border border-sky-500/30 rounded-md sm:rounded-lg transition-colors shrink-0"
              title="Redirect to Assembly Browser & view target member"
            >
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          {item.groupName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssign(item.id, undefined, undefined);
              }}
              className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-amber-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
              title="Ungroup target (move to ungrouped)"
            >
              <FolderMinus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-red-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
            title="Remove target"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

TargetCard.displayName = 'TargetCard';
