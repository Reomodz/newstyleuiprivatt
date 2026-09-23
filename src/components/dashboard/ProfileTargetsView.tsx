import React, { useState } from 'react';
import {
  Pencil,
  Share2,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  Sliders,
  FolderPlus,
  X,
  Plus,
} from 'lucide-react';
import {
  WatchlistProfile,
  WatchlistTargetItem,
  TargetCardViewSettings,
  ProfileCardViewSettings,
} from '../../types';
import { AppThemeSettings } from '../../types/theme';
import { MakeGroupModal, MakeSubgroupModal, SelectTargetsModal } from '../modals';
import { TargetCard, TargetGroupCard, TargetSubgroupCard } from '../targets';
import { ConfirmDialog } from '../ui';
import { useGroupHierarchy } from '../../hooks/useGroupHierarchy';

interface ProfileTargetsViewProps {
  activeProfile: WatchlistProfile;
  setSelectedProfileViewId: (id: string | null) => void;
  handleOpenEditProfile: (prof: WatchlistProfile, e?: React.MouseEvent) => void;
  handleExportProfile: (prof: WatchlistProfile, e?: React.MouseEvent) => void;
  watchlistFilter: string;
  setWatchlistFilter: (filter: string) => void;
  setIsCardSettingsModalOpen: (open: boolean) => void;
  displayedItems: WatchlistTargetItem[];
  cardViewSettings: TargetCardViewSettings;
  profileCardSettings: ProfileCardViewSettings;
  setViewingTargetItem: (item: WatchlistTargetItem | null) => void;
  handleOpenEditTarget: (item: WatchlistTargetItem) => void;
  handleRemoveTargetItem: (id: string) => void;
  setIsAddTargetModalOpen: (open: boolean) => void;
  handleReorderTargets?: (profileId: string, items: WatchlistTargetItem[], groupOrder?: string[]) => void;
  handleOpenAddTargetToGroup?: (groupName?: string, subGroupName?: string) => void;
  showToast?: (msg: string) => void;
  onNavigateToBrowser?: (classIndex?: number, memberKind?: 'FIELD' | 'METHOD', memberName?: string) => void;
  isDumpLoaded?: boolean;
  themeSettings?: AppThemeSettings;
}

