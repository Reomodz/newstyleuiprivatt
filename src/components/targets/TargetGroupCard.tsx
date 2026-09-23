import React from 'react';
import {
  GripVertical,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { TargetGroup } from '../../types';
import { AppThemeSettings } from '../../types/theme';

export interface TargetGroupCardProps {
  group: TargetGroup;
  isCollapsed: boolean;
  isBeingDragged: boolean;
  isReorderTarget: boolean;
  dragOverGroupPosition: 'before' | 'after' | null;
  isTargetDragOver: boolean;
  ungroupedTargetsCount: number;
  onToggleCollapse: () => void;
  onGroupDragStart: (e: React.DragEvent) => void;
  onGroupDragEnd: () => void;
  onGroupDragOver: (e: React.DragEvent) => void;
  onGroupDragLeave: (e: React.DragEvent) => void;
  onGroupDrop: (e: React.DragEvent) => void;
  onMakeSubgroup: () => void;
  onAddTargetsToGroup: () => void;
  onOpenAddNewTarget: () => void;
  onDeleteGroup: () => void;
  themeSettings?: AppThemeSettings;
  children: React.ReactNode;
}

export const TargetGroupCard: React.FC<TargetGroupCardProps> = ({
  group,
  isCollapsed,
  isBeingDragged,
  isReorderTarget,
  dragOverGroupPosition,
  isTargetDragOver,
  ungroupedTargetsCount,
  onToggleCollapse,
  onGroupDragStart,
  onGroupDragEnd,
  onGroupDragOver,
  onGroupDragLeave,
  onGroupDrop,
  onMakeSubgroup,
  onAddTargetsToGroup,
  onOpenAddNewTarget,
  onDeleteGroup,
  themeSettings,
  children,
}) => {
  const isNamedGroup = Boolean(group.groupName);
  const isCoreGroup = group.groupName === '. Core / GameFacade' || group.groupName?.startsWith('. Core');

  const isAtmosphereOn = themeSettings?.enableAtmosphere ?? true;
  const isTranslucent = isAtmosphereOn && Boolean(themeSettings?.customBgImage || (themeSettings?.cardOpacity && themeSettings.cardOpacity < 100));

  return (
    <div
      onDragOver={isCoreGroup ? undefined : onGroupDragOver}
      onDragLeave={isCoreGroup ? undefined : onGroupDragLeave}
      onDrop={isCoreGroup ? undefined : onGroupDrop}
      className={`target-group-card group/groupcard rounded-xl sm:rounded-2xl border transition-all ${
        isBeingDragged
          ? 'opacity-35 scale-[0.99] border-dashed border-purple-500/70 bg-purple-950/20'
          : isReorderTarget
          ? dragOverGroupPosition === 'before'
            ? 'border-t-2 border-t-purple-500 border-[#3A3A40] bg-[#1A1A1E] shadow-[0_-6px_20px_rgba(168,85,247,0.3)]'
            : 'border-b-2 border-b-purple-500 border-[#3A3A40] bg-[#1A1A1E] shadow-[0_6px_20px_rgba(168,85,247,0.3)]'
          : isTargetDragOver && !isCoreGroup
          ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
          : isTranslucent
          ? 'border-white/10 hover:border-white/20 shadow-lg'
          : 'border-[#2D2D30] bg-[#131316] hover:border-[#3A3A40]'
      } overflow-hidden p-2.5 sm:p-3.5 flex flex-col gap-2.5`}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Drag Handle to change group position */}
          <div
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              onGroupDragStart(e);
            }}
            onDragEnd={onGroupDragEnd}
            className="p-1 rounded-md text-[#6C6C70] hover:text-purple-400 hover:bg-[#222226] cursor-grab active:cursor-grabbing transition-colors shrink-0"
            title="Drag to change group position"
          >
            <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-2 text-left min-w-0 flex-1 hover:text-indigo-300 transition-colors group/gtitle ml-0.5"
          >
            <div className={`p-1 rounded-lg border shrink-0 ${
              isCoreGroup
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/25'
                : 'bg-[#202024] text-purple-400 border-[#2F2F35]'
            }`}>
              {isCollapsed ? <Folder className="w-3.5 h-3.5" /> : <FolderOpen className="w-3.5 h-3.5" />}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[#E2E2E4] group-hover/gtitle:text-indigo-200 truncate">
                {group.groupName ? group.groupName : 'Ungrouped Targets'}
              </span>
              {isCoreGroup && (
                <span className="text-[8px] sm:text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  il2cpp
                </span>
              )}
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#242428] text-[#8E8E93] border border-[#323238] shrink-0">
                {group.totalCount}
              </span>
            </div>
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-[#6C6C70]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#6C6C70]" />
            )}
          </button>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isNamedGroup ? (
            <>
              {/* Make Subgroup button - hidden for Core group */}
              {!isCoreGroup && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMakeSubgroup();
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold text-sky-300 hover:text-white bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 rounded-md transition-colors shrink-0 active:scale-95"
                  title={`Make a Subgroup inside ${group.groupName}`}
                >
                  <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-400" />
                  <span className="hidden sm:inline">Make Subgroup</span>
                  <span className="sm:hidden">Subgroup</span>
                </button>
              )}

              {/* Add Target Button: For Core Group, directly opens special IL2CPP Target modal */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCoreGroup) {
                    onOpenAddNewTarget();
                  } else {
                    onAddTargetsToGroup();
                  }
                }}
                className={`flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold rounded-md transition-colors shrink-0 active:scale-95 shadow-sm border ${
                  isCoreGroup
                    ? 'text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/35 border-purple-500/30 hover:border-purple-500/50'
                    : 'text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/35 border-indigo-500/30 hover:border-indigo-500/50'
                }`}
                title={isCoreGroup ? `Add new IL2CPP Target to ${group.groupName}` : `Add targets to ${group.groupName}`}
              >
                <Plus className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isCoreGroup ? 'text-purple-400' : 'text-indigo-400'}`} />
                <span>Target</span>
                {!isCoreGroup && ungroupedTargetsCount > 0 && (
                  <span className="text-[8px] font-mono px-0.5 rounded bg-indigo-500/25 text-indigo-300">
                    {ungroupedTargetsCount}
                  </span>
                )}
              </button>

              {/* Delete empty group button */}
              {group.totalCount === 0 && !isCoreGroup && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteGroup();
                  }}
                  className="p-1 text-[#8E8E93] hover:text-red-400 bg-[#202024] hover:bg-[#28282C] border border-[#2D2D32] rounded-md transition-colors shrink-0"
                  title="Delete empty group"
                >
                  <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              )}
            </>
          ) : (
            /* Ungrouped Targets: Add New Target */
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAddNewTarget();
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] sm:text-[10.5px] font-semibold text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-md transition-colors shrink-0"
              title="Add New Target to profile"
            >
              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Target</span>
            </button>
          )}
        </div>
      </div>

      {/* Group Items / Sub-groups */}
      {!isCollapsed && (
        <div className="flex flex-col gap-2.5">
          {group.totalCount === 0 && (
            <div className="p-3 text-center text-[#71717A] bg-[#121214]/60 rounded-xl border border-dashed border-[#28282C] text-[11px] flex flex-col items-center gap-0.5">
              <span>No targets in this group yet.</span>
              <span className="text-[10px] text-[#55555A]">Click Add Target above to select ungrouped targets.</span>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};
