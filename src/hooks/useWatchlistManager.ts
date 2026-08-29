import { useState, useCallback, useMemo } from 'react';
import { WatchlistProfile } from '../types';

export function useWatchlistManager(initialProfiles: WatchlistProfile[]) {
  // Profiles State
  const [profiles, setProfiles] = useState<WatchlistProfile[]>(() => {
    const vKey = 'il2cpp_watchlist_profiles_v4';
    const hasV4 = localStorage.getItem(vKey);
    if (hasV4) {
      const saved = localStorage.getItem('il2cpp_watchlist_profiles');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // fall through
        }
      }
    }
    localStorage.setItem(vKey, 'true');
    localStorage.setItem('il2cpp_watchlist_profiles', JSON.stringify(initialProfiles));
    return initialProfiles;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(
    profiles[0]?.id || 'prof_player_stats'
  );

  const [selectedProfileViewId, setSelectedProfileViewId] = useState<string | null>(null);
  
  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0];
  }, [profiles, activeProfileId]);

  const saveProfiles = useCallback((updated: WatchlistProfile[]) => {
    setProfiles(updated);
    localStorage.setItem('il2cpp_watchlist_profiles', JSON.stringify(updated));
  }, []);

  return {
    profiles,
    activeProfileId,
    setActiveProfileId,
    selectedProfileViewId,
    setSelectedProfileViewId,
    activeProfile,
    saveProfiles,
  };
}
