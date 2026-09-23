import React from 'react';
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
  JsonDiagnosticModal,
} from '../modals';
import { ConfirmDialog } from '../ui';
import {
  WatchlistProfile,
  WatchlistTargetItem,
  ScanHistoryRecord,
  CodeStylePreset,
  TargetCardViewSettings,
  ProfileCardViewSettings,
  HistoryCardViewSettings,
} from '../../types';
import { JsonDiagnosticResult } from '../../utils/jsonValidator';

interface MainDashboardModalsProps {
  // Create Profile Modal
  isNewProfileModalOpen: boolean;
  setIsNewProfileModalOpen: (open: boolean) => void;
  newProfileName: string;
  setNewProfileName: (val: string) => void;
  newProfileDesc: string;
  setNewProfileDesc: (val: string) => void;
  newProfileCodeStyle: CodeStylePreset;
  setNewProfileCodeStyle: (style: CodeStylePreset) => void;
  newProfileCustomTemplate: string;
  setNewProfileCustomTemplate: React.Dispatch<React.SetStateAction<string>>;
  handleCreateProfile: () => void;

  // Edit Profile Modal
  editingProfile: WatchlistProfile | null;
  setEditingProfile: (prof: WatchlistProfile | null) => void;
  editProfileName: string;
  setEditProfileName: (val: string) => void;
  editProfileDesc: string;
  setEditProfileDesc: (val: string) => void;
  editProfileCodeStyle: CodeStylePreset;
  setEditProfileCodeStyle: (style: CodeStylePreset) => void;
  editProfileCustomTemplate: string;
  setEditProfileCustomTemplate: React.Dispatch<React.SetStateAction<string>>;
  handleSaveEditProfile: () => void;

  // Add Target Modal
  isAddTargetModalOpen: boolean;
  setIsAddTargetModalOpen: (open: boolean) => void;
  activeProfile?: WatchlistProfile;
  newTargetKind: 'FIELD' | 'METHOD';
  setNewTargetKind: (kind: 'FIELD' | 'METHOD') => void;
  newTargetCustomName: string;
  setNewTargetCustomName: (val: string) => void;
  newTargetIsCustom: boolean;
  setNewTargetIsCustom: (val: boolean) => void;
  newTargetDefaultOffset: string;
  setNewTargetDefaultOffset: (val: string) => void;
  newTargetGroupName: string;
  setNewTargetGroupName: (val: string) => void;
  newTargetSubGroupName: string;
  setNewTargetSubGroupName: (val: string) => void;
  availableGroups: string[];
  availableSubGroups: string[];
  newTargetAssemblyName: string;
  setNewTargetAssemblyName: (val: string) => void;
  newTargetClassName: string;
  setNewTargetClassName: (val: string) => void;
  newTargetMemberName: string;
  setNewTargetMemberName: (val: string) => void;
  newTargetComment: string;
  setNewTargetComment: (val: string) => void;
  showAddFallbacks: boolean;
  setShowAddFallbacks: (val: boolean) => void;
  tempFallbackClassInput: string;
  setTempFallbackClassInput: (val: string) => void;
  tempFallbackMemberInput: string;
  setTempFallbackMemberInput: (val: string) => void;
  newTargetFallbackClasses: string[];
  setNewTargetFallbackClasses: React.Dispatch<React.SetStateAction<string[]>>;
  newTargetFallbackMembers: string[];
  setNewTargetFallbackMembers: React.Dispatch<React.SetStateAction<string[]>>;
  handleAddTarget: () => void;

  // Edit Target Modal
  editingTargetItem: WatchlistTargetItem | null;
  setEditingTargetItem: (item: WatchlistTargetItem | null) => void;
  editTargetKind: 'FIELD' | 'METHOD';
  setEditTargetKind: (kind: 'FIELD' | 'METHOD') => void;
  editTargetCustomName: string;
  setEditTargetCustomName: (val: string) => void;
  editTargetIsCustom: boolean;
  setEditTargetIsCustom: (val: boolean) => void;
  editTargetDefaultOffset: string;
  setEditTargetDefaultOffset: (val: string) => void;
  editTargetAssemblyName: string;
  setEditTargetAssemblyName: (val: string) => void;
  editTargetClassName: string;
  setEditTargetClassName: (val: string) => void;
  editTargetMemberName: string;
  setEditTargetMemberName: (val: string) => void;
  editTargetComment: string;
  setEditTargetComment: (val: string) => void;
  showEditFallbacks: boolean;
  setShowEditFallbacks: (val: boolean) => void;
  editTempFallbackClassInput: string;
  setEditTempFallbackClassInput: (val: string) => void;
  editTempFallbackMemberInput: string;
  setEditTempFallbackMemberInput: (val: string) => void;
  editTargetFallbackClasses: string[];
  setEditTargetFallbackClasses: React.Dispatch<React.SetStateAction<string[]>>;
  editTargetFallbackMembers: string[];
  setEditTargetFallbackMembers: React.Dispatch<React.SetStateAction<string[]>>;
  handleSaveEditTarget: () => void;
  handleOpenEditTarget: (item: WatchlistTargetItem) => void;

