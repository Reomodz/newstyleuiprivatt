import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import {
  Cpu, BookmarkPlus, History
} from 'lucide-react';
import {
  AddTargetModal,
  EditTargetModal,
  CreateProfileModal,
  EditProfileModal,
  TargetDetailModal,
  HistoryDetailModal,
  CardSettingsModal,
  ProfileCardSettingsModal,
  HistoryCardSettingsModal,
} from "./modals";
import { ConfirmDialog } from "./ui";
import { HistoryTab } from "./dashboard/HistoryTab";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { ProfileSidebar } from "./dashboard/ProfileSidebar";

import { useWatchlistManager } from '../hooks/useWatchlistManager';
import { useMemoryScanner } from '../hooks/useMemoryScanner';

import {
  ProcessDescriptor,
  WatchlistProfile,
  WatchlistTargetItem,
  ScanHistoryRecord,
  CodeStylePreset,
  TargetCardViewSettings,
  DEFAULT_TARGET_VIEW_SETTINGS,
  ProfileCardViewSettings,
  DEFAULT_PROFILE_VIEW_SETTINGS,
  HistoryCardViewSettings,
  DEFAULT_HISTORY_VIEW_SETTINGS,
} from '../types';
import { il2cppEngine } from '../services/il2cppEngine';

