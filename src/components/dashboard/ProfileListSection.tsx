import React, { useState, RefObject } from 'react';
import {
  Layers,
  Upload,
  Plus,
  Pencil,
  Share2,
  Trash2,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { WatchlistProfile, ProfileCardViewSettings } from '../../types';
import { ConfirmDialog } from '../ui';

interface ProfileListSectionProps {
  profiles: WatchlistProfile[];
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  setSelectedProfileViewId: (id: string | null) => void;
  profileImportInputRef: RefObject<HTMLInputElement>;
  setIsProfileCardSettingsModalOpen: (open: boolean) => void;
  setIsNewProfileModalOpen: (open: boolean) => void;
  handleOpenEditProfile: (prof: WatchlistProfile, e?: React.MouseEvent) => void;
  handleExportProfile: (prof: WatchlistProfile, e?: React.MouseEvent) => void;
  handleDeleteProfile: (id: string, e?: React.MouseEvent) => void;
  profileCardSettings: ProfileCardViewSettings;
}

export const ProfileListSection: React.FC<ProfileListSectionProps> = ({
  profiles,
  activeProfileId,
  setActiveProfileId,
  setSelectedProfileViewId,
  profileImportInputRef,
  setIsProfileCardSettingsModalOpen,
  setIsNewProfileModalOpen,
  handleOpenEditProfile,
  handleExportProfile,
  handleDeleteProfile,
  profileCardSettings,
}) => {
  const [expandedProfileDescIds, setExpandedProfileDescIds] = useState<Record<string, boolean>>({});
  const [profileToDelete, setProfileToDelete] = useState<WatchlistProfile | null>(null);

  return (
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

      {/* Profiles Cards List / Empty State */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl text-center gap-3">
          <div className="p-3 sm:p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#E2E2E4]">No Profiles Available</h3>
            <p className="text-xs text-[#8E8E93] mt-1 max-w-[320px]">
              All profiles have been deleted. You can create a new profile or import an existing JSON profile.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setIsNewProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Profile</span>
            </button>
            <button
              onClick={() => profileImportInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#262629] hover:bg-[#323236] text-[#A0A0A5] hover:text-white border border-[#353538] rounded-lg sm:rounded-xl text-xs font-semibold transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 ${
            profileCardSettings.tabletLayout === 'grid' ? 'md:grid-cols-2' : 'md:grid-cols-1'
          } gap-2 sm:gap-3`}
        >
          {profiles.map((prof) => {
            const isScanActive = prof.id === activeProfileId;
            const isCompact = profileCardSettings.density === 'compact';
            const showFooter =
              profileCardSettings.showTargetCount ||
              profileCardSettings.showTargetChips ||
              profileCardSettings.showOpenIndicator;

            return (
              <div
                key={prof.id}
                onClick={() => {
                  setActiveProfileId(prof.id);
                  setSelectedProfileViewId(prof.id);
                }}
                className={`bg-[#1E1E20] hover:bg-[#242428] border profile-item-card ${
                  isCompact ? 'p-2.5 sm:p-3 pl-3.5 sm:pl-4 gap-1.5' : 'p-3 sm:p-3.5 pl-4 sm:pl-5 gap-2'
                } rounded-xl sm:rounded-2xl shadow-sm flex flex-col cursor-pointer transition-all active:scale-[0.99] group/pcard relative overflow-hidden`}
                style={{
                  borderColor: isScanActive ? 'rgba(var(--app-accent-rgb), 0.55)' : undefined,
                  boxShadow: isScanActive ? '0 4px 14px rgba(var(--app-accent-rgb), 0.12)' : undefined,
                }}
              >
                {/* Profile Identity Accent Line on Left Side */}
                <div
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${
                    isScanActive ? 'w-[2.5px]' : 'w-[1.5px] group-hover/pcard:w-[2.5px]'
                  }`}
                  style={{
                    background: isScanActive
                      ? 'linear-gradient(180deg, var(--app-accent-hex), rgba(var(--app-accent-rgb), 0.35))'
                      : 'linear-gradient(180deg, rgba(var(--app-accent-rgb), 0.7), rgba(var(--app-accent-rgb), 0.25))',
                    boxShadow: isScanActive ? '0 0 12px rgba(var(--app-accent-rgb), 0.6)' : undefined,
                  }}
                />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#E2E2E4] group-hover/pcard:text-white transition-colors truncate">
                        {prof.name}
                      </span>
                      {profileCardSettings.showActiveBadge && isScanActive && (
                        <span
                          className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold shrink-0 transition-colors"
                          style={{
                            backgroundColor: 'rgba(var(--app-accent-rgb), 0.15)',
                            color: 'var(--app-accent-hex)',
                            border: '1px solid rgba(var(--app-accent-rgb), 0.35)',
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    {profileCardSettings.showDescription && prof.description && (
                      <p
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedProfileDescIds((prev) => ({
                            ...prev,
                            [prof.id]: !prev[prof.id],
                          }));
                        }}
                        className={`text-[10px] sm:text-xs text-[#8E8E93] cursor-pointer hover:text-[#C4C4C8] transition-colors ${
                          expandedProfileDescIds[prof.id] || profileCardSettings.expandAllDescriptions
                            ? 'whitespace-normal break-words'
                            : 'line-clamp-1'
                        }`}
                        title="Click to view full description"
                      >
                        {prof.description}
                      </p>
                    )}
                  </div>

                  {/* Profile Action Logos: Edit Name, Share/Export, Delete */}
                  {profileCardSettings.showActionButtons && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEditProfile(prof, e)}
                        className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-white bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileToDelete(prof);
                        }}
                        className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-red-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
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
                      <div
                        className="flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold ml-auto transition-colors"
                        style={{ color: 'var(--app-accent-hex)' }}
                      >
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
      )}

      {/* Delete Profile Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(profileToDelete)}
        title="Delete Profile"
        subtitle={`All ${profileToDelete?.items.length || 0} targets within this profile will be removed.`}
        description={`Are you sure you want to permanently delete profile "${profileToDelete?.name}"?`}
        confirmText="Delete Profile"
        variant="danger"
        onConfirm={() => {
          if (profileToDelete) {
            handleDeleteProfile(profileToDelete.id);
            setProfileToDelete(null);
          }
        }}
        onClose={() => setProfileToDelete(null)}
      />
    </div>
  );
};