  // Viewing Target Detail Modal
  viewingTargetItem: WatchlistTargetItem | null;
  setViewingTargetItem: React.Dispatch<React.SetStateAction<WatchlistTargetItem | null>>;
  onCopyText: (text: string, label: string) => void;
  onNavigateToBrowser?: (classIndex?: number, memberKind?: 'FIELD' | 'METHOD', memberName?: string) => void;
  isDumpLoaded: boolean;

  // History Detail Modal
  selectedHistoryRecord: ScanHistoryRecord | null;
  setSelectedHistoryRecord: (rec: ScanHistoryRecord | null) => void;
  historyModalTab: 'targets' | 'code';
  setHistoryModalTab: (tab: 'targets' | 'code') => void;
  historyModalCodeStyle: CodeStylePreset;
  setHistoryModalCodeStyle: (style: CodeStylePreset) => void;
  historyModalCustomTemplate: string;
  setHistoryModalCustomTemplate: React.Dispatch<React.SetStateAction<string>>;

  // Settings Modals
  isCardSettingsModalOpen: boolean;
  setIsCardSettingsModalOpen: (open: boolean) => void;
  cardViewSettings: TargetCardViewSettings;
  setCardViewSettings: React.Dispatch<React.SetStateAction<TargetCardViewSettings>>;

  isProfileCardSettingsModalOpen: boolean;
  setIsProfileCardSettingsModalOpen: (open: boolean) => void;
  profileCardSettings: ProfileCardViewSettings;
  setProfileCardSettings: React.Dispatch<React.SetStateAction<ProfileCardViewSettings>>;

  isHistoryCardSettingsModalOpen: boolean;
  setIsHistoryCardSettingsModalOpen: (open: boolean) => void;
  historyCardSettings: HistoryCardViewSettings;
  setHistoryCardSettings: React.Dispatch<React.SetStateAction<HistoryCardViewSettings>>;

  // JSON Diagnostic Modal
  isJsonDiagModalOpen: boolean;
  setIsJsonDiagModalOpen: (open: boolean) => void;
  jsonDiagnostic: JsonDiagnosticResult | null;
  setJsonDiagnostic: (diag: JsonDiagnosticResult | null) => void;
  handleApplyImportedProfile: (prof: WatchlistProfile, cardSettings?: TargetCardViewSettings) => void;

  // Confirm Clear History Dialog
  isConfirmClearHistoryOpen: boolean;
  setIsConfirmClearHistoryOpen: (open: boolean) => void;
  scanHistory: ScanHistoryRecord[];
  saveHistory: (records: ScanHistoryRecord[]) => void;

  showToast: (msg: string) => void;
}

export const MainDashboardModals: React.FC<MainDashboardModalsProps> = ({
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
  handleSaveEditProfile,

  isAddTargetModalOpen,
  setIsAddTargetModalOpen,
  activeProfile,
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
  handleSaveEditTarget,
  handleOpenEditTarget,

  viewingTargetItem,
  setViewingTargetItem,
  onCopyText,
  onNavigateToBrowser,
  isDumpLoaded,

  selectedHistoryRecord,
  setSelectedHistoryRecord,
  historyModalTab,
  setHistoryModalTab,
  historyModalCodeStyle,
  setHistoryModalCodeStyle,
  historyModalCustomTemplate,
  setHistoryModalCustomTemplate,

  isCardSettingsModalOpen,
  setIsCardSettingsModalOpen,
  cardViewSettings,
  setCardViewSettings,

  isProfileCardSettingsModalOpen,
  setIsProfileCardSettingsModalOpen,
  profileCardSettings,
  setProfileCardSettings,

  isHistoryCardSettingsModalOpen,
  setIsHistoryCardSettingsModalOpen,
  historyCardSettings,
  setHistoryCardSettings,

  isJsonDiagModalOpen,
  setIsJsonDiagModalOpen,
  jsonDiagnostic,
  setJsonDiagnostic,
  handleApplyImportedProfile,

  isConfirmClearHistoryOpen,
  setIsConfirmClearHistoryOpen,
  scanHistory,
  saveHistory,

  showToast,
}) => {
  return (
    <>
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
        isDumpLoaded={isDumpLoaded}
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

      {/* JSON Safety & Diagnostic Modal */}
      <JsonDiagnosticModal
        isOpen={isJsonDiagModalOpen}
        onClose={() => {
          setIsJsonDiagModalOpen(false);
          setJsonDiagnostic(null);
        }}
        diagnostic={jsonDiagnostic}
        onConfirmImport={(profile, cardSettings) => {
          handleApplyImportedProfile(profile, cardSettings);
        }}
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
    </>
  );
};