export const ProfileTargetsView: React.FC<ProfileTargetsViewProps> = ({
  activeProfile,
  setSelectedProfileViewId,
  handleOpenEditProfile,
  handleExportProfile,
  watchlistFilter,
  setWatchlistFilter,
  setIsCardSettingsModalOpen,
  displayedItems,
  cardViewSettings,
  profileCardSettings,
  setViewingTargetItem,
  handleOpenEditTarget,
  handleRemoveTargetItem,
  setIsAddTargetModalOpen,
  handleReorderTargets,
  handleOpenAddTargetToGroup,
  showToast,
  onNavigateToBrowser,
  isDumpLoaded = true,
  themeSettings,
}) => {
  const [expandActiveProfileDesc, setExpandActiveProfileDesc] = useState(false);
  const [isMakeGroupModalOpen, setIsMakeGroupModalOpen] = useState(false);
  const [makeSubgroupParentGroup, setMakeSubgroupParentGroup] = useState<string | null>(null);
  const [selectTargetsConfig, setSelectTargetsConfig] = useState<{ groupName: string; subGroupName?: string } | null>(null);
  const [targetToDelete, setTargetToDelete] = useState<WatchlistTargetItem | null>(null);

  const isAtmosphereOn = themeSettings?.enableAtmosphere ?? true;
  const isTranslucent = isAtmosphereOn && Boolean(themeSettings?.customBgImage || (themeSettings?.cardOpacity && themeSettings.cardOpacity < 100));

  const {
    collapsedGroups,
    toggleGroupCollapse,
    createdGroups,
    ungroupedTargets,
    allExistingGroupNames,
    getAvailableForSubgroup,
    groupedData,
    draggedItemId,
    dragOverTargetId,
    dragOverPosition,
    dragOverGroupKey,
    draggedGroupKey,
    dragOverGroupKeyForReorder,
    setDragOverGroupKeyForReorder,
    dragOverGroupPosition,
    setDragOverGroupPosition,
    handleDragStart,
    handleDragOverItem,
    handleDragLeaveItem,
    handleDropOnItem,
    handleDragOverGroup,
    handleDragLeaveGroup,
    handleDropOnGroup,
    handleMoveItem,
    handleGroupDragStart,
    handleGroupDragEnd,
    handleGroupDragOverForReorder,
    handleGroupDropForReorder,
    handleAssignTarget,
    handleBatchAssign,
    handleConfirmCreateGroup,
    handleConfirmCreateSubgroup,
    handleDeleteCreatedGroup,
    handleDeleteCreatedSubgroup,
  } = useGroupHierarchy({
    activeProfile,
    displayedItems,
    handleReorderTargets,
    showToast,
  });

  const onOpenAddTarget = (groupName?: string, subGroupName?: string) => {
    if (handleOpenAddTargetToGroup) {
      handleOpenAddTargetToGroup(groupName, subGroupName);
    } else {
      setIsAddTargetModalOpen(true);
    }
  };

  const renderCard = (
    item: WatchlistTargetItem,
    isFirstInGroup: boolean,
    isLastInGroup: boolean
  ) => {
    return (
      <TargetCard
        key={item.id}
        item={item}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
        cardViewSettings={cardViewSettings}
        isBeingDragged={draggedItemId === item.id}
        isDropTarget={dragOverTargetId === item.id}
        dragOverPosition={dragOverTargetId === item.id ? dragOverPosition : null}
        onDragStart={handleDragStart}
        onDragOver={handleDragOverItem}
        onDragLeave={handleDragLeaveItem}
        onDrop={handleDropOnItem}
        onView={setViewingTargetItem}
        onEdit={handleOpenEditTarget}
        onMove={handleMoveItem}
        onAssign={handleAssignTarget}
        onDelete={setTargetToDelete}
        onNavigateToBrowser={onNavigateToBrowser}
        isDumpLoaded={isDumpLoaded}
        themeSettings={themeSettings}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3.5 relative">
      {/* Top Navigation & Profile Header with Back Button */}
      <div
        className={`profile-header-card flex items-center justify-between gap-1.5 sm:gap-3 ${
          isTranslucent ? 'border-white/10 shadow-lg' : 'bg-[#1E1E20] border-[#2D2D30]'
        } border rounded-xl sm:rounded-2xl p-2.5 sm:p-3 pl-4 sm:pl-5 shadow-sm relative overflow-hidden transition-all`}
      >
        {/* Left Dynamic Accent Line */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px] transition-all"
          style={{
            background: 'linear-gradient(180deg, var(--app-accent-hex), rgba(var(--app-accent-rgb), 0.35))',
            boxShadow: '0 0 10px rgba(var(--app-accent-rgb), 0.5)',
          }}
        />

        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Back Button */}
          <button
            onClick={() => setSelectedProfileViewId(null)}
            className="p-1 sm:p-2 bg-[#262629]/80 hover:bg-[#323236] text-[#E2E2E4] rounded-lg border border-[#353538] transition-colors shrink-0 shadow-sm"
            title="Back to All Profiles"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-[#E2E2E4] truncate">
                {activeProfile.name}
              </span>
              <span
                className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 border"
                style={{
                  backgroundColor: 'rgba(var(--app-accent-rgb), 0.15)',
                  borderColor: 'rgba(var(--app-accent-rgb), 0.35)',
                  color: 'var(--app-accent-hex)',
                }}
              >
                {activeProfile.items.length || 0}
              </span>
            </div>
            {activeProfile.description && (
              <span
                onClick={() => setExpandActiveProfileDesc(!expandActiveProfileDesc)}
                className={`text-[10px] sm:text-xs text-[#8E8E93] cursor-pointer hover:text-[#C4C4C8] transition-colors ${
                  expandActiveProfileDesc || profileCardSettings.expandAllDescriptions
                    ? 'whitespace-normal break-words'
                    : 'truncate'
                }`}
                title="Click to view full description"
              >
                {activeProfile.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => handleOpenEditProfile(activeProfile)}
            className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-indigo-400 bg-[#262629]/80 hover:bg-[#323236] rounded-lg border border-[#353538] transition-colors"
            title="Edit Profile & Code Style"
          >
            <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={() => handleExportProfile(activeProfile)}
            className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-emerald-400 bg-[#262629]/80 hover:bg-[#323236] rounded-lg border border-[#353538] transition-colors"
            title="Export / Share Profile JSON"
          >
            <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Sticky Toolbar: Targets Search Filter, Make Group & Target Card Settings */}
      <div
        className={`profile-search-toolbar sticky top-0 z-20 -mx-1 px-1 sm:-mx-2 sm:px-2 py-2 ${
          isTranslucent ? 'border-white/10' : 'bg-[#18181A]/95 border-[#2D2D32]'
        } backdrop-blur-md border-b shadow-md flex items-center gap-1.5 sm:gap-2 transition-all rounded-b-xl`}
      >
        <div className="relative flex-1 min-w-0">
          <Search
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ color: 'var(--app-accent-hex, #6366f1)' }}
          />
          <input
            type="text"
            value={watchlistFilter}
            onChange={(e) => setWatchlistFilter(e.target.value)}
            placeholder="Search targets by member, class, group or offset..."
            className={`profile-search-input w-full pl-8 sm:pl-9 pr-8 py-1.5 sm:py-2 ${
              isTranslucent
                ? 'border focus:border-indigo-400 text-white placeholder-[#8E8E93]'
                : 'bg-[#1E1E20] border-[#2D2D30] focus:border-indigo-500 text-[#E2E2E4] placeholder-[#6C6C70]'
            } rounded-lg sm:rounded-xl text-xs focus:outline-none shadow-sm transition-colors`}
          />
          {watchlistFilter && (
            <button
              type="button"
              onClick={() => setWatchlistFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white p-0.5 rounded-full z-10"
              title="Clear search filter"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMakeGroupModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-500/50 rounded-lg sm:rounded-xl text-xs font-semibold transition-all shadow-sm shrink-0 active:scale-95"
          title="Make New Group"
        >
          <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
          <span className="hidden sm:inline">Make Group</span>
        </button>

        <button
          onClick={() => setIsCardSettingsModalOpen(true)}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 bg-[#1E1E20]/80 hover:bg-[#26262A] text-[#8E8E93] hover:text-white border border-[#2D2D30] hover:border-indigo-500/40 rounded-lg sm:rounded-xl text-xs font-semibold transition-colors shadow-sm shrink-0"
          title="Card Display Options & Grouping Toggle"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Options</span>
        </button>
      </div>

      {/* Targets List / Group Hierarchy */}
      {displayedItems.length === 0 && createdGroups.length === 0 ? (
        <div className="p-6 text-center text-[#8E8E93] flex flex-col items-center justify-center gap-1.5 bg-[#1E1E20] rounded-xl border border-[#2D2D30] mt-1">
          <Sliders className="w-8 h-8 text-[#55555A]" />
          <p className="text-xs font-medium mt-1">No targets match your filter.</p>
          <p className="text-[10px] text-[#6C6C70] max-w-[220px]">
            Tap Make Group to organize, or use the + button to add new targets.
          </p>
        </div>
      ) : cardViewSettings.showGroups !== false ? (
        /* GROUPED HIERARCHICAL VIEW */
        <div className="flex flex-col gap-3">
          {groupedData.map((group) => {
            const gKey = group.groupName || '__ungrouped__';
            const isCollapsed = Boolean(collapsedGroups[gKey]);
            const isTargetDragOver = dragOverGroupKey === `group-${gKey}`;
            const isBeingDragged = draggedGroupKey === gKey;
            const isReorderTarget = dragOverGroupKeyForReorder === gKey;

            return (
              <TargetGroupCard
                key={gKey}
                group={group}
                isCollapsed={isCollapsed}
                isBeingDragged={isBeingDragged}
                isReorderTarget={isReorderTarget}
                dragOverGroupPosition={dragOverGroupPosition}
                isTargetDragOver={isTargetDragOver}
                ungroupedTargetsCount={ungroupedTargets.length}
                onToggleCollapse={() => toggleGroupCollapse(group.groupName)}
                onGroupDragStart={(e) => handleGroupDragStart(e, gKey)}
                onGroupDragEnd={handleGroupDragEnd}
                onGroupDragOver={(e) => {
                  if (draggedGroupKey) {
                    handleGroupDragOverForReorder(e, gKey);
                  } else if (draggedItemId) {
                    handleDragOverGroup(e, `group-${gKey}`);
                  }
                }}
                onGroupDragLeave={(e) => {
                  if (draggedGroupKey) {
                    if (dragOverGroupKeyForReorder === gKey) {
                      setDragOverGroupKeyForReorder(null);
                      setDragOverGroupPosition(null);
                    }
                  } else {
                    handleDragLeaveGroup(e, `group-${gKey}`);
                  }
                }}
                onGroupDrop={(e) => {
                  if (draggedGroupKey) {
                    handleGroupDropForReorder(e, gKey);
                  } else {
                    handleDropOnGroup(e, group.groupName, null);
                  }
                }}
                onMakeSubgroup={() => setMakeSubgroupParentGroup(group.groupName)}
                onAddTargetsToGroup={() => setSelectTargetsConfig({ groupName: group.groupName! })}
                onOpenAddNewTarget={() => onOpenAddTarget(group.groupName || undefined, undefined)}
                onDeleteGroup={() => handleDeleteCreatedGroup(group.groupName!)}
                themeSettings={themeSettings}
              >
                {group.subGroups.map((subGroup) => {
                  const subGKey = `${gKey}-${subGroup.subGroupName || '__direct__'}`;
                  const isSubGroupDragOver = dragOverGroupKey === `subgroup-${subGKey}`;
                  const availableForThisSubGroup =
                    group.groupName && subGroup.subGroupName
                      ? getAvailableForSubgroup(group.groupName, subGroup.subGroupName)
                      : [];

                  return (
                    <TargetSubgroupCard
                      key={subGKey}
                      parentGroupName={group.groupName || ''}
                      subGroupName={subGroup.subGroupName}
                      items={subGroup.items}
                      availableCount={availableForThisSubGroup.length}
                      isDragOver={isSubGroupDragOver}
                      tabletLayout={cardViewSettings.tabletLayout}
                      onDragOver={(e) => handleDragOverGroup(e, `subgroup-${subGKey}`)}
                      onDragLeave={(e) => handleDragLeaveGroup(e, `subgroup-${subGKey}`)}
                      onDrop={(e) => handleDropOnGroup(e, group.groupName, subGroup.subGroupName)}
                      onAddTargets={() =>
                        setSelectTargetsConfig({
                          groupName: group.groupName!,
                          subGroupName: subGroup.subGroupName!,
                        })
                      }
                      onDeleteSubgroup={() =>
                        handleDeleteCreatedSubgroup(group.groupName!, subGroup.subGroupName!)
                      }
                      themeSettings={themeSettings}
                      renderCard={renderCard}
                    />
                  );
                })}
              </TargetGroupCard>
            );
          })}
        </div>
      ) : (
        /* FLAT LIST VIEW (When showGroups toggle is OFF) */
        <div
          className={`grid grid-cols-1 ${
            cardViewSettings.tabletLayout === 'list'
              ? 'md:grid-cols-1'
              : 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
          } gap-2 sm:gap-3`}
        >
          {displayedItems.map((item, idx) =>
            renderCard(item, idx === 0, idx === displayedItems.length - 1)
          )}
        </div>
      )}

      {/* Floating Corner Add Button (Fixed position across all screen sizes and tabs) */}
      <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 pb-[env(safe-area-inset-bottom,0px)]">
        <button
          onClick={() => onOpenAddTarget(undefined, undefined)}
          className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/50 hover:shadow-indigo-600/60 transition-all hover:scale-105 active:scale-95 border border-indigo-400/40 cursor-pointer"
          title="Add Target"
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* Group & Subgroup Management Modals */}
      <MakeGroupModal
        isOpen={isMakeGroupModalOpen}
        onClose={() => setIsMakeGroupModalOpen(false)}
        ungroupedTargets={ungroupedTargets}
        existingGroupNames={allExistingGroupNames}
        onConfirmCreateGroup={handleConfirmCreateGroup}
      />

      <MakeSubgroupModal
        isOpen={Boolean(makeSubgroupParentGroup)}
        onClose={() => setMakeSubgroupParentGroup(null)}
        parentGroupName={makeSubgroupParentGroup || ''}
        existingSubGroupNames={
          makeSubgroupParentGroup
            ? (groupedData
                .find((g) => g.groupName === makeSubgroupParentGroup)
                ?.subGroups.map((s) => s.subGroupName)
                .filter(Boolean) as string[]) || []
            : []
        }
        availableTargets={
          makeSubgroupParentGroup ? getAvailableForSubgroup(makeSubgroupParentGroup, '') : []
        }
        onConfirmCreateSubgroup={handleConfirmCreateSubgroup}
      />

      {selectTargetsConfig && (
        <SelectTargetsModal
          isOpen={Boolean(selectTargetsConfig)}
          onClose={() => setSelectTargetsConfig(null)}
          destinationGroupName={selectTargetsConfig.groupName}
          destinationSubGroupName={selectTargetsConfig.subGroupName}
          availableTargets={
            selectTargetsConfig.subGroupName
              ? getAvailableForSubgroup(
                  selectTargetsConfig.groupName,
                  selectTargetsConfig.subGroupName
                )
              : ungroupedTargets
          }
          onConfirmAssign={(selectedIds: string[]) => {
            handleBatchAssign(
              selectedIds,
              selectTargetsConfig.groupName,
              selectTargetsConfig.subGroupName
            );
          }}
        />
      )}

      {/* Target Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(targetToDelete)}
        title="Remove Target"
        description={`Are you sure you want to remove "${targetToDelete?.customName || `${targetToDelete?.className || ''}.${targetToDelete?.memberName || ''}`}" from profile "${activeProfile.name}"?`}
        confirmText="Remove"
        variant="danger"
        onConfirm={() => {
          if (targetToDelete) {
            handleRemoveTargetItem(targetToDelete.id);
            setTargetToDelete(null);
          }
        }}
        onClose={() => setTargetToDelete(null)}
      />
    </div>
  );
};
