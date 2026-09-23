import React, { useRef } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import {
  WatchlistProfile,
  TargetCardViewSettings,
} from '../types';
import { validateAndParseProfileJson, JsonDiagnosticResult } from '../utils/jsonValidator';

interface UseProfileExportImportOptions {
  profiles: WatchlistProfile[];
  saveProfiles: (profiles: WatchlistProfile[]) => void;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  selectedProfileViewId: string | null;
  setSelectedProfileViewId: (id: string | null) => void;
  cardViewSettings: TargetCardViewSettings;
  setCardViewSettings: React.Dispatch<React.SetStateAction<TargetCardViewSettings>>;
  setJsonDiagnostic: (diag: JsonDiagnosticResult | null) => void;
  setIsJsonDiagModalOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
}

export function useProfileExportImport({
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
}: UseProfileExportImportOptions) {
  const profileImportInputRef = useRef<HTMLInputElement>(null);

  // Export Profile to JSON & share
  const handleExportProfile = async (prof: WatchlistProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      cardViewSettings,
      profile: {
        id: prof.id,
        name: prof.name,
        description: prof.description,
        codeStyle: prof.codeStylePreset,
        customTemplate: prof.customCodeStyleTemplate,
        groupOrder: prof.groupOrder,
        items: prof.items.map((item) => {
          if (item.isIl2cppSymbol) {
            return {
              id: item.id,
              isIl2cppSymbol: true,
              customName: item.customName,
              groupName: item.groupName,
              assemblyName: 'il2cpp',
              className: item.className || 'GameFacade',
              memberName: item.memberName || item.il2cppSymbolName || 'IL2CPP_SYMBOL',
              comment: item.comment,
              offsetHex: item.offsetHex,
              defaultOffset: item.defaultOffset,
            };
          }
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

  // Apply validated / recovered profile to state & local persistence
  const handleApplyImportedProfile = (newProfile: WatchlistProfile, cardSettingsToApply?: TargetCardViewSettings) => {
    if (cardSettingsToApply) {
      const mergedSettings: TargetCardViewSettings = {
        ...cardViewSettings,
        ...cardSettingsToApply,
      };
      setCardViewSettings(mergedSettings);
    }
    const updated = [newProfile, ...profiles];
    saveProfiles(updated);
    setActiveProfileId(newProfile.id);
    setSelectedProfileViewId(newProfile.id);
    showToast(
      `Imported profile "${newProfile.name}" (${newProfile.items.length} targets${
        cardSettingsToApply ? ' + card settings restored' : ''
      })`
    );
  };

  // Import Profile from JSON File (with Safety Diagnostic & Error Recovery)
  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = (event.target?.result as string) || '';
        const diag = validateAndParseProfileJson(text);

        if (diag.status === 'valid' && diag.recoveredProfile) {
          handleApplyImportedProfile(diag.recoveredProfile, diag.recoveredCardSettings);
        } else {
          setJsonDiagnostic(diag);
          setIsJsonDiagModalOpen(true);
        }
      } catch (err: any) {
        setJsonDiagnostic({
          status: 'unsupported',
          errorTitle: 'File Read Failure',
          errors: [`Failed to read file: ${err?.message || 'Unknown error'}`],
          warnings: [],
          info: [],
          recoveredProfile: null,
        });
        setIsJsonDiagModalOpen(true);
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

  return {
    profileImportInputRef,
    handleExportProfile,
    handleImportProfile,
    handleApplyImportedProfile,
    handleDeleteProfile,
  };
}
