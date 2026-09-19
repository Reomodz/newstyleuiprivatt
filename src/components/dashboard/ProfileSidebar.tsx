import React, { RefObject } from 'react';
import { Layers, Upload, Plus, Pencil, Share2, Trash2, ChevronRight, ChevronLeft, Search, SlidersHorizontal, Sliders, Sparkles } from 'lucide-react';
import { WatchlistProfile, WatchlistTargetItem, TargetCardViewSettings, ProfileCardViewSettings } from '../../types';

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

          {/* Targets Search Filter */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="text"
                value={watchlistFilter}
                onChange={(e) => setWatchlistFilter(e.target.value)}
                placeholder="Search targets..."
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-[#1E1E20] border border-[#2D2D30] rounded-lg sm:rounded-xl text-xs text-[#E2E2E4] placeholder-[#6C6C70] focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsCardSettingsModalOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 bg-[#1E1E20] hover:bg-[#26262A] text-[#8E8E93] hover:text-white border border-[#2D2D30] hover:border-indigo-500/40 rounded-lg sm:rounded-xl text-xs font-semibold transition-colors shadow-sm shrink-0"
              title="Card Display Options"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Options</span>
            </button>
          </div>

          {/* Targets List */}
          {displayedItems.length === 0 ? (
            <div className="p-6 text-center text-[#8E8E93] flex flex-col items-center justify-center gap-1.5 bg-[#1E1E20] rounded-xl border border-[#2D2D30] mt-1">
              <Sliders className="w-8 h-8 text-[#55555A]" />
              <p className="text-xs font-medium mt-1">No targets added yet.</p>
              <p className="text-[10px] text-[#6C6C70] max-w-[200px]">
                Tap the + button to add your first offset to track.
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${cardViewSettings.tabletLayout === 'list' ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'} gap-2 sm:gap-3`}>
            {displayedItems.map((item) => {
              const hasFallbacks =
                (item.fallbackClassNames && item.fallbackClassNames.length > 0) ||
                (item.fallbackMemberNames && item.fallbackMemberNames.length > 0);

              const isCompact = cardViewSettings.density === 'compact';

              return (
                <div
                  key={item.id}
                  onClick={() => setViewingTargetItem(item)}
                  className={`bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] hover:bg-[#232326] border border-[#2D2D30] hover:border-indigo-500/40 ${
                    isCompact ? 'p-2 sm:p-2.5 gap-1' : 'p-2.5 sm:p-3 gap-1.5'
                  } rounded-xl shadow-sm flex flex-col relative cursor-pointer transition-all active:scale-[0.99] group/card`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      {/* Primary Header: Custom Name Text OR Class & Member Name if no custom name */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cardViewSettings.showCustomName !== false && item.customName?.trim() ? (
                          /* Custom Name Text (hides Class & Member name when set) */
                          <span className="font-bold text-xs sm:text-sm text-white group-hover/card:text-indigo-200 transition-colors truncate max-w-[180px] sm:max-w-[260px]">
                            {item.customName}
                          </span>
                        ) : (
                          /* Fallback: Class & Member Name when custom name is not set */
                          <span className="inline-flex items-center gap-0.5 font-mono text-xs truncate max-w-[220px] sm:max-w-[340px]">
                            <span className="text-[#8E8E93] font-normal truncate">
                              {item.className}.
                            </span>
                            <span className="text-sky-300 font-semibold truncate">
                              {item.memberName}
                            </span>
                          </span>
                        )}

                        {/* Assembly / DLL badge */}
                        {cardViewSettings.showAssemblyName !== false && (item.assemblyName || item.resolvedAssemblyName) && (
                          <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate max-w-[140px]">
                            {item.resolvedAssemblyName || item.assemblyName}
                          </span>
                        )}

                        {cardViewSettings.showKindBadge && (
                          <span
                            className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                              item.kind === 'FIELD'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.kind}
                          </span>
                        )}
                      </div>

                      {/* Comments Preview */}
                      {cardViewSettings.showComments && item.comment && (
                        <div className="text-[9px] sm:text-[10px] text-[#8E8E93] italic line-clamp-1">
                          // {item.comment}
                        </div>
                      )}

                      {/* Fallbacks Preview */}
                      {cardViewSettings.showFallbacks && hasFallbacks && (
                        <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-amber-400/90 mt-0.5 flex-wrap font-mono">
                          <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="text-[#8E8E93]">Fallbacks:</span>
                          {item.fallbackClassNames && item.fallbackClassNames.length > 0 && (
                            <span className="bg-[#141416] px-1 py-0.2 rounded border border-[#353538] text-[#C4C4C8]">
                              Class: {item.fallbackClassNames.join(', ')}
                            </span>
                          )}
                          {item.fallbackMemberNames && item.fallbackMemberNames.length > 0 && (
                            <span className="bg-[#141416] px-1 py-0.2 rounded border border-[#353538] text-[#C4C4C8]">
                              Field: {item.fallbackMemberNames.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Edit (Pencil), Delete */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditTarget(item);
                        }}
                        className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-indigo-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
                        title="Edit Target & Fallbacks"
                      >
                        <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTargetItem(item.id);
                        }}
                        className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-red-400 bg-[#262629] hover:bg-[#323236] rounded-md sm:rounded-lg transition-colors"
                        title="Remove target"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* FLOATING ACTION BUTTON (Profile Targets View Only) */}
          <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 md:absolute md:bottom-auto md:-bottom-20 md:right-0 z-40">
            {/* Add Target FAB */}
            <button
              onClick={() => setIsAddTargetModalOpen(true)}
              className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95 border border-indigo-500/50"
              title="Add Target Field/Class"
            >
              <Plus className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
