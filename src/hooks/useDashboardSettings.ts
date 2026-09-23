import { useState, useEffect } from 'react';
import {
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
import { JsonDiagnosticResult } from '../utils/jsonValidator';

export function useDashboardSettings(activeProfile?: WatchlistProfile) {
  // Profile Card View & Display Settings
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

  // Target Card View & Display Settings
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

  useEffect(() => {
    try {
      localStorage.setItem('il2cpp_target_view_settings_v3', JSON.stringify(cardViewSettings));
    } catch {
      // ignore
    }
  }, [cardViewSettings]);

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

  // JSON Safety & Diagnostic Modal State
  const [jsonDiagnostic, setJsonDiagnostic] = useState<JsonDiagnosticResult | null>(null);
  const [isJsonDiagModalOpen, setIsJsonDiagModalOpen] = useState(false);

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

  return {
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
  };
}
