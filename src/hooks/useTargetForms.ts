import { useState, useCallback, useMemo } from 'react';
import {
  WatchlistProfile,
  WatchlistTargetItem,
  CodeStylePreset,
} from '../types';

interface UseTargetFormsOptions {
  profiles: WatchlistProfile[];
  activeProfile: WatchlistProfile | undefined;
  saveProfiles: (profiles: WatchlistProfile[]) => void;
  setActiveProfileId: (id: string) => void;
  setSelectedProfileViewId: (id: string | null) => void;
  showToast: (msg: string) => void;
}

export function useTargetForms({
  profiles,
  activeProfile,
  saveProfiles,
  setActiveProfileId,
  setSelectedProfileViewId,
  showToast,
}: UseTargetFormsOptions) {
  // --- Profile Create Modal State ---
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileCodeStyle, setNewProfileCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [newProfileCustomTemplate, setNewProfileCustomTemplate] = useState('constexpr uintptr_t {name} = {offset};');

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const newProf: WatchlistProfile = {
      id: `p_${Date.now()}`,
      name: newProfileName.trim(),
      description: newProfileDesc.trim() || undefined,
      codeStylePreset: newProfileCodeStyle,
      customCodeStyleTemplate: newProfileCustomTemplate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: [],
    };
    saveProfiles([newProf, ...profiles]);
    setActiveProfileId(newProf.id);
    setSelectedProfileViewId(newProf.id);
    setNewProfileName('');
    setNewProfileDesc('');
    setIsNewProfileModalOpen(false);
    showToast(`Profile "${newProf.name}" created`);
  };

  // --- Profile Edit Modal State ---
  const [editingProfile, setEditingProfile] = useState<WatchlistProfile | null>(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileDesc, setEditProfileDesc] = useState('');
  const [editProfileCodeStyle, setEditProfileCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [editProfileCustomTemplate, setEditProfileCustomTemplate] = useState('');

  const handleOpenEditProfile = (prof: WatchlistProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProfile(prof);
    setEditProfileName(prof.name);
    setEditProfileDesc(prof.description || '');
    setEditProfileCodeStyle(prof.codeStylePreset || 'cpp_constexpr');
    setEditProfileCustomTemplate(prof.customCodeStyleTemplate || '');
  };

  const handleSaveEditProfile = () => {
    if (!editingProfile || !editProfileName.trim()) return;
    const nextProfiles = profiles.map((p) =>
      p.id === editingProfile.id
        ? {
            ...p,
            name: editProfileName.trim(),
            description: editProfileDesc.trim() || undefined,
            codeStylePreset: editProfileCodeStyle,
            customCodeStyleTemplate: editProfileCustomTemplate,
            updatedAt: Date.now(),
          }
        : p
    );
    saveProfiles(nextProfiles);
    setEditingProfile(null);
    showToast(`Profile "${editProfileName.trim()}" updated`);
  };

  // --- Add Target Modal State ---
  const [isAddTargetModalOpen, setIsAddTargetModalOpen] = useState(false);
  const [newTargetKind, setNewTargetKind] = useState<'FIELD' | 'METHOD'>('FIELD');
  const [newTargetCustomName, setNewTargetCustomName] = useState('');
  const [newTargetIsCustom, setNewTargetIsCustom] = useState(false);
  const [newTargetDefaultOffset, setNewTargetDefaultOffset] = useState('');
  const [newTargetGroupName, setNewTargetGroupName] = useState('');
  const [newTargetSubGroupName, setNewTargetSubGroupName] = useState('');
  const [newTargetAssemblyName, setNewTargetAssemblyName] = useState('');
  const [newTargetClassName, setNewTargetClassName] = useState('');
  const [newTargetNamespaceName, setNewTargetNamespaceName] = useState('');
  const [newTargetMemberName, setNewTargetMemberName] = useState('');
  const [newTargetComment, setNewTargetComment] = useState('');
  const [showAddFallbacks, setShowAddFallbacks] = useState(false);
  const [tempFallbackClassInput, setTempFallbackClassInput] = useState('');
  const [tempFallbackMemberInput, setTempFallbackMemberInput] = useState('');
  const [newTargetFallbackClasses, setNewTargetFallbackClasses] = useState<string[]>([]);
  const [newTargetFallbackMembers, setNewTargetFallbackMembers] = useState<string[]>([]);

  // Available groups and subgroups for active profile
  const availableGroups = useMemo(() => {
    if (!activeProfile) return [];
    const set = new Set<string>();
    for (const item of activeProfile.items) {
      if (item.groupName?.trim()) set.add(item.groupName.trim());
    }
    return Array.from(set);
  }, [activeProfile]);

  const availableSubGroups = useMemo(() => {
    if (!activeProfile) return [];
    const set = new Set<string>();
    for (const item of activeProfile.items) {
      if (item.subGroupName?.trim()) set.add(item.subGroupName.trim());
    }
    return Array.from(set);
  }, [activeProfile]);

  const handleOpenAddTargetToGroup = useCallback((groupName?: string, subGroupName?: string) => {
    setNewTargetGroupName(groupName || '');
    setNewTargetSubGroupName(subGroupName || '');
    setIsAddTargetModalOpen(true);
  }, []);

  const handleAddTarget = () => {
    if (!activeProfile) return;

    const isCore =
      newTargetGroupName === '. Core / GameFacade' ||
      newTargetGroupName?.startsWith('. Core');

    if (isCore) {
      if (!newTargetCustomName.trim() && !newTargetMemberName.trim()) return;
    } else if (newTargetIsCustom) {
      if (!newTargetCustomName.trim()) return;
    } else {
      if (!newTargetClassName.trim() || !newTargetMemberName.trim()) return;
    }

    let parsedNs = newTargetNamespaceName.trim() || undefined;
    let parsedClass = newTargetClassName.trim();
    if (parsedClass.includes(':')) {
      const parts = parsedClass.split(':');
      parsedNs = parts[0].trim() || undefined;
      parsedClass = parts.slice(1).join(':').trim();
    } else if (parsedClass.includes('::')) {
      const parts = parsedClass.split('::');
      parsedNs = parts[0].trim() || undefined;
      parsedClass = parts.slice(1).join(':').trim();
    }

    const cleanOffset = newTargetDefaultOffset.trim();
    const formattedOffset = cleanOffset
      ? cleanOffset.startsWith('0x') || cleanOffset.startsWith('0X')
        ? cleanOffset
        : `0x${cleanOffset}`
      : undefined;

    const newItem: WatchlistTargetItem = isCore
      ? {
          id: `t_${Date.now()}`,
          isCustom: false,
          isIl2cppSymbol: true,
          assemblyName: 'il2cpp',
          resolvedAssemblyName: 'il2cpp',
          customName: newTargetCustomName.trim() || undefined,
          memberName: newTargetMemberName.trim() || newTargetCustomName.trim() || 'IL2CPP_SYMBOL',
          il2cppSymbolName: newTargetMemberName.trim() || undefined,
          className: 'GameFacade',
          defaultOffset: formattedOffset,
          offsetHex: formattedOffset,
          groupName: '. Core / GameFacade',
          subGroupName: undefined,
          comment: newTargetComment.trim() || undefined,
          resolved: Boolean(formattedOffset),
        }
      : newTargetIsCustom
      ? {
          id: `t_${Date.now()}`,
          isCustom: true,
          customName: newTargetCustomName.trim(),
          defaultOffset: formattedOffset,
          offsetHex: formattedOffset,
          comment: newTargetComment.trim() || undefined,
          groupName: newTargetGroupName.trim() || undefined,
          subGroupName: newTargetSubGroupName.trim() || undefined,
          resolved: Boolean(formattedOffset),
        }
      : {
          id: `t_${Date.now()}`,
          isCustom: false,
          defaultOffset: formattedOffset,
          customName: newTargetCustomName.trim() || undefined,
          groupName: newTargetGroupName.trim() || undefined,
          subGroupName: newTargetSubGroupName.trim() || undefined,
          assemblyName: newTargetAssemblyName.trim() || undefined,
          namespaceName: parsedNs,
          className: parsedClass,
          memberName: newTargetMemberName.trim(),
          kind: newTargetKind,
          comment: newTargetComment.trim() || undefined,
          fallbackClassNames: newTargetFallbackClasses.length > 0 ? newTargetFallbackClasses : undefined,
          fallbackMemberNames: newTargetFallbackMembers.length > 0 ? newTargetFallbackMembers : undefined,
          offsetHex: formattedOffset,
          rvaHex: newTargetKind === 'METHOD' ? formattedOffset : undefined,
          resolved: Boolean(formattedOffset),
        };

    const nextProfiles = profiles.map((p) =>
      p.id === activeProfile.id ? { ...p, items: [...p.items, newItem], updatedAt: Date.now() } : p
    );
    saveProfiles(nextProfiles);

    setNewTargetIsCustom(false);
    setNewTargetDefaultOffset('');
    setNewTargetCustomName('');
    setNewTargetGroupName('');
    setNewTargetSubGroupName('');
    setNewTargetAssemblyName('');
    setNewTargetClassName('');
    setNewTargetNamespaceName('');
    setNewTargetMemberName('');
    setNewTargetComment('');
    setShowAddFallbacks(false);
    setNewTargetFallbackClasses([]);
    setNewTargetFallbackMembers([]);
    setIsAddTargetModalOpen(false);

    showToast(`Added target ${newItem.customName || `${newItem.className || ''}.${newItem.memberName || ''}`}`);
  };

  // --- Edit Target Modal State ---
  const [editingTargetItem, setEditingTargetItem] = useState<WatchlistTargetItem | null>(null);
  const [editTargetKind, setEditTargetKind] = useState<'FIELD' | 'METHOD'>('FIELD');
  const [editTargetCustomName, setEditTargetCustomName] = useState('');
  const [editTargetIsCustom, setEditTargetIsCustom] = useState(false);
  const [editTargetDefaultOffset, setEditTargetDefaultOffset] = useState('');
  const [editTargetAssemblyName, setEditTargetAssemblyName] = useState('');
  const [editTargetClassName, setEditTargetClassName] = useState('');
  const [editTargetNamespaceName, setEditTargetNamespaceName] = useState('');
  const [editTargetMemberName, setEditTargetMemberName] = useState('');
  const [editTargetComment, setEditTargetComment] = useState('');
  const [showEditFallbacks, setShowEditFallbacks] = useState(false);
  const [editTempFallbackClassInput, setEditTempFallbackClassInput] = useState('');
  const [editTempFallbackMemberInput, setEditTempFallbackMemberInput] = useState('');
  const [editTargetFallbackClasses, setEditTargetFallbackClasses] = useState<string[]>([]);
  const [editTargetFallbackMembers, setEditTargetFallbackMembers] = useState<string[]>([]);

  const handleOpenEditTarget = (item: WatchlistTargetItem) => {
    setEditingTargetItem(item);
    setEditTargetIsCustom(Boolean(item.isCustom));
    setEditTargetDefaultOffset(item.defaultOffset || item.offsetHex || item.rvaHex || '');
    setEditTargetCustomName(item.customName || '');
    setEditTargetAssemblyName(item.assemblyName || item.resolvedAssemblyName || '');
    setEditTargetNamespaceName(item.namespaceName || '');
    setEditTargetClassName(item.className ? (item.namespaceName ? `${item.namespaceName}:${item.className}` : item.className) : '');
    setEditTargetMemberName(item.memberName || '');
    setEditTargetKind(item.kind || 'FIELD');
    setEditTargetComment(item.comment || '');
    const hasFallbacks =
      (item.fallbackClassNames && item.fallbackClassNames.length > 0) ||
      (item.fallbackMemberNames && item.fallbackMemberNames.length > 0);
    setEditTargetFallbackClasses(item.fallbackClassNames || []);
    setEditTargetFallbackMembers(item.fallbackMemberNames || []);
    setShowEditFallbacks(Boolean(hasFallbacks));
    setEditTempFallbackClassInput('');
    setEditTempFallbackMemberInput('');
  };

  const handleSaveEditTarget = () => {
    if (!editingTargetItem || !activeProfile) return;

    if (editTargetIsCustom) {
      if (!editTargetCustomName.trim()) return;
    } else {
      if (!editTargetClassName.trim() || !editTargetMemberName.trim()) return;
    }

    let parsedNs = editTargetNamespaceName.trim() || undefined;
    let parsedClass = editTargetClassName.trim();
    if (parsedClass.includes(':')) {
      const parts = parsedClass.split(':');
      parsedNs = parts[0].trim() || undefined;
      parsedClass = parts.slice(1).join(':').trim();
    } else if (parsedClass.includes('::')) {
      const parts = parsedClass.split('::');
      parsedNs = parts[0].trim() || undefined;
      parsedClass = parts.slice(1).join(':').trim();
    }

    const cleanOffset = editTargetDefaultOffset.trim();
    const formattedOffset = cleanOffset
      ? cleanOffset.startsWith('0x') || cleanOffset.startsWith('0X')
        ? cleanOffset
        : `0x${cleanOffset}`
      : undefined;

    const isCore =
      editingTargetItem.isIl2cppSymbol ||
      editingTargetItem.groupName === '. Core / GameFacade' ||
      editingTargetItem.groupName?.startsWith('. Core');

    const updatedItem: WatchlistTargetItem = isCore
      ? {
          ...editingTargetItem,
          isCustom: false,
          isIl2cppSymbol: true,
          assemblyName: 'il2cpp',
          resolvedAssemblyName: 'il2cpp',
          customName: editTargetCustomName.trim() || undefined,
          memberName: editTargetMemberName.trim() || editTargetCustomName.trim() || 'IL2CPP_SYMBOL',
          il2cppSymbolName: editTargetMemberName.trim() || undefined,
          className: editingTargetItem.className || 'GameFacade',
          defaultOffset: formattedOffset,
          offsetHex: formattedOffset || editingTargetItem.offsetHex,
          comment: editTargetComment.trim() || undefined,
          groupName: '. Core / GameFacade',
          subGroupName: undefined,
          resolved: Boolean(formattedOffset) || editingTargetItem.resolved,
        }
      : editTargetIsCustom
      ? {
          id: editingTargetItem.id,
          isCustom: true,
          customName: editTargetCustomName.trim() || undefined,
          defaultOffset: formattedOffset,
          offsetHex: formattedOffset,
          comment: editTargetComment.trim() || undefined,
          groupName: editingTargetItem.groupName,
          subGroupName: editingTargetItem.subGroupName,
          resolved: Boolean(formattedOffset),
        }
      : {
          ...editingTargetItem,
          isCustom: false,
          defaultOffset: formattedOffset,
          customName: editTargetCustomName.trim() || undefined,
          groupName: editingTargetItem.groupName,
          subGroupName: editingTargetItem.subGroupName,
          assemblyName: editTargetAssemblyName.trim() || undefined,
          namespaceName: parsedNs,
          className: parsedClass,
          memberName: editTargetMemberName.trim(),
          kind: editTargetKind,
          comment: editTargetComment.trim() || undefined,
          fallbackClassNames: editTargetFallbackClasses.length > 0 ? editTargetFallbackClasses : undefined,
          fallbackMemberNames: editTargetFallbackMembers.length > 0 ? editTargetFallbackMembers : undefined,
          offsetHex: formattedOffset || editingTargetItem.offsetHex,
          rvaHex: editTargetKind === 'METHOD' && formattedOffset ? formattedOffset : editingTargetItem.rvaHex,
          resolved: Boolean(formattedOffset) || editingTargetItem.resolved,
          resolvedViaFallback: editingTargetItem.resolvedViaFallback,
          resolvedClassName: editingTargetItem.resolvedClassName,
          resolvedMemberName: editingTargetItem.resolvedMemberName,
          resolvedAssemblyName: editingTargetItem.resolvedAssemblyName,
        };

    const nextProfiles = profiles.map((p) =>
      p.id === activeProfile.id
        ? {
            ...p,
            items: p.items.map((it) => (it.id === editingTargetItem.id ? updatedItem : it)),
            updatedAt: Date.now(),
          }
        : p
    );
    saveProfiles(nextProfiles);

    setEditingTargetItem(null);
    showToast(`Updated target ${updatedItem.customName || `${updatedItem.className || ''}.${updatedItem.memberName || ''}`}`);
  };

  const handleRemoveTargetItem = (id: string) => {
    if (!activeProfile) return;
    const nextProfiles = profiles.map((p) =>
      p.id === activeProfile.id
        ? {
            ...p,
            items: p.items.filter((it) => it.id !== id),
            updatedAt: Date.now(),
          }
        : p
    );
    saveProfiles(nextProfiles);
    showToast('Target removed from profile');
  };

  const handleReorderTargets = useCallback((profileId: string, items: WatchlistTargetItem[], groupOrder?: string[]) => {
    const nextProfiles = profiles.map((p) =>
      p.id === profileId
        ? {
            ...p,
            items,
            ...(groupOrder !== undefined ? { groupOrder } : {}),
            updatedAt: Date.now(),
          }
        : p
    );
    saveProfiles(nextProfiles);
  }, [profiles, saveProfiles]);

  return {
    // Profile Create
    isNewProfileModalOpen,
    setIsNewProfileModalOpen,
    newProfileName,
    setNewProfileName,
    newProfileDesc,
    setNewProfileDesc,
    newProfileCodeStyle,
    setNewProfileCodeStyle,
    newProfileCustomTemplate,
    setNewProfileCustomTemplate,
    handleCreateProfile,

    // Profile Edit
    editingProfile,
    setEditingProfile,
    editProfileName,
    setEditProfileName,
    editProfileDesc,
    setEditProfileDesc,
    editProfileCodeStyle,
    setEditProfileCodeStyle,
    editProfileCustomTemplate,
    setEditProfileCustomTemplate,
    handleOpenEditProfile,
    handleSaveEditProfile,

    // Add Target
    isAddTargetModalOpen,
    setIsAddTargetModalOpen,
    newTargetKind,
    setNewTargetKind,
    newTargetCustomName,
    setNewTargetCustomName,
    newTargetIsCustom,
    setNewTargetIsCustom,
    newTargetDefaultOffset,
    setNewTargetDefaultOffset,
    newTargetGroupName,
    setNewTargetGroupName,
    newTargetSubGroupName,
    setNewTargetSubGroupName,
    availableGroups,
    availableSubGroups,
    newTargetAssemblyName,
    setNewTargetAssemblyName,
    newTargetClassName,
    setNewTargetClassName,
    newTargetNamespaceName,
    setNewTargetNamespaceName,
    newTargetMemberName,
    setNewTargetMemberName,
    newTargetComment,
    setNewTargetComment,
    showAddFallbacks,
    setShowAddFallbacks,
    tempFallbackClassInput,
    setTempFallbackClassInput,
    tempFallbackMemberInput,
    setTempFallbackMemberInput,
    newTargetFallbackClasses,
    setNewTargetFallbackClasses,
    newTargetFallbackMembers,
    setNewTargetFallbackMembers,
    handleAddTarget,
    handleOpenAddTargetToGroup,

    // Edit Target
    editingTargetItem,
    setEditingTargetItem,
    editTargetKind,
    setEditTargetKind,
    editTargetCustomName,
    setEditTargetCustomName,
    editTargetIsCustom,
    setEditTargetIsCustom,
    editTargetDefaultOffset,
    setEditTargetDefaultOffset,
    editTargetAssemblyName,
    setEditTargetAssemblyName,
    editTargetClassName,
    setEditTargetClassName,
    editTargetNamespaceName,
    setEditTargetNamespaceName,
    editTargetMemberName,
    setEditTargetMemberName,
    editTargetComment,
    setEditTargetComment,
    showEditFallbacks,
    setShowEditFallbacks,
    editTempFallbackClassInput,
    setEditTempFallbackClassInput,
    editTempFallbackMemberInput,
    setEditTempFallbackMemberInput,
    editTargetFallbackClasses,
    setEditTargetFallbackClasses,
    editTargetFallbackMembers,
    setEditTargetFallbackMembers,
    handleOpenEditTarget,
    handleSaveEditTarget,
    handleRemoveTargetItem,
    handleReorderTargets,
  };
}
