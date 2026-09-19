import React, { useState, useMemo, RefObject } from 'react';
import {
  Layers, Upload, Plus, Pencil, Share2, Trash2, ChevronRight, ChevronLeft,
  Search, SlidersHorizontal, Sliders, FolderPlus, X
} from 'lucide-react';
import {
  WatchlistProfile,
  WatchlistTargetItem,
  TargetCardViewSettings,
  ProfileCardViewSettings,
  TargetGroup,
  TargetSubGroup
} from '../../types';
import { MakeGroupModal, MakeSubgroupModal, SelectTargetsModal } from '../modals';
import { TargetCard, TargetGroupCard, TargetSubgroupCard } from '../targets';
import { ConfirmDialog } from '../ui';

interface ProfileSidebarProps {
  profiles: WatchlistProfile[];
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  selectedProfileViewId: string | null;
  setSelectedProfileViewId: (id: string | null) => void;
  profileImportInputRef: RefObject<HTMLInputElement>;
  handleImportProfile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsNewProfileModalOpen: (open: boolean) => void;
  handleOpenEditProfile: (prof: WatchlistProfile, e?: React.MouseEvent) => void;
  handleExportProfile: (prof: WatchlistProfile, e?: React.MouseEvent) => void;
  handleDeleteProfile: (id: string, e: React.MouseEvent) => void;
  activeProfile: WatchlistProfile | undefined;
  watchlistFilter: string;
  setWatchlistFilter: (filter: string) => void;
  setIsCardSettingsModalOpen: (open: boolean) => void;
  displayedItems: WatchlistTargetItem[];
  cardViewSettings: TargetCardViewSettings;
  profileCardSettings: ProfileCardViewSettings;
  setIsProfileCardSettingsModalOpen: (open: boolean) => void;
  setViewingTargetItem: (item: WatchlistTargetItem | null) => void;
  handleOpenEditTarget: (item: WatchlistTargetItem) => void;
  handleRemoveTargetItem: (id: string) => void;
  setIsAddTargetModalOpen: (open: boolean) => void;
  handleReorderTargets?: (profileId: string, items: WatchlistTargetItem[], groupOrder?: string[]) => void;
  handleOpenAddTargetToGroup?: (groupName?: string, subGroupName?: string) => void;
  showToast?: (msg: string) => void;
  onNavigateToBrowser?: (classIndex?: number, memberKind?: 'FIELD' | 'METHOD', memberName?: string) => void;
  isDumpLoaded?: boolean;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = React.memo(({
  profiles,
  activeProfileId,
  setActiveProfileId,
  selectedProfileViewId,
  setSelectedProfileViewId,
  profileImportInputRef,
  handleImportProfile,
  setIsNewProfileModalOpen,
  handleOpenEditProfile,
  handleExportProfile,
  handleDeleteProfile,
  activeProfile,
  watchlistFilter,
  setWatchlistFilter,
  setIsCardSettingsModalOpen,
  displayedItems,
  cardViewSettings,
  profileCardSettings,
  setIsProfileCardSettingsModalOpen,
  setViewingTargetItem,
  handleOpenEditTarget,
  handleRemoveTargetItem,
  setIsAddTargetModalOpen,
  handleReorderTargets,
  handleOpenAddTargetToGroup,
  showToast,
  onNavigateToBrowser,
  isDumpLoaded = true,
}) => {
  const onOpenAddTarget = (groupName?: string, subGroupName?: string) => {
    if (handleOpenAddTargetToGroup) {
      handleOpenAddTargetToGroup(groupName, subGroupName);
    } else {
      setIsAddTargetModalOpen(true);
    }
  };

  // Collapsed group sections state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Group creation & selection state
  const [createdGroups, setCreatedGroups] = useState<{ groupName: string; subGroups: string[] }[]>([]);
  const [isMakeGroupModalOpen, setIsMakeGroupModalOpen] = useState(false);
  const [makeSubgroupParentGroup, setMakeSubgroupParentGroup] = useState<string | null>(null);
  const [selectTargetsConfig, setSelectTargetsConfig] = useState<{ groupName: string; subGroupName?: string } | null>(null);

  // List of ungrouped targets in the active profile
  const ungroupedTargets = useMemo(() => {
    if (!activeProfile) return [];
    return activeProfile.items.filter((it) => !it.groupName?.trim());
  }, [activeProfile]);

  // All known group names across items and custom created groups
  const allExistingGroupNames = useMemo(() => {
    const set = new Set<string>();
    if (activeProfile) {
      activeProfile.items.forEach((it) => {
        if (it.groupName?.trim()) set.add(it.groupName.trim());
      });
    }
    createdGroups.forEach((cg) => set.add(cg.groupName));
    return Array.from(set);
  }, [activeProfile, createdGroups]);

  // Helper to get available targets for a subgroup (ungrouped targets + targets in parent group not in this subgroup)
  const getAvailableForSubgroup = (groupName: string, subGroupName: string) => {
    if (!activeProfile) return [];
    return activeProfile.items.filter((it) => {
      if (!it.groupName?.trim()) return true;
      if (it.groupName.trim() === groupName && it.subGroupName?.trim() !== subGroupName) return true;
      return false;
    });
  };

  // Assign a single target to a group / subgroup
  const handleAssignTarget = (targetId: string, groupName?: string, subGroupName?: string) => {
    if (!activeProfile || !handleReorderTargets) return;
    const updated = activeProfile.items.map((it) => {
      if (it.id !== targetId) return it;
      return {
        ...it,
        groupName: groupName || undefined,
        subGroupName: subGroupName || undefined,
      };
    });
    handleReorderTargets(activeProfile.id, updated);
  };

  // Assign multiple targets in batch
  const handleBatchAssign = (targetIds: string[], groupName: string, subGroupName?: string) => {
    if (!activeProfile || !handleReorderTargets) return;
    const idSet = new Set(targetIds);
    const updated = activeProfile.items.map((it) => {
      if (!idSet.has(it.id)) return it;
      return {
        ...it,
        groupName,
        subGroupName: subGroupName || undefined,
      };
    });
    handleReorderTargets(activeProfile.id, updated);
  };

  // Confirm creation of a new group
  const handleConfirmCreateGroup = (groupName: string, selectedTargetIds: string[]) => {
    setCreatedGroups((prev) => {
      if (prev.some((g) => g.groupName.toLowerCase() === groupName.toLowerCase())) return prev;
      return [...prev, { groupName, subGroups: [] }];
    });

    if (selectedTargetIds.length > 0 && activeProfile && handleReorderTargets) {
      handleBatchAssign(selectedTargetIds, groupName, undefined);
    }
  };

  // Confirm creation of a new subgroup
  const handleConfirmCreateSubgroup = (parentGroupName: string, subGroupName: string, selectedTargetIds: string[]) => {
    setCreatedGroups((prev) => {
      const existing = prev.find((g) => g.groupName.toLowerCase() === parentGroupName.toLowerCase());
      if (existing) {
        if (existing.subGroups.includes(subGroupName)) return prev;
        return prev.map((g) =>
          g.groupName.toLowerCase() === parentGroupName.toLowerCase()
            ? { ...g, subGroups: [...g.subGroups, subGroupName] }
            : g
        );
      } else {
        return [...prev, { groupName: parentGroupName, subGroups: [subGroupName] }];
      }
    });

    if (selectedTargetIds.length > 0 && activeProfile && handleReorderTargets) {
      handleBatchAssign(selectedTargetIds, parentGroupName, subGroupName);
    }
  };

  // Delete empty created group
  const handleDeleteCreatedGroup = (groupName: string) => {
    setCreatedGroups((prev) => prev.filter((g) => g.groupName !== groupName));
  };

  // Delete empty created subgroup
  const handleDeleteCreatedSubgroup = (parentGroupName: string, subGroupName: string) => {
    setCreatedGroups((prev) =>
      prev.map((g) =>
        g.groupName === parentGroupName
          ? { ...g, subGroups: g.subGroups.filter((sg) => sg !== subGroupName) }
          : g
      )
    );
  };

  const toggleGroupCollapse = (groupName: string | null) => {
    const key = groupName || '__ungrouped__';
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Target Drag and Drop States
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [dragOverGroupKey, setDragOverGroupKey] = useState<string | null>(null);

  // Group Drag and Drop States
  const [draggedGroupKey, setDraggedGroupKey] = useState<string | null>(null);
  const [dragOverGroupKeyForReorder, setDragOverGroupKeyForReorder] = useState<string | null>(null);
  const [dragOverGroupPosition, setDragOverGroupPosition] = useState<'before' | 'after' | null>(null);
  const [targetToDelete, setTargetToDelete] = useState<WatchlistTargetItem | null>(null);

  const handleDragStart = (e: React.DragEvent, item: WatchlistTargetItem) => {
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(item.id);
  };

  const handleDragOverItem = (e: React.DragEvent, targetItem: WatchlistTargetItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItemId || draggedItemId === targetItem.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'before' : 'after';

    setDragOverTargetId(targetItem.id);
    setDragOverPosition(pos);
    setDragOverGroupKey(null);
  };

  const handleDragLeaveItem = (_e: React.DragEvent, targetItem: WatchlistTargetItem) => {
    if (dragOverTargetId === targetItem.id) {
      setDragOverTargetId(null);
      setDragOverPosition(null);
    }
  };

  const handleDropOnItem = (e: React.DragEvent, targetItem: WatchlistTargetItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeProfile || !draggedItemId || draggedItemId === targetItem.id) {
      setDraggedItemId(null);
      setDragOverTargetId(null);
      setDragOverPosition(null);
      return;
    }

    const allItems = [...activeProfile.items];
    const draggedIndex = allItems.findIndex((it) => it.id === draggedItemId);
    if (draggedIndex === -1) return;

    const [draggedItem] = allItems.splice(draggedIndex, 1);

    // Adopt the group & subgroup of the target item so it integrates into that section
    const updatedDraggedItem: WatchlistTargetItem = {
      ...draggedItem,
      groupName: targetItem.groupName,
      subGroupName: targetItem.subGroupName,
    };

    const targetIndex = allItems.findIndex((it) => it.id === targetItem.id);
    const insertIndex = dragOverPosition === 'after' ? targetIndex + 1 : targetIndex;

    allItems.splice(insertIndex, 0, updatedDraggedItem);

    if (handleReorderTargets) {
      handleReorderTargets(activeProfile.id, allItems);
    }

    setDraggedItemId(null);
    setDragOverTargetId(null);
    setDragOverPosition(null);
    setDragOverGroupKey(null);
  };

  const handleDragOverGroup = (e: React.DragEvent, groupKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverGroupKey(groupKey);
  };

  const handleDragLeaveGroup = (_e: React.DragEvent, groupKey: string) => {
    if (dragOverGroupKey === groupKey) {
      setDragOverGroupKey(null);
    }
  };

  const handleDropOnGroup = (
    e: React.DragEvent,
    targetGroupName: string | null,
    targetSubGroupName: string | null
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeProfile || !draggedItemId) {
      setDraggedItemId(null);
      setDragOverGroupKey(null);
      return;
    }

    const allItems = [...activeProfile.items];
    const draggedIndex = allItems.findIndex((it) => it.id === draggedItemId);
    if (draggedIndex === -1) return;

    const [draggedItem] = allItems.splice(draggedIndex, 1);

    const updatedDraggedItem: WatchlistTargetItem = {
      ...draggedItem,
      groupName: targetGroupName || undefined,
      subGroupName: targetSubGroupName || undefined,
    };

    // Find the last item in this group/subgroup to place it at the end of that group
    let insertIndex = allItems.length;
    for (let i = allItems.length - 1; i >= 0; i--) {
      const it = allItems[i];
      const itG = it.groupName?.trim() || null;
      const itSubG = it.subGroupName?.trim() || null;
      if (itG === targetGroupName && (targetSubGroupName === null || itSubG === targetSubGroupName)) {
        insertIndex = i + 1;
        break;
      }
    }

    allItems.splice(insertIndex, 0, updatedDraggedItem);

    if (handleReorderTargets) {
      handleReorderTargets(activeProfile.id, allItems);
    }

    setDraggedItemId(null);
    setDragOverTargetId(null);
    setDragOverPosition(null);
    setDragOverGroupKey(null);
  };

  // Quick Move Up / Down button handler
  const handleMoveItem = (itemId: string, direction: 'up' | 'down') => {
    if (!activeProfile || !handleReorderTargets) return;
    const allItems = [...activeProfile.items];
    const idx = allItems.findIndex((i) => i.id === itemId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= allItems.length) return;

    const temp = allItems[idx];
    allItems[idx] = allItems[targetIdx];
    allItems[targetIdx] = temp;

    handleReorderTargets(activeProfile.id, allItems);
  };

  // Group Drag Reorder Handlers
  const handleGroupDragStart = (e: React.DragEvent, groupKey: string) => {
    e.dataTransfer.setData('text/plain', `group:${groupKey}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedGroupKey(groupKey);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupKey(null);
    setDragOverGroupKeyForReorder(null);
    setDragOverGroupPosition(null);
  };

  const handleGroupDragOverForReorder = (e: React.DragEvent, targetGroupKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedGroupKey || draggedGroupKey === targetGroupKey) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'before' : 'after';

    setDragOverGroupKeyForReorder(targetGroupKey);
    setDragOverGroupPosition(pos);
  };

  const applyNewGroupOrder = (newGroupKeys: string[]) => {
    if (!activeProfile || !handleReorderTargets) return;

    // Reorder activeProfile.items to reflect the new group order
    const allItems = [...activeProfile.items];
    const itemsByGroup = new Map<string, WatchlistTargetItem[]>();

    newGroupKeys.forEach((key) => {
      itemsByGroup.set(key, []);
    });
    if (!itemsByGroup.has('__ungrouped__')) {
      itemsByGroup.set('__ungrouped__', []);
    }

    allItems.forEach((it) => {
      const key = it.groupName?.trim() || '__ungrouped__';
      if (!itemsByGroup.has(key)) {
        itemsByGroup.set(key, []);
      }
      itemsByGroup.get(key)!.push(it);
    });

    const reorderedItems: WatchlistTargetItem[] = [];
    newGroupKeys.forEach((key) => {
      const list = itemsByGroup.get(key);
      if (list) {
        reorderedItems.push(...list);
        itemsByGroup.delete(key);
      }
    });

    // Any remaining items (if any group wasn't in newGroupKeys)
    itemsByGroup.forEach((list) => {
      reorderedItems.push(...list);
    });

    // Also reorder createdGroups to preserve the user's custom group list order
    setCreatedGroups((prev) => {
      return [...prev].sort((a, b) => {
        const idxA = newGroupKeys.indexOf(a.groupName);
        const idxB = newGroupKeys.indexOf(b.groupName);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
    });

    handleReorderTargets(activeProfile.id, reorderedItems, newGroupKeys);
    if (showToast) {
      showToast('Group position updated');
    }
  };

  const handleGroupDropForReorder = (e: React.DragEvent, targetGroupKey: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedGroupKey || draggedGroupKey === targetGroupKey) {
      handleGroupDragEnd();
      return;
    }

    const currentGroupKeys = groupedData.map((g) => g.groupName || '__ungrouped__');
    const draggedIdx = currentGroupKeys.indexOf(draggedGroupKey);
    const targetIdx = currentGroupKeys.indexOf(targetGroupKey);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const updated = [...currentGroupKeys];
      const [removed] = updated.splice(draggedIdx, 1);
      const newTargetIdx = updated.indexOf(targetGroupKey);
      const insertIdx = dragOverGroupPosition === 'after' ? newTargetIdx + 1 : newTargetIdx;
      updated.splice(insertIdx, 0, removed);

      applyNewGroupOrder(updated);
    }

    handleGroupDragEnd();
  };

  // Grouped Targets Calculation
  const groupedData = useMemo<TargetGroup[]>(() => {
    const groupMap = new Map<string | null, Map<string | null, WatchlistTargetItem[]>>();

    // Seed created groups and subgroups so empty groups/subgroups appear
    createdGroups.forEach((cg) => {
      if (!groupMap.has(cg.groupName)) {
        groupMap.set(cg.groupName, new Map());
      }
      const subMap = groupMap.get(cg.groupName)!;
      if (!subMap.has(null)) {
        subMap.set(null, []);
      }
      cg.subGroups.forEach((sg) => {
        if (!subMap.has(sg)) {
          subMap.set(sg, []);
        }
      });
    });

    displayedItems.forEach((item) => {
      const gName = item.groupName?.trim() || null;
      const subGName = item.subGroupName?.trim() || null;

      if (!groupMap.has(gName)) {
        groupMap.set(gName, new Map());
      }
      const subMap = groupMap.get(gName)!;
      if (!subMap.has(subGName)) {
        subMap.set(subGName, []);
      }
      subMap.get(subGName)!.push(item);
    });

    const result: TargetGroup[] = [];
    const groupKeys = Array.from(groupMap.keys());
    const orderList = activeProfile?.groupOrder || [];
    const orderIndexMap = new Map<string, number>();
    orderList.forEach((key, idx) => {
      orderIndexMap.set(key, idx);
    });

    const sortedGroupKeys = [...groupKeys].sort((a, b) => {
      const keyA = a || '__ungrouped__';
      const keyB = b || '__ungrouped__';
      const idxA = orderIndexMap.has(keyA) ? orderIndexMap.get(keyA)! : 9999;
      const idxB = orderIndexMap.has(keyB) ? orderIndexMap.get(keyB)! : 9999;
      if (idxA !== idxB) return idxA - idxB;
      if (a === null) return 1;
      if (b === null) return -1;
      return 0;
    });

    for (const gName of sortedGroupKeys) {
      const subMap = groupMap.get(gName)!;
      const subGroups: TargetSubGroup[] = [];
      let count = 0;

      const subKeys = Array.from(subMap.keys());
      const directKeys = subKeys.filter((k) => k === null);
      const namedSubKeys = subKeys.filter((k) => k !== null);

      for (const subGName of [...directKeys, ...namedSubKeys]) {
        const items = subMap.get(subGName)!;
        subGroups.push({ subGroupName: subGName, items });
        count += items.length;
      }

      result.push({
        groupName: gName,
        subGroups,
        totalCount: count,
      });
    }

    return result;
  }, [displayedItems, createdGroups, activeProfile?.groupOrder]);

  // Card Renderer
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
      />
    );
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Hidden file input for importing profile JSON */}
      <input
        type="file"
        ref={profileImportInputRef}
        onChange={handleImportProfile}
        accept=".json,application/json"
        className="hidden"
      />

      {/* VIEW 1: PROFILES OVERVIEW (When no specific profile is opened) */}
      {selectedProfileViewId === null ? (
        <div className="flex flex-col gap-2.5 sm:gap-4">
          {/* Top Bar: Title, Import, Options & Create Profile Button */}
          <div className="flex items-center justify-between gap-2 bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="p-1 sm:p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[#E2E2E4] truncate">Profiles</span>
                <span className="text-[10px] sm:text-xs font-mono px-1.5 py-0.2 rounded bg-[#262629] text-[#8E8E93] border border-[#353538] shrink-0">
                  {profiles.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setIsProfileCardSettingsModalOpen(true)}
                className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-[#262629] hover:bg-[#323236] text-[#A0A0A5] hover:text-white border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-colors shadow-sm"
                title="Profile Card Settings"
              >
                <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 shrink-0" />
                <span className="hidden xs:inline sm:inline">Options</span>
              </button>

              <button
                onClick={() => profileImportInputRef.current?.click()}
                className="flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-[#262629] hover:bg-[#323236] text-[#A0A0A5] hover:text-white border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-colors shadow-sm"
                title="Import Profile JSON"
              >
                <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>Import</span>
              </button>

              <button
                onClick={() => setIsNewProfileModalOpen(true)}
                className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                title="Create New Profile"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Profiles Cards List */}
          <div
            className={`grid grid-cols-1 ${
              profileCardSettings.tabletLayout === 'grid' ? 'md:grid-cols-2' : 'md:grid-cols-1'
            } gap-2 sm:gap-3`}
          >
            {profiles.map((prof) => {
              const isScanActive = prof.id === activeProfileId;
              const isCompact = profileCardSettings.density === 'compact';
              const showFooter = profileCardSettings.showTargetCount || profileCardSettings.showTargetChips || profileCardSettings.showOpenIndicator;

              return (
                <div
                  key={prof.id}
                  onClick={() => {
                    setActiveProfileId(prof.id);
                    setSelectedProfileViewId(prof.id);
                  }}
                  className={`bg-[#1E1E20] hover:bg-[#242428] border ${
                    isScanActive ? 'border-blue-500/50 shadow-md shadow-blue-500/5' : 'border-[#2D2D30] hover:border-blue-500/40'
                  } ${
                    isCompact ? 'p-2.5 sm:p-3 pl-3.5 sm:pl-4 gap-1.5' : 'p-3 sm:p-3.5 pl-4 sm:pl-5 gap-2'
                  } rounded-xl sm:rounded-2xl shadow-sm flex flex-col cursor-pointer transition-all active:scale-[0.99] group/pcard relative overflow-hidden`}
                >
                  {/* Profile Identity Blue Line Accent on Left Side */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${
                      isScanActive
                        ? 'w-[2px] bg-gradient-to-b from-blue-400 via-sky-400 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                        : 'w-[1px] bg-gradient-to-b from-blue-500/80 to-indigo-500/60 group-hover/pcard:w-[2px] group-hover/pcard:from-blue-400 group-hover/pcard:to-sky-400'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#E2E2E4] group-hover/pcard:text-blue-300 transition-colors truncate">
                          {prof.name}
                        </span>
                        {profileCardSettings.showActiveBadge && isScanActive && (
                          <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 font-semibold shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      {profileCardSettings.showDescription && prof.description && (
                        <p className="text-[10px] sm:text-xs text-[#8E8E93] line-clamp-1">{prof.description}</p>
                      )}
                    </div>

                    {/* Profile Action Logos: Edit Name, Share/Export, Delete */}
                    {profileCardSettings.showActionButtons && (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenEditProfile(prof, e)}
                          className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-blue-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
                          title="Edit Profile Name"
                        >
                          <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleExportProfile(prof, e)}
                          className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-emerald-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
                          title="Export / Share Profile JSON"
                        >
                          <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>

                        {profiles.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteProfile(prof.id, e)}
                            className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-red-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Target preview chips & summary footer */}
                  {showFooter && (
                    <div className="pt-1.5 border-t border-[#28282B] flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1 flex-wrap font-mono text-[9px] sm:text-[10px]">
                        {profileCardSettings.showTargetCount && (
                          <span className="text-[9px] sm:text-[10px] font-sans px-1.5 py-0.2 rounded bg-[#141416] text-[#A0A0A5] border border-[#353538]">
                            {prof.items.length} Targets
                          </span>
                        )}
                        {profileCardSettings.showTargetChips && (
                          <>
                            {prof.items.slice(0, 3).map((it) => (
                              <span
                                key={it.id}
                                className="px-1.5 py-0.2 rounded bg-[#141416] text-[#8E8E93] border border-[#2B2B2E] truncate max-w-[110px]"
                              >
                                {it.memberName}
                              </span>
                            ))}
                            {prof.items.length > 3 && (
                              <span className="text-[9px] text-[#6C6C70]">+{prof.items.length - 3}</span>
                            )}
                          </>
                        )}
                      </div>

                      {profileCardSettings.showOpenIndicator && (
                        <div className="flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold text-blue-400 group-hover/pcard:text-blue-300 ml-auto">
                          <span>Open</span>
                          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/pcard:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: PROFILE TARGETS VIEW (Inside selected profile) */
        <div className="flex flex-col gap-2.5 sm:gap-3.5 relative">
          {/* Top Navigation & Profile Header with Back Button */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-3 bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 pl-4 sm:pl-5 shadow-sm relative overflow-hidden">
            {/* Left Blue Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-400 via-sky-400 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {/* Back Button */}
              <button
                onClick={() => setSelectedProfileViewId(null)}
                className="p-1 sm:p-2 bg-[#262629] hover:bg-[#323236] text-[#E2E2E4] rounded-lg border border-[#353538] transition-colors shrink-0 shadow-sm"
                title="Back to All Profiles"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-[#E2E2E4] truncate">
                    {activeProfile?.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                    {activeProfile?.items.length || 0}
                  </span>
                </div>
                {activeProfile?.description && (
                  <span className="text-[10px] sm:text-xs text-[#8E8E93] truncate">
                    {activeProfile.description}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenEditProfile(activeProfile!)}
                className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-indigo-400 bg-[#262629] hover:bg-[#323236] rounded-lg border border-[#353538] transition-colors"
                title="Edit Profile & Code Style"
              >
                <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>

              <button
                onClick={() => handleExportProfile(activeProfile!)}
                className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-emerald-400 bg-[#262629] hover:bg-[#323236] rounded-lg border border-[#353538] transition-colors"
                title="Export / Share Profile JSON"
              >
                <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Sticky Toolbar: Targets Search Filter, Make Group & Target Card Settings */}
          <div className="sticky top-0 z-20 -mx-1 px-1 sm:-mx-2 sm:px-2 py-2 bg-[#18181A]/95 backdrop-blur-md border-b border-[#2D2D32] shadow-md flex items-center gap-1.5 sm:gap-2 transition-all rounded-b-xl">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="text"
                value={watchlistFilter}
                onChange={(e) => setWatchlistFilter(e.target.value)}
                placeholder="Search targets..."
                className="w-full pl-8 pr-8 py-1.5 sm:py-2 bg-[#1E1E20] border border-[#2D2D30] rounded-lg sm:rounded-xl text-xs text-[#E2E2E4] placeholder-[#6C6C70] focus:outline-none focus:border-indigo-500 shadow-sm"
              />
              {watchlistFilter && (
                <button
                  type="button"
                  onClick={() => setWatchlistFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white p-0.5 rounded-full"
                  title="Clear search filter"
                >
                  <X className="w-3 h-3" />
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
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 bg-[#1E1E20] hover:bg-[#26262A] text-[#8E8E93] hover:text-white border border-[#2D2D30] hover:border-indigo-500/40 rounded-lg sm:rounded-xl text-xs font-semibold transition-colors shadow-sm shrink-0"
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
                Tap Make Group to organize, or add new targets to this profile.
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
                    onOpenAddNewTarget={() => onOpenAddTarget(undefined, undefined)}
                    onDeleteGroup={() => handleDeleteCreatedGroup(group.groupName!)}
                  >
                    {group.subGroups.map((subGroup) => {
                      const subGKey = `${gKey}-${subGroup.subGroupName || '__direct__'}`;
                      const isSubGroupDragOver = dragOverGroupKey === `subgroup-${subGKey}`;
                      const availableForThisSubGroup = group.groupName && subGroup.subGroupName
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
            <div className={`grid grid-cols-1 ${cardViewSettings.tabletLayout === 'list' ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'} gap-2 sm:gap-3`}>
              {displayedItems.map((item, idx) =>
                renderCard(item, idx === 0, idx === displayedItems.length - 1)
              )}
            </div>
          )}

          {/* FLOATING ACTION BUTTON (Profile Targets View Only) */}
          <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 md:absolute md:bottom-auto md:-bottom-20 md:right-0 z-40">
            <button
              onClick={() => onOpenAddTarget(undefined, undefined)}
              className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95 border border-indigo-500/50"
              title="Add Target Field/Class"
            >
              <Plus className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
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
                ? (groupedData.find((g) => g.groupName === makeSubgroupParentGroup)?.subGroups.map((s) => s.subGroupName).filter(Boolean) as string[]) || []
                : []
            }
            availableTargets={
              makeSubgroupParentGroup
                ? getAvailableForSubgroup(makeSubgroupParentGroup, '')
                : []
            }
            onConfirmCreateSubgroup={handleConfirmCreateSubgroup}
          />

          <SelectTargetsModal
            isOpen={Boolean(selectTargetsConfig)}
            onClose={() => setSelectTargetsConfig(null)}
            destinationGroupName={selectTargetsConfig?.groupName || ''}
            destinationSubGroupName={selectTargetsConfig?.subGroupName}
            availableTargets={
              selectTargetsConfig
                ? selectTargetsConfig.subGroupName
                  ? getAvailableForSubgroup(selectTargetsConfig.groupName, selectTargetsConfig.subGroupName)
                  : ungroupedTargets
                : []
            }
            onConfirmAssign={handleBatchAssign}
            onCreateNewTarget={onOpenAddTarget}
          />

          {/* Remove Target Confirmation Alert Modal */}
          <ConfirmDialog
            isOpen={Boolean(targetToDelete)}
            onClose={() => setTargetToDelete(null)}
            onConfirm={() => {
              if (!targetToDelete) return;
              handleRemoveTargetItem(targetToDelete.id);
              if (showToast) {
                showToast('Target removed from profile');
              }
            }}
            title="Remove Target?"
            subtitle={
              targetToDelete
                ? targetToDelete.customName
                  ? `${targetToDelete.customName} (${targetToDelete.className}.${targetToDelete.memberName})`
                  : `${targetToDelete.className}.${targetToDelete.memberName}`
                : undefined
            }
            description={
              targetToDelete ? (
                <>
                  Do you want to delete and remove this target from profile{' '}
                  <span className="text-white font-semibold">{activeProfile?.name}</span>?
                </>
              ) : null
            }
            confirmText="Delete Target"
          />
        </div>
      )}
    </div>
  );
});