interface MainDashboardProps {
  currentProcess?: ProcessDescriptor | null;
  storageDumpName?: string | null;
  onStorageDumpLoaded?: (fileName: string | null) => void;
  onOpenProcessPicker?: () => void;
  onNavigateToBrowser?: (classIndex?: number, memberKind?: 'FIELD' | 'METHOD', memberName?: string) => void;
  onCopyText: (text: string, label: string) => void;
  showToast: (msg: string) => void;
  watchlistManager?: ReturnType<typeof useWatchlistManager>;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  currentProcess,
  storageDumpName,
  onStorageDumpLoaded,
  onNavigateToBrowser,
  onCopyText,
  showToast,
  watchlistManager,
}) => {
  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<'target' | 'watchlist' | 'history'>('target');

  // Storage dump state
  const [storageMeta, setStorageMeta] = useState(() => il2cppEngine.getStorageMeta());
  const [loadedStorageFileName, setLoadedStorageFileName] = useState<string | null>(storageDumpName || null);
  const [loadedHeaderFileName, setLoadedHeaderFileName] = useState<string | null>(null);
  const [isParsingDump, setIsParsingDump] = useState(false);
  const [parseProgress, setParseProgress] = useState<import('../types').DumpParseProgress | null>(null);
  const [parsedSummary, setParsedSummary] = useState<{
    classes: number;
    methods: number;
    fields: number;
    typeInfos?: number;
  } | null>(null);

  // Profiles State
  const defaultWatchlist = useWatchlistManager();
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    selectedProfileViewId,
    setSelectedProfileViewId,
    activeProfile,
    saveProfiles,
  } = watchlistManager || defaultWatchlist;

  // Profile JSON Import ref
  const profileImportInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile Name Modal State
  const [editingProfile, setEditingProfile] = useState<WatchlistProfile | null>(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileDesc, setEditProfileDesc] = useState('');
  const [editProfileCodeStyle, setEditProfileCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [editProfileCustomTemplate, setEditProfileCustomTemplate] = useState('constexpr uintptr_t {name} = {offset};');

  // Fallback Collapsible Toggles
  const [showAddFallbacks, setShowAddFallbacks] = useState(false);
  const [showEditFallbacks, setShowEditFallbacks] = useState(false);

  // Scan History
  const {
    scanHistory,
    saveHistory,
    isScanning,
    scanLogs,
    handleScanProfile: doScanProfile
  } = useMemoryScanner();

  // Modal / Form States
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileCodeStyle, setNewProfileCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [newProfileCustomTemplate, setNewProfileCustomTemplate] = useState('constexpr uintptr_t {name} = {offset};');

  const [isAddTargetModalOpen, setIsAddTargetModalOpen] = useState(false);
  const [newTargetIsCustom, setNewTargetIsCustom] = useState(false);
  const [newTargetDefaultOffset, setNewTargetDefaultOffset] = useState('');
  const [newTargetCustomName, setNewTargetCustomName] = useState('');
  const [newTargetGroupName, setNewTargetGroupName] = useState('');
  const [newTargetSubGroupName, setNewTargetSubGroupName] = useState('');
  const [newTargetAssemblyName, setNewTargetAssemblyName] = useState('');
  const [newTargetNamespaceName, setNewTargetNamespaceName] = useState('');
  const [newTargetClassName, setNewTargetClassName] = useState('');
  const [newTargetMemberName, setNewTargetMemberName] = useState('');
  const [newTargetKind, setNewTargetKind] = useState<'FIELD' | 'METHOD'>('FIELD');
  const [newTargetComment, setNewTargetComment] = useState('');
  const [newTargetFallbackClasses, setNewTargetFallbackClasses] = useState<string[]>([]);
  const [newTargetFallbackMembers, setNewTargetFallbackMembers] = useState<string[]>([]);
  const [tempFallbackClassInput, setTempFallbackClassInput] = useState('');
  const [tempFallbackMemberInput, setTempFallbackMemberInput] = useState('');

  // Edit Target Modal State
  const [editingTargetItem, setEditingTargetItem] = useState<WatchlistTargetItem | null>(null);
  const [editTargetIsCustom, setEditTargetIsCustom] = useState(false);
  const [editTargetDefaultOffset, setEditTargetDefaultOffset] = useState('');
  const [editTargetCustomName, setEditTargetCustomName] = useState('');
  const [editTargetAssemblyName, setEditTargetAssemblyName] = useState('');
  const [editTargetNamespaceName, setEditTargetNamespaceName] = useState('');
  const [editTargetClassName, setEditTargetClassName] = useState('');
  const [editTargetMemberName, setEditTargetMemberName] = useState('');
  const [editTargetKind, setEditTargetKind] = useState<'FIELD' | 'METHOD'>('FIELD');
  const [editTargetComment, setEditTargetComment] = useState('');
  const [editTargetFallbackClasses, setEditTargetFallbackClasses] = useState<string[]>([]);
  const [editTargetFallbackMembers, setEditTargetFallbackMembers] = useState<string[]>([]);
  const [editTempFallbackClassInput, setEditTempFallbackClassInput] = useState('');
  const [editTempFallbackMemberInput, setEditTempFallbackMemberInput] = useState('');

  // Live filter inside watchlist
  const [watchlistFilter, setWatchlistFilter] = useState('');

  // Profile Card View & Display Settings (for Profile Overview Cards)
  const [profileCardSettings, setProfileCardSettings] = useState<ProfileCardViewSettings>(() => {
    try {
      const saved = localStorage.getItem('il2cpp_profile_view_settings');
      if (saved) {
        return { ...DEFAULT_PROFILE_VIEW_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PROFILE_VIEW_SETTINGS;
  });

  const [isProfileCardSettingsModalOpen, setIsProfileCardSettingsModalOpen] = useState(false);

  // Target Card View & Display Settings (Custom Target Card Options)
  const [cardViewSettings, setCardViewSettings] = useState<TargetCardViewSettings>(() => {
    try {
      const saved = localStorage.getItem('il2cpp_target_view_settings_v3');
      if (saved) {
        return { ...DEFAULT_TARGET_VIEW_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_TARGET_VIEW_SETTINGS;
  });

  // Auto-persist target card settings changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('il2cpp_target_view_settings_v3', JSON.stringify(cardViewSettings));
    } catch {
      // ignore
    }
  }, [cardViewSettings]);

  // Sync active profile's stored card settings when switching profiles
  useEffect(() => {
    if (activeProfile?.cardViewSettings) {
      setCardViewSettings((prev) => ({
        ...prev,
        ...activeProfile.cardViewSettings,
      }));
    }
  }, [activeProfile?.id]);

  const [isCardSettingsModalOpen, setIsCardSettingsModalOpen] = useState(false);

  // History Card View & Display Settings
  const [historyCardSettings, setHistoryCardSettings] = useState<HistoryCardViewSettings>(() => {
    try {
      const saved = localStorage.getItem('il2cpp_history_view_settings');
      if (saved) {
        return { ...DEFAULT_HISTORY_VIEW_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_HISTORY_VIEW_SETTINGS;
  });

  const [isHistoryCardSettingsModalOpen, setIsHistoryCardSettingsModalOpen] = useState(false);

  // Target Detail Modal State (View Mode)
  const [viewingTargetItem, setViewingTargetItem] = useState<WatchlistTargetItem | null>(null);

  // History Detail Sheet / Modal State
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<ScanHistoryRecord | null>(null);
  const [historyModalCodeStyle, setHistoryModalCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [historyModalCustomTemplate, setHistoryModalCustomTemplate] = useState('constexpr uintptr_t {name} = {offset};');
  const [historyModalTab, setHistoryModalTab] = useState<'targets' | 'code'>('targets');

  const handleOpenHistoryRecord = (rec: ScanHistoryRecord) => {
    setSelectedHistoryRecord(rec);
    setHistoryModalCodeStyle(rec.codeStylePreset || 'cpp_constexpr');
    setHistoryModalCustomTemplate(rec.customCodeStyleTemplate || 'constexpr uintptr_t {name} = {offset};');
    setHistoryModalTab('targets');
  };

  // History Clear All Confirmation Modal State
  const [isConfirmClearHistoryOpen, setIsConfirmClearHistoryOpen] = useState(false);

  const handleScanProfile = useCallback(() => {
    doScanProfile(
      activeProfile,
      'storage',
      currentProcess || null,
      loadedStorageFileName,
      profiles,
      saveProfiles,
      showToast
    );
  }, [doScanProfile, activeProfile, currentProcess, loadedStorageFileName, profiles, saveProfiles, showToast]);

  // Handle Storage dump.cs File Upload
  const handleDumpCsUpload = async (file: File) => {
    setIsParsingDump(true);
    setParseProgress({
      fileName: file.name,
      fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
      percent: 0,
      processedBytes: 0,
      totalBytes: file.size,
      classesCount: 0,
      methodsCount: 0,
      fieldsCount: 0,
      stage: `Preparing to stream ${file.name} (${Number((file.size / (1024 * 1024)).toFixed(2))} MB)...`,
    });

    try {
      const result = await il2cppEngine.parseDumpCsFile(file, (progress) => {
        setParseProgress(progress);
      });
      setLoadedStorageFileName(file.name);
      const updatedMeta = il2cppEngine.getStorageMeta();
      setStorageMeta(updatedMeta);
      if (onStorageDumpLoaded) {
        onStorageDumpLoaded(file.name);
      }
      setParsedSummary({
        classes: result.classesCount,
        methods: result.methodsCount,
        fields: result.fieldsCount,
        typeInfos: updatedMeta.totalTypeInfos,
      });
      setIsParsingDump(false);
      setParseProgress(null);
      showToast(`Parsed ${file.name} (${Number((file.size / (1024 * 1024)).toFixed(2))} MB): ${result.classesCount.toLocaleString()} classes, ${result.methodsCount.toLocaleString()} methods`);
    } catch (err) {
      setIsParsingDump(false);
      setParseProgress(null);
      showToast('Failed to parse dump.cs file');
    }
  };

  // Handle Storage il2cpp.h File Upload
  const handleIl2cppHUpload = async (file: File) => {
    setIsParsingDump(true);
    setParseProgress({
      fileName: file.name,
      fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
      percent: 0,
      processedBytes: 0,
      totalBytes: file.size,
      classesCount: storageMeta.totalClasses,
      methodsCount: storageMeta.totalMethods,
      fieldsCount: storageMeta.totalFields,
      typeInfosCount: 0,
      stage: `Preparing to stream ${file.name} (${Number((file.size / (1024 * 1024)).toFixed(2))} MB)...`,
    });

    try {
      const result = await il2cppEngine.parseIl2cppHFile(file, (progress) => {
        setParseProgress(progress);
      });
      setLoadedHeaderFileName(file.name);
      const updatedMeta = il2cppEngine.getStorageMeta();
      setStorageMeta(updatedMeta);
      setParsedSummary((prev) => ({
        classes: prev?.classes ?? updatedMeta.totalClasses,
        methods: prev?.methods ?? updatedMeta.totalMethods,
        fields: prev?.fields ?? updatedMeta.totalFields,
        typeInfos: updatedMeta.totalTypeInfos,
      }));
      setIsParsingDump(false);
      setParseProgress(null);
      showToast(`Linked ${file.name} (${Number((file.size / (1024 * 1024)).toFixed(2))} MB): ${result.typeInfosCount.toLocaleString()} TypeInfos & ${result.methodsLinked.toLocaleString()} methods linked`);
    } catch (err) {
      setIsParsingDump(false);
      setParseProgress(null);
      showToast('Failed to parse il2cpp.h file');
    }
  };

  // Create Profile
  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const newProf: WatchlistProfile = {
      id: `prof_${Date.now()}`,
      name: newProfileName.trim(),
      description: newProfileDesc.trim() || 'Custom offset profile',
      codeStylePreset: newProfileCodeStyle,
      customCodeStyleTemplate: newProfileCustomTemplate.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: [],
    };
    const next = [newProf, ...profiles];
    saveProfiles(next);
    setActiveProfileId(newProf.id);
    setSelectedProfileViewId(newProf.id);
    setNewProfileName('');
    setNewProfileDesc('');
    setNewProfileCodeStyle('cpp_constexpr');
    setNewProfileCustomTemplate('constexpr uintptr_t {name} = {offset};');
    setIsNewProfileModalOpen(false);
    showToast(`Created profile "${newProf.name}"`);
  };

  // Open Edit Profile Name Modal
  const handleOpenEditProfile = (prof: WatchlistProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProfile(prof);
    setEditProfileName(prof.name);
    setEditProfileDesc(prof.description || '');
    setEditProfileCodeStyle(prof.codeStylePreset || 'cpp_constexpr');
    setEditProfileCustomTemplate(prof.customCodeStyleTemplate || 'constexpr uintptr_t {name} = {offset};');
  };

  // Save Edit Profile Name & Code Style
  const handleSaveEditProfile = () => {
    if (!editingProfile || !editProfileName.trim()) return;
    const updated = profiles.map((p) =>
      p.id === editingProfile.id
        ? {
            ...p,
            name: editProfileName.trim(),
            description: editProfileDesc.trim(),
            codeStylePreset: editProfileCodeStyle,
            customCodeStyleTemplate: editProfileCustomTemplate.trim() || undefined,
            updatedAt: Date.now(),
          }
        : p
    );
    saveProfiles(updated);
    setEditingProfile(null);
    showToast(`Updated profile "${editProfileName.trim()}"`);
  };

  // Export / Share Profile as JSON with Full Card Settings & Default Folder Storage
  const handleExportProfile = async (prof: WatchlistProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Bundle profile details AND complete card settings
    const exportData = {
      version: '1.2',
      exportedAt: new Date().toISOString(),
      profile: {
        id: prof.id,
        name: prof.name,
        description: prof.description,
        targetApp: prof.targetApp,
        codeStylePreset: prof.codeStylePreset || 'cpp_constexpr',
        customCodeStyleTemplate: prof.customCodeStyleTemplate,
        groupOrder: prof.groupOrder,
        // Include full target card view settings in export!
        cardViewSettings: prof.cardViewSettings || cardViewSettings,
        items: prof.items.map((item) => {
          if (item.isCustom) {
            return {
              id: item.id,
              isCustom: true,
              customName: item.customName,
              groupName: item.groupName,
              subGroupName: item.subGroupName,
              comment: item.comment,
              offsetHex: item.offsetHex,
              defaultOffset: item.defaultOffset,
            };
          }
          return {
            id: item.id,
            customName: item.customName,
            groupName: item.groupName,
            subGroupName: item.subGroupName,
            assemblyName: item.assemblyName,
            className: item.className,
            memberName: item.memberName,
            kind: item.kind,
            comment: item.comment,
            offsetHex: item.offsetHex,
            rvaHex: item.rvaHex,
            isStatic: item.isStatic,
            valueType: item.valueType,
            fallbackClassNames: item.fallbackClassNames,
            fallbackMemberNames: item.fallbackMemberNames,
          };
        }),
      },
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const sanitizedName = prof.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `IL2Cpp_${sanitizedName}_profile.json`;

    // 1. Copy JSON string to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(jsonStr);
      }
    } catch {
      // Fallback ignore copy error
    }

    // 2. Download/save file to default IL2Cpp folder
    let savedNative = false;
    try {
      if ((window as any).Capacitor?.isNativePlatform()) {
        await Filesystem.writeFile({
          path: `IL2Cpp/${fileName}`,
          data: jsonStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        });
        savedNative = true;
      }
    } catch (err) {
      console.warn('Capacitor filesystem save fallback:', err);
    }

    if (!savedNative) {
      try {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // Blob fallback
      }
    }

    showToast(
      savedNative
        ? `Shared "${prof.name}"! Saved to IL2Cpp folder & copied to clipboard`
        : `Exported "${prof.name}"! File downloaded (${fileName}) & copied to clipboard`
    );
  };

  // Import Profile from JSON File (Restores Profile, Targets & Card View Settings)
  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const profileData = parsed.profile || parsed;

        if (!profileData || !profileData.name || !Array.isArray(profileData.items)) {
          showToast('Invalid profile JSON format');
          return;
        }

        // Restore cardViewSettings if present in profile share code
        let importedCardSettings: TargetCardViewSettings | undefined = undefined;
        if (profileData.cardViewSettings && typeof profileData.cardViewSettings === 'object') {
          const mergedSettings: TargetCardViewSettings = {
            ...cardViewSettings,
            ...profileData.cardViewSettings,
          };
          importedCardSettings = mergedSettings;
          setCardViewSettings(mergedSettings);
        }

        const newProfile: WatchlistProfile = {
          id: `prof_${Date.now()}`,
          name: profileData.name || 'Imported Profile',
          description: profileData.description || 'Imported profile offsets',
          targetApp: profileData.targetApp || 'com.game.sample',
          codeStylePreset: profileData.codeStylePreset || 'cpp_constexpr',
          customCodeStyleTemplate: profileData.customCodeStyleTemplate,
          cardViewSettings: importedCardSettings || profileData.cardViewSettings,
          groupOrder: Array.isArray(profileData.groupOrder) ? profileData.groupOrder : undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          items: profileData.items.map((it: any, idx: number) => {
            const isCustom = Boolean(it.isCustom || (!it.className && !it.memberName && it.customName));
            if (isCustom) {
              return {
                id: `t_${Date.now()}_${idx}`,
                isCustom: true,
                customName: it.customName || undefined,
                groupName: it.groupName || undefined,
                subGroupName: it.subGroupName || undefined,
                comment: it.comment || undefined,
                offsetHex: it.offsetHex || it.defaultOffset || undefined,
                defaultOffset: it.defaultOffset || it.offsetHex || undefined,
                resolved: Boolean(it.offsetHex || it.defaultOffset),
              };
            }
            return {
              id: `t_${Date.now()}_${idx}`,
              isCustom: false,
              customName: it.customName || undefined,
              groupName: it.groupName || undefined,
              subGroupName: it.subGroupName || undefined,
              assemblyName: it.assemblyName || undefined,
              className: it.className || '',
              memberName: it.memberName || '',
              kind: it.kind === 'METHOD' ? 'METHOD' : 'FIELD',
              comment: it.comment || '',
              offsetHex: it.offsetHex || undefined,
              rvaHex: it.rvaHex || undefined,
              isStatic: Boolean(it.isStatic),
              valueType: it.valueType || undefined,
              fallbackClassNames: Array.isArray(it.fallbackClassNames) ? it.fallbackClassNames : undefined,
              fallbackMemberNames: Array.isArray(it.fallbackMemberNames) ? it.fallbackMemberNames : undefined,
              resolved: Boolean(it.offsetHex || it.rvaHex),
            };
          }),
        };

        const updated = [newProfile, ...profiles];
        saveProfiles(updated);
        setActiveProfileId(newProfile.id);
        setSelectedProfileViewId(newProfile.id);
        showToast(
          `Imported profile "${newProfile.name}" (${newProfile.items.length} targets${
            importedCardSettings ? ' + card settings restored' : ''
          })`
        );
      } catch (err) {
        showToast('Failed to parse profile JSON file');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Delete Profile
  const handleDeleteProfile = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = profiles.filter((p) => p.id !== id);
    saveProfiles(next);
    if (activeProfileId === id) {
      setActiveProfileId(next[0]?.id || '');
    }
    if (selectedProfileViewId === id) {
      setSelectedProfileViewId(null);
    }
    showToast(next.length === 0 ? 'All profiles deleted' : 'Profile deleted');
  };

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

  // Open Edit Target Modal
  const handleOpenEditTarget = (item: WatchlistTargetItem) => {
    setEditingTargetItem(item);
    setEditTargetIsCustom(Boolean(item.isCustom));
    setEditTargetDefaultOffset(item.defaultOffset || item.offsetHex || item.rvaHex || '');
    setEditTargetCustomName(item.customName || '');
    setEditTargetAssemblyName(item.assemblyName || item.resolvedAssemblyName || '');
    setEditTargetNamespaceName(item.namespaceName || '');
    setEditTargetClassName(item.className ? (item.namespaceName ? `${item.namespaceName}::${item.className}` : item.className) : '');
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

  // Save Edit Target
  const handleSaveEditTarget = () => {
    if (!editingTargetItem || !activeProfile) return;

    if (editTargetIsCustom) {
      if (!editTargetCustomName.trim()) return;
    } else {
      if (!editTargetClassName.trim() || !editTargetMemberName.trim()) return;
    }

    let parsedNs = editTargetNamespaceName.trim() || undefined;
    let parsedClass = editTargetClassName.trim();
    if (parsedClass.includes('::')) {
      const parts = parsedClass.split('::');
      parsedNs = parts[0].trim() || undefined;
      parsedClass = parts.slice(1).join('::').trim();
    }

    const cleanOffset = editTargetDefaultOffset.trim();
    const formattedOffset = cleanOffset
      ? cleanOffset.startsWith('0x') || cleanOffset.startsWith('0X')
        ? cleanOffset
        : `0x${cleanOffset}`
      : undefined;

    const updatedItem: WatchlistTargetItem = editTargetIsCustom
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
          // If direct offset is provided or modified, update resolved offset
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

  // Add Target Item to Active Profile
  const handleAddTarget = () => {
    if (!activeProfile) return;

    if (newTargetIsCustom) {
      if (!newTargetCustomName.trim()) return;
    } else {
      if (!newTargetClassName.trim() || !newTargetMemberName.trim()) return;
    }

    let parsedNs = newTargetNamespaceName.trim() || undefined;
    let parsedClass = newTargetClassName.trim();
    if (parsedClass.includes('::')) {
      const parts = parsedClass.split('::');
      parsedNs = parts[0].trim() || undefined;
      parsedClass = parts.slice(1).join('::').trim();
    }

    const cleanOffset = newTargetDefaultOffset.trim();
    const formattedOffset = cleanOffset
      ? cleanOffset.startsWith('0x') || cleanOffset.startsWith('0X')
        ? cleanOffset
        : `0x${cleanOffset}`
      : undefined;

    const newItem: WatchlistTargetItem = newTargetIsCustom
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
    setNewTargetNamespaceName('');
    setNewTargetClassName('');
    setNewTargetMemberName('');
    setNewTargetComment('');
    setNewTargetFallbackClasses([]);
    setNewTargetFallbackMembers([]);
    setTempFallbackClassInput('');
    setTempFallbackMemberInput('');
    setIsAddTargetModalOpen(false);
    showToast(`Added target ${newItem.customName || `${newItem.className || ''}.${newItem.memberName || ''}`}`);
  };

  // Remove Item
  const handleRemoveTargetItem = (itemId: string) => {
    if (!activeProfile) return;
    const nextProfiles = profiles.map((p) =>
      p.id === activeProfile.id
        ? { ...p, items: p.items.filter((i) => i.id !== itemId), updatedAt: Date.now() }
        : p
    );
    saveProfiles(nextProfiles);
    showToast('Target removed');
  };

  // Filtered items
  const displayedItems = useMemo(() => {
    if (!activeProfile) return [];
    const lowerFilter = watchlistFilter.toLowerCase();
    return activeProfile.items.filter(
      (i) =>
        (i.customName && i.customName.toLowerCase().includes(lowerFilter)) ||
        (i.groupName && i.groupName.toLowerCase().includes(lowerFilter)) ||
        (i.subGroupName && i.subGroupName.toLowerCase().includes(lowerFilter)) ||
        (i.assemblyName && i.assemblyName.toLowerCase().includes(lowerFilter)) ||
        (i.resolvedAssemblyName && i.resolvedAssemblyName.toLowerCase().includes(lowerFilter)) ||
        (i.className && i.className.toLowerCase().includes(lowerFilter)) ||
        (i.memberName && i.memberName.toLowerCase().includes(lowerFilter)) ||
        (i.comment && i.comment.toLowerCase().includes(lowerFilter))
    );
  }, [activeProfile, watchlistFilter]);

  return (
    <div className="dashboard-workspace-container flex-1 flex flex-col h-full bg-[#18181A] text-[#E2E2E4] overflow-hidden relative">
      {/* Top Tab Navigation (Responsive Bar / Card Style on Tablet & Big Screen) */}
      <div className="dashboard-tab-bar bg-[#1E1E20] border-b border-[#2D2D30] px-1.5 sm:px-4 pt-1 sm:pt-2 pb-1 shrink-0">
        <div className="max-w-5xl mx-auto flex md:bg-[#141416] md:p-1 md:rounded-2xl md:border md:border-[#2D2D30] md:shadow-inner">
          <button
            onClick={() => setActiveTab('target')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[10px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1 sm:gap-2 ${
              activeTab === 'target'
                ? 'border-indigo-500 text-indigo-400 md:bg-indigo-600 md:text-white md:shadow-md'
                : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4] md:hover:bg-[#1C1C1F]'
            }`}
          >
            <Cpu className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Storage Dump</span>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[10px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1 sm:gap-2 ${
              activeTab === 'watchlist'
                ? 'border-indigo-500 text-indigo-400 md:bg-indigo-600 md:text-white md:shadow-md'
                : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4] md:hover:bg-[#1C1C1F]'
            }`}
          >
            <BookmarkPlus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Profiles & Offsets</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[10px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1 sm:gap-2 ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400 md:bg-indigo-600 md:text-white md:shadow-md'
                : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4] md:hover:bg-[#1C1C1F]'
            }`}
          >
            <History className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto w-full p-2 sm:p-4 flex flex-col gap-2.5 sm:gap-6 pb-20 sm:pb-24">
          {/* TAB 1: STORAGE DUMP SETUP */}
          {activeTab === 'target' && (
            <DashboardHeader
              cardViewSettings={cardViewSettings}
              loadedStorageFileName={loadedStorageFileName}
              loadedHeaderFileName={loadedHeaderFileName}
              parsedSummary={parsedSummary}
              storageMeta={storageMeta}
              onDumpCsUploaded={handleDumpCsUpload}
              onIl2cppHUploaded={handleIl2cppHUpload}
              isParsingDump={isParsingDump}
              parseProgress={parseProgress}
              activeProfileId={activeProfileId}
              setActiveProfileId={setActiveProfileId}
              profiles={profiles}
              handleScanProfile={handleScanProfile}
              isScanning={isScanning}
              activeProfile={activeProfile}
              scanLogs={scanLogs}
            />
          )}

          {/* TAB 2: PROFILE (OFFSETS & WATCHLIST) */}
          {activeTab === 'watchlist' && (
            <ProfileSidebar
              profiles={profiles}
              activeProfileId={activeProfileId}
              setActiveProfileId={setActiveProfileId}
              selectedProfileViewId={selectedProfileViewId}
              setSelectedProfileViewId={setSelectedProfileViewId}
              profileImportInputRef={profileImportInputRef}
              handleImportProfile={handleImportProfile}
              setIsNewProfileModalOpen={setIsNewProfileModalOpen}
              handleOpenEditProfile={handleOpenEditProfile}
              handleExportProfile={handleExportProfile}
              handleDeleteProfile={handleDeleteProfile}
              activeProfile={activeProfile}
              watchlistFilter={watchlistFilter}
              setWatchlistFilter={setWatchlistFilter}
              setIsCardSettingsModalOpen={setIsCardSettingsModalOpen}
              displayedItems={displayedItems}
              cardViewSettings={cardViewSettings}
              profileCardSettings={profileCardSettings}
              setIsProfileCardSettingsModalOpen={setIsProfileCardSettingsModalOpen}
              setViewingTargetItem={setViewingTargetItem}
              handleOpenEditTarget={handleOpenEditTarget}
              handleRemoveTargetItem={handleRemoveTargetItem}
              setIsAddTargetModalOpen={setIsAddTargetModalOpen}
              handleReorderTargets={handleReorderTargets}
              handleOpenAddTargetToGroup={handleOpenAddTargetToGroup}
              showToast={showToast}
              onNavigateToBrowser={onNavigateToBrowser}
              isDumpLoaded={Boolean(loadedStorageFileName || storageDumpName || il2cppEngine.getStorageMeta().dumpCsFileName || il2cppEngine.getAssemblies().length > 0)}
            />
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <HistoryTab
              scanHistory={scanHistory}
              onCopyText={onCopyText}
              handleOpenHistoryRecord={handleOpenHistoryRecord}
              saveHistory={saveHistory}
              showToast={showToast}
              setIsConfirmClearHistoryOpen={setIsConfirmClearHistoryOpen}
              cardViewSettings={historyCardSettings}
              setIsCardSettingsModalOpen={setIsHistoryCardSettingsModalOpen}
            />
          )}
        </div>
      </div>



      <CreateProfileModal
        isOpen={isNewProfileModalOpen}
        onClose={() => setIsNewProfileModalOpen(false)}
        newProfileName={newProfileName}
        setNewProfileName={setNewProfileName}
        newProfileDesc={newProfileDesc}
        setNewProfileDesc={setNewProfileDesc}
        newProfileCodeStyle={newProfileCodeStyle}
        setNewProfileCodeStyle={setNewProfileCodeStyle}
        newProfileCustomTemplate={newProfileCustomTemplate}
        setNewProfileCustomTemplate={setNewProfileCustomTemplate}
        handleCreateProfile={handleCreateProfile}
      />
      <EditProfileModal
        isOpen={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        editingProfile={editingProfile}
        editProfileName={editProfileName}
        setEditProfileName={setEditProfileName}
        editProfileDesc={editProfileDesc}
        setEditProfileDesc={setEditProfileDesc}
        editProfileCodeStyle={editProfileCodeStyle}
        setEditProfileCodeStyle={setEditProfileCodeStyle}
        editProfileCustomTemplate={editProfileCustomTemplate}
        setEditProfileCustomTemplate={setEditProfileCustomTemplate}
        handleSaveEditProfile={handleSaveEditProfile}
      />
      <AddTargetModal
        isOpen={isAddTargetModalOpen}
        activeProfile={activeProfile}
        onClose={() => setIsAddTargetModalOpen(false)}
        newTargetKind={newTargetKind}
        setNewTargetKind={setNewTargetKind}
        newTargetCustomName={newTargetCustomName}
        setNewTargetCustomName={setNewTargetCustomName}
        newTargetIsCustom={newTargetIsCustom}
        setNewTargetIsCustom={setNewTargetIsCustom}
        newTargetDefaultOffset={newTargetDefaultOffset}
        setNewTargetDefaultOffset={setNewTargetDefaultOffset}
        newTargetGroupName={newTargetGroupName}
        setNewTargetGroupName={setNewTargetGroupName}
        newTargetSubGroupName={newTargetSubGroupName}
        setNewTargetSubGroupName={setNewTargetSubGroupName}
        availableGroups={availableGroups}
        availableSubGroups={availableSubGroups}
        newTargetAssemblyName={newTargetAssemblyName}
        setNewTargetAssemblyName={setNewTargetAssemblyName}
        newTargetClassName={newTargetClassName}
        setNewTargetClassName={setNewTargetClassName}
        newTargetMemberName={newTargetMemberName}
        setNewTargetMemberName={setNewTargetMemberName}
        newTargetComment={newTargetComment}
        setNewTargetComment={setNewTargetComment}
        showAddFallbacks={showAddFallbacks}
        setShowAddFallbacks={setShowAddFallbacks}
        tempFallbackClassInput={tempFallbackClassInput}
        setTempFallbackClassInput={setTempFallbackClassInput}
        tempFallbackMemberInput={tempFallbackMemberInput}
        setTempFallbackMemberInput={setTempFallbackMemberInput}
        newTargetFallbackClasses={newTargetFallbackClasses}
        setNewTargetFallbackClasses={setNewTargetFallbackClasses}
        newTargetFallbackMembers={newTargetFallbackMembers}
        setNewTargetFallbackMembers={setNewTargetFallbackMembers}
        handleAddTarget={handleAddTarget}
      />
      <EditTargetModal
        isOpen={!!editingTargetItem}
        activeProfile={activeProfile}
        onClose={() => setEditingTargetItem(null)}
        editingTargetItem={editingTargetItem}
        editTargetKind={editTargetKind}
        setEditTargetKind={setEditTargetKind}
        editTargetCustomName={editTargetCustomName}
        setEditTargetCustomName={setEditTargetCustomName}
        editTargetIsCustom={editTargetIsCustom}
        setEditTargetIsCustom={setEditTargetIsCustom}
        editTargetDefaultOffset={editTargetDefaultOffset}
        setEditTargetDefaultOffset={setEditTargetDefaultOffset}
        editTargetAssemblyName={editTargetAssemblyName}
        setEditTargetAssemblyName={setEditTargetAssemblyName}
        editTargetClassName={editTargetClassName}
        setEditTargetClassName={setEditTargetClassName}
        editTargetMemberName={editTargetMemberName}
        setEditTargetMemberName={setEditTargetMemberName}
        editTargetComment={editTargetComment}
        setEditTargetComment={setEditTargetComment}
        showEditFallbacks={showEditFallbacks}
        setShowEditFallbacks={setShowEditFallbacks}
        editTempFallbackClassInput={editTempFallbackClassInput}
        setEditTempFallbackClassInput={setEditTempFallbackClassInput}
        editTempFallbackMemberInput={editTempFallbackMemberInput}
        setEditTempFallbackMemberInput={setEditTempFallbackMemberInput}
        editTargetFallbackClasses={editTargetFallbackClasses}
        setEditTargetFallbackClasses={setEditTargetFallbackClasses}
        editTargetFallbackMembers={editTargetFallbackMembers}
        setEditTargetFallbackMembers={setEditTargetFallbackMembers}
        handleSaveEditTarget={handleSaveEditTarget}
        handleOpenEditTarget={handleOpenEditTarget}
      />
      <TargetDetailModal
        isOpen={!!viewingTargetItem}
        onClose={() => setViewingTargetItem(null)}
        viewingTargetItem={viewingTargetItem}
        setViewingTargetItem={setViewingTargetItem}
        activeProfile={activeProfile}
        handleOpenEditTarget={handleOpenEditTarget}
        onCopyText={onCopyText}
        onNavigateToBrowser={onNavigateToBrowser}
        isDumpLoaded={Boolean(loadedStorageFileName || storageDumpName || il2cppEngine.getStorageMeta().dumpCsFileName || il2cppEngine.getAssemblies().length > 0)}
      />
      <HistoryDetailModal
        isOpen={!!selectedHistoryRecord}
        onCopyText={onCopyText}
        onClose={() => setSelectedHistoryRecord(null)}
        selectedHistoryRecord={selectedHistoryRecord}
        historyModalTab={historyModalTab}
        setHistoryModalTab={setHistoryModalTab}
        historyModalCodeStyle={historyModalCodeStyle}
        setHistoryModalCodeStyle={setHistoryModalCodeStyle}
        historyModalCustomTemplate={historyModalCustomTemplate}
        setHistoryModalCustomTemplate={setHistoryModalCustomTemplate}
        showToast={showToast}
      />
      <CardSettingsModal
        showToast={showToast}
        isOpen={isCardSettingsModalOpen}
        onClose={() => setIsCardSettingsModalOpen(false)}
        config={cardViewSettings}
        setConfig={setCardViewSettings}
      />
      <ProfileCardSettingsModal
        showToast={showToast}
        isOpen={isProfileCardSettingsModalOpen}
        onClose={() => setIsProfileCardSettingsModalOpen(false)}
        config={profileCardSettings}
        setConfig={setProfileCardSettings}
      />
      <HistoryCardSettingsModal
        showToast={showToast}
        isOpen={isHistoryCardSettingsModalOpen}
        onClose={() => setIsHistoryCardSettingsModalOpen(false)}
        config={historyCardSettings}
        setConfig={setHistoryCardSettings}
      />

      {/* Confirmation Modal: Clear All History */}
      <ConfirmDialog
        isOpen={isConfirmClearHistoryOpen}
        onClose={() => setIsConfirmClearHistoryOpen(false)}
        onConfirm={() => {
          saveHistory([]);
          showToast('All scan history cleared');
        }}
        title="Clear All History?"
        subtitle={`This will permanently delete all ${scanHistory.length} scan logs.`}
        description="Are you sure you want to clear your scan history logs? This action cannot be undone."
        confirmText="Delete All"
      />
    </div>
  );
};
