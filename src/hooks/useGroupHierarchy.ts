import { useState, useEffect, useMemo } from 'react';
import {
  WatchlistProfile,
  WatchlistTargetItem,
  TargetGroup,
  TargetSubGroup,
} from '../types';

interface UseGroupHierarchyOptions {
  activeProfile: WatchlistProfile | undefined;
  displayedItems: WatchlistTargetItem[];
  handleReorderTargets?: (profileId: string, items: WatchlistTargetItem[], groupOrder?: string[]) => void;
  showToast?: (msg: string) => void;
}

export const isCoreGroup = (groupName?: string) =>
  groupName === '. Core / GameFacade' || groupName?.startsWith('. Core');

export function useGroupHierarchy({
  activeProfile,
  displayedItems,
  handleReorderTargets,
  showToast,
}: UseGroupHierarchyOptions) {
  // Collapsed group sections state with persistent storage memory
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const key = `il2cpp_collapsed_groups_${activeProfile?.id || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Re-sync collapsed states when active profile changes
  useEffect(() => {
    try {
      const key = `il2cpp_collapsed_groups_${activeProfile?.id || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setCollapsedGroups(JSON.parse(saved));
      } else {
        setCollapsedGroups({});
      }
    } catch {
      setCollapsedGroups({});
    }
  }, [activeProfile?.id]);

  const toggleGroupCollapse = (groupName: string | null) => {
    const key = groupName || '__ungrouped__';
    setCollapsedGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        const storageKey = `il2cpp_collapsed_groups_${activeProfile?.id || 'default'}`;
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Group creation state
  const [createdGroups, setCreatedGroups] = useState<{ groupName: string; subGroups: string[] }[]>([]);

  // Target Drag and Drop States
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [dragOverGroupKey, setDragOverGroupKey] = useState<string | null>(null);

  // Group Drag and Drop States
  const [draggedGroupKey, setDraggedGroupKey] = useState<string | null>(null);
  const [dragOverGroupKeyForReorder, setDragOverGroupKeyForReorder] = useState<string | null>(null);
  const [dragOverGroupPosition, setDragOverGroupPosition] = useState<'before' | 'after' | null>(null);

  // List of ungrouped targets in the active profile (excluding core isolated targets)
  const ungroupedTargets = useMemo(() => {
    if (!activeProfile) return [];
    return activeProfile.items.filter((it) => !it.groupName?.trim() && !it.isIl2cppSymbol);
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
      if (isCoreGroup(it.groupName) || it.isIl2cppSymbol) return false;
      if (!it.groupName?.trim()) return true;
      if (it.groupName.trim() === groupName && it.subGroupName?.trim() !== subGroupName) return true;
      return false;
    });
  };

  // Assign a single target to a group / subgroup (protecting core group isolation)
  const handleAssignTarget = (targetId: string, groupName?: string, subGroupName?: string) => {
    if (!activeProfile || !handleReorderTargets) return;
    const updated = activeProfile.items.map((it) => {
      if (it.id !== targetId) return it;
      if (isCoreGroup(it.groupName) || it.isIl2cppSymbol) {
        return it;
      }
      if (isCoreGroup(groupName)) {
        return it;
      }
      return {
        ...it,
        groupName: groupName || undefined,
        subGroupName: subGroupName || undefined,
      };
    });
    handleReorderTargets(activeProfile.id, updated);
  };

  // Assign multiple targets in batch (protecting core group isolation)
  const handleBatchAssign = (targetIds: string[], groupName: string, subGroupName?: string) => {
    if (!activeProfile || !handleReorderTargets) return;
    if (isCoreGroup(groupName)) return;
    const idSet = new Set(targetIds);
    const updated = activeProfile.items.map((it) => {
      if (!idSet.has(it.id)) return it;
      if (isCoreGroup(it.groupName) || it.isIl2cppSymbol) return it;
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

  // Target Drag & Drop Handlers
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

    const isDraggedCore = isCoreGroup(draggedItem.groupName) || Boolean(draggedItem.isIl2cppSymbol);
    const isTargetCore = isCoreGroup(targetItem.groupName) || Boolean(targetItem.isIl2cppSymbol);

    let newGroupName = targetItem.groupName;
    let newSubGroupName = targetItem.subGroupName;

    if (isDraggedCore && !isTargetCore) {
      newGroupName = draggedItem.groupName;
      newSubGroupName = draggedItem.subGroupName;
    } else if (!isDraggedCore && isTargetCore) {
      newGroupName = draggedItem.groupName;
      newSubGroupName = draggedItem.subGroupName;
    }

    const updatedDraggedItem: WatchlistTargetItem = {
      ...draggedItem,
      groupName: newGroupName,
      subGroupName: newSubGroupName,
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

    const isDraggedCore = isCoreGroup(draggedItem.groupName) || Boolean(draggedItem.isIl2cppSymbol);
    const isTargetCore = isCoreGroup(targetGroupName || undefined);

    let finalGroupName = targetGroupName || undefined;
    let finalSubGroupName = targetSubGroupName || undefined;

    if (isDraggedCore && !isTargetCore) {
      finalGroupName = draggedItem.groupName;
      finalSubGroupName = draggedItem.subGroupName;
    } else if (!isDraggedCore && isTargetCore) {
      finalGroupName = draggedItem.groupName;
      finalSubGroupName = draggedItem.subGroupName;
    }

    const updatedDraggedItem: WatchlistTargetItem = {
      ...draggedItem,
      groupName: finalGroupName,
      subGroupName: finalSubGroupName,
    };

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

    itemsByGroup.forEach((list) => {
      reorderedItems.push(...list);
    });

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

  return {
    collapsedGroups,
    toggleGroupCollapse,
    createdGroups,
    setCreatedGroups,
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
  };
}
