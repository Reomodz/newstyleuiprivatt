import React, { useState, useMemo, useCallback } from 'react';
import { Cpu, BookmarkPlus, History } from 'lucide-react';
import { HistoryTab } from './dashboard/HistoryTab';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { ProfileSidebar } from './dashboard/ProfileSidebar';
import { MainDashboardModals } from './dashboard/MainDashboardModals';

import { useWatchlistManager } from '../hooks/useWatchlistManager';
import { useMemoryScanner } from '../hooks/useMemoryScanner';
import { useDumpManager } from '../hooks/useDumpManager';
import { useDashboardSettings } from '../hooks/useDashboardSettings';
import { useTargetForms } from '../hooks/useTargetForms';
import { useProfileExportImport } from '../hooks/useProfileExportImport';

import { ProcessDescriptor, WatchlistTargetItem } from '../types';
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
  activeTab?: 'target' | 'watchlist' | 'history';
  onTabChange?: (tab: 'target' | 'watchlist' | 'history') => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  currentProcess,
  storageDumpName,
  onStorageDumpLoaded,
  onNavigateToBrowser,
  onCopyText,
  showToast,
  watchlistManager,
  activeTab: controlledActiveTab,
  onTabChange,
}) => {
  // Navigation State
  const [internalActiveTab, setInternalActiveTab] = useState<'target' | 'watchlist' | 'history'>('target');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: 'target' | 'watchlist' | 'history') => {
    setInternalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Watchlist & Profiles State
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

  // Dump Manager Hook
  const {
    storageMeta,
    loadedStorageFileName,
    loadedHeaderFileName,
    isParsingDump,
    parseProgress,
    parsedSummary,
    handleDumpCsUpload,
    handleIl2cppHUpload,
    handleUnloadDumpCs,
    handleUnloadIl2cppH,
  } = useDumpManager({
    storageDumpName,
    onStorageDumpLoaded,
    showToast,
  });

  // Settings & Modal State Hook
  const {
    profileCardSettings,
    setProfileCardSettings,
    isProfileCardSettingsModalOpen,
    setIsProfileCardSettingsModalOpen,
    cardViewSettings,
    setCardViewSettings,
    isCardSettingsModalOpen,
    setIsCardSettingsModalOpen,
    historyCardSettings,
    setHistoryCardSettings,
    isHistoryCardSettingsModalOpen,
    setIsHistoryCardSettingsModalOpen,
    jsonDiagnostic,
    setJsonDiagnostic,
    isJsonDiagModalOpen,
    setIsJsonDiagModalOpen,
    viewingTargetItem,
    setViewingTargetItem,
    selectedHistoryRecord,
    setSelectedHistoryRecord,
    historyModalCodeStyle,
    setHistoryModalCodeStyle,
    historyModalCustomTemplate,
    setHistoryModalCustomTemplate,
    historyModalTab,
    setHistoryModalTab,
    handleOpenHistoryRecord,
    isConfirmClearHistoryOpen,
    setIsConfirmClearHistoryOpen,
  } = useDashboardSettings(activeProfile);

  // Target & Profile Forms Hook
  const {
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
  } = useTargetForms({
    profiles,
    activeProfile,
    saveProfiles,
    setActiveProfileId,
    setSelectedProfileViewId,
    showToast,
  });

  // Profile Export & Import Hook
  const {
    profileImportInputRef,
    handleExportProfile,
    handleImportProfile,
    handleApplyImportedProfile,
    handleDeleteProfile,
  } = useProfileExportImport({
    profiles,
    saveProfiles,
    activeProfileId,
    setActiveProfileId,
    selectedProfileViewId,
    setSelectedProfileViewId,
    cardViewSettings,
    setCardViewSettings,
    setJsonDiagnostic,
    setIsJsonDiagModalOpen,
    showToast,
  });

  // Memory Scanner Hook
  const {
    scanHistory,
    saveHistory,
    isScanning,
    scanLogs,
    handleScanProfile: doScanProfile,
  } = useMemoryScanner();

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

  // Watchlist Filter State
  const [watchlistFilter, setWatchlistFilter] = useState('');

  // Filtered displayed targets
  const displayedItems = useMemo<WatchlistTargetItem[]>(() => {
    if (!activeProfile) return [];
    if (!watchlistFilter.trim()) return activeProfile.items;
    const query = watchlistFilter.toLowerCase().trim();
    return activeProfile.items.filter((item) => {
      const matchCustomName = item.customName?.toLowerCase().includes(query);
      const matchMember = item.memberName?.toLowerCase().includes(query);
      const matchClass = item.className?.toLowerCase().includes(query);
      const matchGroup = item.groupName?.toLowerCase().includes(query);
      const matchSubGroup = item.subGroupName?.toLowerCase().includes(query);
      const matchOffset = item.offsetHex?.toLowerCase().includes(query);
      const matchRva = item.rvaHex?.toLowerCase().includes(query);
      const matchDefault = item.defaultOffset?.toLowerCase().includes(query);
      const matchComment = item.comment?.toLowerCase().includes(query);
      return (
        matchCustomName ||
        matchMember ||
        matchClass ||
        matchGroup ||
        matchSubGroup ||
        matchOffset ||
        matchRva ||
        matchDefault ||
        matchComment
      );
    });
  }, [activeProfile, watchlistFilter]);

  const isDumpLoaded = Boolean(
    loadedStorageFileName ||
    storageDumpName ||
    il2cppEngine.getStorageMeta().dumpCsFileName ||
    il2cppEngine.getAssemblies().length > 0
  );

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-transparent text-[#E2E2E4] relative overflow-hidden">
      {/* Main Tab Content View */}
      <div className="flex-1 overflow-y-auto w-full min-w-0">
        <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 flex flex-col gap-2.5 sm:gap-6 pb-28 sm:pb-32">
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
              onUnloadDumpCs={handleUnloadDumpCs}
              onUnloadIl2cppH={handleUnloadIl2cppH}
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
              isDumpLoaded={isDumpLoaded}
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

      {/* Floating Bottom Curved Navigation Dock */}
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[333px] max-w-[94vw] pointer-events-auto pb-[env(safe-area-inset-bottom,0px)]">
        <div className="h-[45px] flex items-center bg-[#16161A]/95 backdrop-blur-2xl px-1.5 sm:px-2 rounded-full border border-white/15 shadow-2xl shadow-black/90 ring-1 ring-white/10 justify-between gap-1 relative overflow-hidden">
          <button
            onClick={() => setActiveTab('target')}
            className={`flex-1 h-[35px] flex items-center justify-center gap-1.5 px-2.5 rounded-full text-xs font-bold transition-all duration-200 relative group cursor-pointer ${
              activeTab === 'target'
                ? 'text-white bg-white/10 shadow-md border border-white/10'
                : 'text-[#9E9EA5] hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu
              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                activeTab === 'target' ? 'text-indigo-400' : 'text-[#9E9EA5] group-hover:text-white'
              }`}
              style={
                activeTab === 'target'
                  ? { color: 'var(--app-accent-hex, #818cf8)' }
                  : undefined
              }
            />
            <span
              className="whitespace-nowrap transition-colors text-xs"
              style={
                activeTab === 'target'
                  ? { color: 'var(--app-accent-hex, #818cf8)' }
                  : undefined
              }
            >
              Dump
            </span>

            {/* Curved Down Line Underline Indicator */}
            {activeTab === 'target' && (
              <span
                className="absolute bottom-0.5 left-2.5 right-2.5 h-0.5 rounded-full transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: 'var(--app-accent-hex, #6366f1)',
                  boxShadow: '0 0 10px rgba(var(--app-accent-rgb, 99, 102, 241), 0.8)',
                }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 h-[35px] flex items-center justify-center gap-1.5 px-2.5 rounded-full text-xs font-bold transition-all duration-200 relative group cursor-pointer ${
              activeTab === 'watchlist'
                ? 'text-white bg-white/10 shadow-md border border-white/10'
                : 'text-[#9E9EA5] hover:text-white hover:bg-white/5'
            }`}
          >
            <BookmarkPlus
              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                activeTab === 'watchlist' ? 'text-indigo-400' : 'text-[#9E9EA5] group-hover:text-white'
              }`}
              style={
                activeTab === 'watchlist'
                  ? { color: 'var(--app-accent-hex, #818cf8)' }
                  : undefined
              }
            />
            <span
              className="whitespace-nowrap transition-colors text-xs"
              style={
                activeTab === 'watchlist'
                  ? { color: 'var(--app-accent-hex, #818cf8)' }
                  : undefined
              }
            >
              Profiles
            </span>

            {/* Curved Down Line Underline Indicator */}
            {activeTab === 'watchlist' && (
              <span
                className="absolute bottom-0.5 left-2.5 right-2.5 h-0.5 rounded-full transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: 'var(--app-accent-hex, #6366f1)',
                  boxShadow: '0 0 10px rgba(var(--app-accent-rgb, 99, 102, 241), 0.8)',
                }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 h-[35px] flex items-center justify-center gap-1.5 px-2.5 rounded-full text-xs font-bold transition-all duration-200 relative group cursor-pointer ${
              activeTab === 'history'
                ? 'text-white bg-white/10 shadow-md border border-white/10'
                : 'text-[#9E9EA5] hover:text-white hover:bg-white/5'
            }`}
          >
            <History
              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                activeTab === 'history' ? 'text-indigo-400' : 'text-[#9E9EA5] group-hover:text-white'
              }`}
              style={
                activeTab === 'history'
                  ? { color: 'var(--app-accent-hex, #818cf8)' }
                  : undefined
              }
            />
            <span
              className="whitespace-nowrap transition-colors text-xs"
              style={
                activeTab === 'history'
                  ? { color: 'var(--app-accent-hex, #818cf8)' }
                  : undefined
              }
            >
              History
            </span>

            {/* Curved Down Line Underline Indicator */}
            {activeTab === 'history' && (
              <span
                className="absolute bottom-0.5 left-2.5 right-2.5 h-0.5 rounded-full transition-all duration-300 shadow-lg"
                style={{
                  backgroundColor: 'var(--app-accent-hex, #6366f1)',
                  boxShadow: '0 0 10px rgba(var(--app-accent-rgb, 99, 102, 241), 0.8)',
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Dialogs & Modals */}
      <MainDashboardModals
        isNewProfileModalOpen={isNewProfileModalOpen}
        setIsNewProfileModalOpen={setIsNewProfileModalOpen}
        newProfileName={newProfileName}
        setNewProfileName={setNewProfileName}
        newProfileDesc={newProfileDesc}
        setNewProfileDesc={setNewProfileDesc}
        newProfileCodeStyle={newProfileCodeStyle}
        setNewProfileCodeStyle={setNewProfileCodeStyle}
        newProfileCustomTemplate={newProfileCustomTemplate}
        setNewProfileCustomTemplate={setNewProfileCustomTemplate}
        handleCreateProfile={handleCreateProfile}

        editingProfile={editingProfile}
        setEditingProfile={setEditingProfile}
        editProfileName={editProfileName}
        setEditProfileName={setEditProfileName}
        editProfileDesc={editProfileDesc}
        setEditProfileDesc={setEditProfileDesc}
        editProfileCodeStyle={editProfileCodeStyle}
        setEditProfileCodeStyle={setEditProfileCodeStyle}
        editProfileCustomTemplate={editProfileCustomTemplate}
        setEditProfileCustomTemplate={setEditProfileCustomTemplate}
        handleSaveEditProfile={handleSaveEditProfile}

        isAddTargetModalOpen={isAddTargetModalOpen}
        setIsAddTargetModalOpen={setIsAddTargetModalOpen}
        activeProfile={activeProfile}
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

        editingTargetItem={editingTargetItem}
        setEditingTargetItem={setEditingTargetItem}
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

        viewingTargetItem={viewingTargetItem}
        setViewingTargetItem={setViewingTargetItem}
        onCopyText={onCopyText}
        onNavigateToBrowser={onNavigateToBrowser}
        isDumpLoaded={isDumpLoaded}

        selectedHistoryRecord={selectedHistoryRecord}
        setSelectedHistoryRecord={setSelectedHistoryRecord}
        historyModalTab={historyModalTab}
        setHistoryModalTab={setHistoryModalTab}
        historyModalCodeStyle={historyModalCodeStyle}
        setHistoryModalCodeStyle={setHistoryModalCodeStyle}
        historyModalCustomTemplate={historyModalCustomTemplate}
        setHistoryModalCustomTemplate={setHistoryModalCustomTemplate}

        isCardSettingsModalOpen={isCardSettingsModalOpen}
        setIsCardSettingsModalOpen={setIsCardSettingsModalOpen}
        cardViewSettings={cardViewSettings}
        setCardViewSettings={setCardViewSettings}

        isProfileCardSettingsModalOpen={isProfileCardSettingsModalOpen}
        setIsProfileCardSettingsModalOpen={setIsProfileCardSettingsModalOpen}
        profileCardSettings={profileCardSettings}
        setProfileCardSettings={setProfileCardSettings}

        isHistoryCardSettingsModalOpen={isHistoryCardSettingsModalOpen}
        setIsHistoryCardSettingsModalOpen={setIsHistoryCardSettingsModalOpen}
        historyCardSettings={historyCardSettings}
        setHistoryCardSettings={setHistoryCardSettings}

        isJsonDiagModalOpen={isJsonDiagModalOpen}
        setIsJsonDiagModalOpen={setIsJsonDiagModalOpen}
        jsonDiagnostic={jsonDiagnostic}
        setJsonDiagnostic={setJsonDiagnostic}
        handleApplyImportedProfile={handleApplyImportedProfile}

        isConfirmClearHistoryOpen={isConfirmClearHistoryOpen}
        setIsConfirmClearHistoryOpen={setIsConfirmClearHistoryOpen}
        scanHistory={scanHistory}
        saveHistory={saveHistory}

        showToast={showToast}
      />
    </div>
  );
};
