import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Cpu, BookmarkPlus, Trash2, History
} from 'lucide-react';
import { AddTargetModal } from "./modals/AddTargetModal";
import { EditTargetModal } from "./modals/EditTargetModal";
import { CreateProfileModal } from "./modals/CreateProfileModal";
import { EditProfileModal } from "./modals/EditProfileModal";
import { TargetDetailModal } from "./modals/TargetDetailModal";
import { HistoryDetailModal } from "./modals/HistoryDetailModal";
import { CardSettingsModal } from "./modals/CardSettingsModal";
import { ProfileCardSettingsModal } from "./modals/ProfileCardSettingsModal";
import { HistoryCardSettingsModal } from "./modals/HistoryCardSettingsModal";
import { HistoryTab } from "./dashboard/HistoryTab";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { ProfileSidebar } from "./dashboard/ProfileSidebar";

import { useWatchlistManager } from '../hooks/useWatchlistManager';
import { useMemoryScanner } from '../hooks/useMemoryScanner';

import {
  ProcessDescriptor,
  TargetSourceMode,
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

import { DEFAULT_SCAN_HISTORY, DEFAULT_PROFILES } from '../data/tempData';

interface MainDashboardProps {
  currentProcess: ProcessDescriptor | null;
  storageDumpName?: string | null;
  onStorageDumpLoaded?: (fileName: string | null) => void;
  onOpenProcessPicker: () => void;
  onNavigateToBrowser?: (classIndex?: number) => void;
  onCopyText: (text: string, label: string) => void;
  showToast: (msg: string) => void;
}




export const MainDashboard: React.FC<MainDashboardProps> = ({
  currentProcess,
  storageDumpName,
  onStorageDumpLoaded,
  onOpenProcessPicker,
  onCopyText,
  showToast,
}) => {
  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<'target' | 'watchlist' | 'history'>('target');

  // Source Selection Mode: 'live' (Target Process) or 'storage' (dump.cs / file storage)
  const [sourceMode, setSourceMode] = useState<TargetSourceMode>('live');

  // Storage dump upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadedStorageFileName, setLoadedStorageFileName] = useState<string | null>(storageDumpName || null);
  const [isParsingDump, setIsParsingDump] = useState(false);
  const [parsedSummary, setParsedSummary] = useState<{
    classes: number;
    methods: number;
    fields: number;
  } | null>(null);

  // Profiles State
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    selectedProfileViewId,
    setSelectedProfileViewId,
    activeProfile,
    saveProfiles,
  } = useWatchlistManager(DEFAULT_PROFILES);

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
  } = useMemoryScanner(DEFAULT_SCAN_HISTORY);

  // Modal / Form States
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileCodeStyle, setNewProfileCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [newProfileCustomTemplate, setNewProfileCustomTemplate] = useState('constexpr uintptr_t {name} = {offset};');

  const [isAddTargetModalOpen, setIsAddTargetModalOpen] = useState(false);
  const [newTargetCustomName, setNewTargetCustomName] = useState('');
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
  const [editTargetCustomName, setEditTargetCustomName] = useState('');
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
      sourceMode,
      currentProcess,
      loadedStorageFileName,
      profiles,
      saveProfiles,
      showToast
    );
  }, [doScanProfile, activeProfile, sourceMode, currentProcess, loadedStorageFileName, profiles, saveProfiles, showToast]);

  // Handle Storage dump.cs File Upload
  const handleDumpFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDump(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = il2cppEngine.parseDumpCsText(content, file.name);
        setLoadedStorageFileName(file.name);
        if (onStorageDumpLoaded) {
          onStorageDumpLoaded(file.name);
        }
        setParsedSummary({
          classes: result.classesCount,
          methods: result.methodsCount,
          fields: result.fieldsCount,
        });
        setIsParsingDump(false);
        showToast(`Loaded ${file.name} (${result.classesCount} classes parsed)`);
      } catch (err) {
        setIsParsingDump(false);
        showToast('Failed to parse dump file');
      }
    };
    reader.readAsText(file);
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

  // Restore / Reset to Starter Profiles (preserved for future use)
  // const handleResetDefaultProfiles = () => {
  //   saveProfiles(DEFAULT_PROFILES);
  //   setActiveProfileId(DEFAULT_PROFILES[0].id);
  //   showToast('Loaded 3 starter profiles with 15 verified targets');
  // };

  // Export / Share Profile as JSON
  const handleExportProfile = (prof: WatchlistProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: {
        name: prof.name,
        description: prof.description,
        targetApp: prof.targetApp,
        codeStylePreset: prof.codeStylePreset || 'cpp_constexpr',
        customCodeStyleTemplate: prof.customCodeStyleTemplate,
        items: prof.items.map((item) => ({
          customName: item.customName,
          className: item.className,
          memberName: item.memberName,
          kind: item.kind,
          comment: item.comment,
          fallbackClassNames: item.fallbackClassNames,
          fallbackMemberNames: item.fallbackMemberNames,
        })),
      },
    };

    const jsonStr = JSON.stringify(exportData, null, 2);

    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prof.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_profile.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback
    }

    navigator.clipboard?.writeText(jsonStr).catch(() => {});
    showToast(`Exported "${prof.name}" JSON file to your downloads & clipboard!`);
  };

  // Import Profile from JSON File
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

        const newProfile: WatchlistProfile = {
          id: `prof_${Date.now()}`,
          name: profileData.name || 'Imported Profile',
          description: profileData.description || 'Imported profile offsets',
          targetApp: profileData.targetApp || 'com.game.sample',
          codeStylePreset: profileData.codeStylePreset || 'cpp_constexpr',
          customCodeStyleTemplate: profileData.customCodeStyleTemplate,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          items: profileData.items.map((it: any, idx: number) => ({
            id: `t_${Date.now()}_${idx}`,
            customName: it.customName || undefined,
            className: it.className || '',
            memberName: it.memberName || '',
            kind: it.kind === 'METHOD' ? 'METHOD' : 'FIELD',
            comment: it.comment || '',
            fallbackClassNames: Array.isArray(it.fallbackClassNames) ? it.fallbackClassNames : undefined,
            fallbackMemberNames: Array.isArray(it.fallbackMemberNames) ? it.fallbackMemberNames : undefined,
          })),
        };

        const updated = [newProfile, ...profiles];
        saveProfiles(updated);
        setActiveProfileId(newProfile.id);
        setSelectedProfileViewId(newProfile.id);
        showToast(`Imported profile "${newProfile.name}" (${newProfile.items.length} targets)`);
      } catch (err) {
        showToast('Failed to parse profile JSON file');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Delete Profile
  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      showToast('You must keep at least one profile.');
      return;
    }
    const next = profiles.filter((p) => p.id !== id);
    saveProfiles(next);
    if (activeProfileId === id) {
      setActiveProfileId(next[0].id);
    }
    if (selectedProfileViewId === id) {
      setSelectedProfileViewId(null);
    }
    showToast('Profile deleted');
  };

  // Open Edit Target Modal
  const handleOpenEditTarget = (item: WatchlistTargetItem) => {
    setEditingTargetItem(item);
    setEditTargetCustomName(item.customName || '');
    setEditTargetClassName(item.className);
    setEditTargetMemberName(item.memberName);
    setEditTargetKind(item.kind);
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
    if (!editingTargetItem || !activeProfile || !editTargetClassName.trim() || !editTargetMemberName.trim()) return;

    const updatedItem: WatchlistTargetItem = {
      ...editingTargetItem,
      customName: editTargetCustomName.trim() || undefined,
      className: editTargetClassName.trim(),
      memberName: editTargetMemberName.trim(),
      kind: editTargetKind,
      comment: editTargetComment.trim() || undefined,
      fallbackClassNames: editTargetFallbackClasses.length > 0 ? editTargetFallbackClasses : undefined,
      fallbackMemberNames: editTargetFallbackMembers.length > 0 ? editTargetFallbackMembers : undefined,
      // Reset resolved states if key details changed
      resolved: false,
      offsetHex: undefined,
      rvaHex: undefined,
      vaHex: undefined,
      resolvedViaFallback: false,
      resolvedClassName: undefined,
      resolvedMemberName: undefined,
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
    showToast(`Updated target ${updatedItem.customName || `${updatedItem.className}.${updatedItem.memberName}`}`);
  };

  // Add Target Item to Active Profile
  const handleAddTarget = () => {
    if (!newTargetClassName.trim() || !newTargetMemberName.trim() || !activeProfile) return;

    const newItem: WatchlistTargetItem = {
      id: `t_${Date.now()}`,
      customName: newTargetCustomName.trim() || undefined,
      className: newTargetClassName.trim(),
      memberName: newTargetMemberName.trim(),
      kind: newTargetKind,
      comment: newTargetComment.trim() || undefined,
      fallbackClassNames: newTargetFallbackClasses.length > 0 ? newTargetFallbackClasses : undefined,
      fallbackMemberNames: newTargetFallbackMembers.length > 0 ? newTargetFallbackMembers : undefined,
    };

    const nextProfiles = profiles.map((p) =>
      p.id === activeProfile.id ? { ...p, items: [...p.items, newItem], updatedAt: Date.now() } : p
    );
    saveProfiles(nextProfiles);

    setNewTargetCustomName('');
    setNewTargetClassName('');
    setNewTargetMemberName('');
    setNewTargetComment('');
    setNewTargetFallbackClasses([]);
    setNewTargetFallbackMembers([]);
    setTempFallbackClassInput('');
    setTempFallbackMemberInput('');
    setIsAddTargetModalOpen(false);
    showToast(`Added target ${newItem.customName || `${newItem.className}.${newItem.memberName}`}`);
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
        i.className.toLowerCase().includes(lowerFilter) ||
        i.memberName.toLowerCase().includes(lowerFilter) ||
        (i.comment && i.comment.toLowerCase().includes(lowerFilter))
    );
  }, [activeProfile, watchlistFilter]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#18181A] text-[#E2E2E4] overflow-hidden relative">
      {/* Top Tab Navigation (Responsive Bar / Card Style on Tablet & Big Screen) */}
      <div className="bg-[#1E1E20] border-b border-[#2D2D30] px-2 sm:px-4 pt-1.5 sm:pt-2 pb-1.5 shrink-0">
        <div className="max-w-5xl mx-auto flex md:bg-[#141416] md:p-1 md:rounded-2xl md:border md:border-[#2D2D30] md:shadow-inner">
          <button
            onClick={() => setActiveTab('target')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[11px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1.5 sm:gap-2 ${
              activeTab === 'target'
                ? 'border-indigo-500 text-indigo-400 md:bg-indigo-600 md:text-white md:shadow-md'
                : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4] md:hover:bg-[#1C1C1F]'
            }`}
          >
            <Cpu className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Target Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[11px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1.5 sm:gap-2 ${
              activeTab === 'watchlist'
                ? 'border-indigo-500 text-indigo-400 md:bg-indigo-600 md:text-white md:shadow-md'
                : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4] md:hover:bg-[#1C1C1F]'
            }`}
          >
            <BookmarkPlus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[11px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1.5 sm:gap-2 ${
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
        <div className="max-w-5xl mx-auto w-full p-2.5 sm:p-4 flex flex-col gap-3 sm:gap-6 pb-24">
          {/* TAB 1: TARGET SETUP */}
          {activeTab === 'target' && (
            <DashboardHeader
              sourceMode={sourceMode}
              setSourceMode={setSourceMode}
              cardViewSettings={cardViewSettings}
              currentProcess={currentProcess}
              onOpenProcessPicker={onOpenProcessPicker}
              loadedStorageFileName={loadedStorageFileName}
              parsedSummary={parsedSummary}
              fileInputRef={fileInputRef}
              handleDumpFileUpload={handleDumpFileUpload}
              isParsingDump={isParsingDump}
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
      {isConfirmClearHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start sm:items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 mt-20 sm:mt-0 mb-auto sm:my-auto shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="p-1.5 sm:p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl sm:rounded-2xl">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm sm:text-base font-bold text-[#E2E2E4]">Clear All History?</h3>
                <p className="text-[10px] sm:text-xs text-[#8E8E93]">This will permanently delete all {scanHistory.length} scan logs.</p>
              </div>
            </div>

            <p className="text-[10px] sm:text-xs text-[#A0A0A5] leading-relaxed bg-[#141416] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#2D2D30]">
              Are you sure you want to clear your scan history logs? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setIsConfirmClearHistoryOpen(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#8E8E93] hover:text-white bg-[#262629] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveHistory([]);
                  setIsConfirmClearHistoryOpen(false);
                  showToast('All scan history cleared');
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-md shadow-red-600/30 transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
