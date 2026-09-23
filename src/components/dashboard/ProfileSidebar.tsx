import React, { RefObject } from 'react';
import {
  WatchlistProfile,
  WatchlistTargetItem,
  TargetCardViewSettings,
  ProfileCardViewSettings,
} from '../../types';
import { ProfileListSection } from './ProfileListSection';
import { ProfileTargetsView } from './ProfileTargetsView';

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
  handleDeleteProfile: (id: string, e?: React.MouseEvent) => void;
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

      {/* VIEW 1: PROFILES OVERVIEW (When no specific profile is opened or activeProfile is missing) */}
      {selectedProfileViewId === null || !activeProfile ? (
        <ProfileListSection
          profiles={profiles}
          activeProfileId={activeProfileId}
          setActiveProfileId={setActiveProfileId}
          setSelectedProfileViewId={setSelectedProfileViewId}
          profileImportInputRef={profileImportInputRef}
          setIsProfileCardSettingsModalOpen={setIsProfileCardSettingsModalOpen}
          setIsNewProfileModalOpen={setIsNewProfileModalOpen}
          handleOpenEditProfile={handleOpenEditProfile}
          handleExportProfile={handleExportProfile}
          handleDeleteProfile={handleDeleteProfile}
          profileCardSettings={profileCardSettings}
        />
      ) : (
        /* VIEW 2: PROFILE TARGETS VIEW (Inside selected profile) */
        <ProfileTargetsView
          activeProfile={activeProfile}
          setSelectedProfileViewId={setSelectedProfileViewId}
          handleOpenEditProfile={handleOpenEditProfile}
          handleExportProfile={handleExportProfile}
          watchlistFilter={watchlistFilter}
          setWatchlistFilter={setWatchlistFilter}
          setIsCardSettingsModalOpen={setIsCardSettingsModalOpen}
          displayedItems={displayedItems}
          cardViewSettings={cardViewSettings}
          profileCardSettings={profileCardSettings}
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
    </div>
  );
});
