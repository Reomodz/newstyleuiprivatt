import React, { useState, useMemo } from 'react';
import {
  DirectoryLevel,
  BreadcrumbViewData,
  CanvasTabViewData,
  WatchlistTargetItem,
} from './types';
import { il2cppEngine } from './services/il2cppEngine';
import { useWatchlistManager } from './hooks/useWatchlistManager';
import { useAppSettings } from './hooks/useAppSettings';
import { ManagerHeader } from './components/ManagerHeader';
import { MainDashboard } from './components/MainDashboard';
import { ManagerBrowser } from './components/ManagerBrowser';
import { ManagerDrawer } from './components/ManagerDrawer';
import { Toast } from './components/common/Toast';

export const App: React.FC = () => {
  // App Theme & Appearance Customizer State
  const {
    settings: themeSettings,
    updateSettings: updateThemeSettings,
    resetToDefaults: resetThemeDefaults,
    handleUploadImage: uploadThemeImage,
  } = useAppSettings();

  // Shared Watchlist & Profiles State
  const watchlistManager = useWatchlistManager();
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    activeProfile,
    saveProfiles,
  } = watchlistManager;

  // Storage Dump State
  const [storageDumpName, setStorageDumpName] = useState<string | null>(() => {
    return il2cppEngine.getStorageMeta().dumpCsFileName || null;
  });

  // Navigation State
  const [directoryLevel, setDirectoryLevel] = useState<DirectoryLevel | 'CLASS_DETAILS'>(
    DirectoryLevel.ASSEMBLIES
  );
  const [selectedAssemblyIndex, setSelectedAssemblyIndex] = useState<number | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [selectedClassIndex, setSelectedClassIndex] = useState<number | null>(null);
  const [browserInitialTab, setBrowserInitialTab] = useState<'FIELD' | 'METHOD'>('FIELD');
  const [browserScrollToMember, setBrowserScrollToMember] = useState<{ memberName: string; kind: 'FIELD' | 'METHOD' } | null>(null);

  // Workspace & Canvas Tabs State
  const [activeWorkspace, setActiveWorkspace] = useState<'dashboard' | 'browser' | 'canvas'>('dashboard');
  const [canvasTabs, setCanvasTabs] = useState<CanvasTabViewData[]>([]);
  const [activeCanvasTabId, setActiveCanvasTabId] = useState<string | null>(null);

  // UI Panels & Modals State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2400);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`);
  };

  // Save Target to Profile Handler
  const handleSaveTargetToProfile = (
    targetData: Omit<WatchlistTargetItem, 'id'>,
    targetProfileId?: string
  ) => {
    const profId = targetProfileId || activeProfileId;
    const targetProf = profiles.find((p) => p.id === profId) || activeProfile;
    if (!targetProf) {
      showToast('No active profile. Please create a profile first.');
      return;
    }

    const existingIdx = targetProf.items.findIndex(
      (t) =>
        t.className &&
        targetData.className &&
        t.className.toLowerCase() === targetData.className.toLowerCase() &&
        t.memberName &&
        targetData.memberName &&
        t.memberName.toLowerCase() === targetData.memberName.toLowerCase() &&
        t.kind === targetData.kind
    );

    let updatedItems: WatchlistTargetItem[];
    if (existingIdx >= 0) {
      updatedItems = [...targetProf.items];
      updatedItems[existingIdx] = {
        ...updatedItems[existingIdx],
        ...targetData,
        offsetHex: targetData.offsetHex,
        rvaHex: targetData.rvaHex,
        vaHex: targetData.vaHex,
        resolved: true,
        lastScannedAt: Date.now(),
      };
      showToast(`Updated "${targetData.memberName}" in profile "${targetProf.name}"`);
    } else {
      const newItem: WatchlistTargetItem = {
        ...targetData,
        id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        resolved: true,
        lastScannedAt: Date.now(),
      };
      updatedItems = [...targetProf.items, newItem];
      showToast(`Saved "${targetData.memberName}" to profile "${targetProf.name}"`);
    }

    const nextProfiles = profiles.map((p) =>
      p.id === targetProf.id ? { ...p, items: updatedItems, updatedAt: Date.now() } : p
    );
    saveProfiles(nextProfiles);
  };

  // Compute Breadcrumbs
  const breadcrumbs: BreadcrumbViewData[] = useMemo(() => {
    const crumbs: BreadcrumbViewData[] = [
      { id: 'assemblies', label: 'Assemblies', level: DirectoryLevel.ASSEMBLIES },
    ];

    if (selectedAssemblyIndex !== null) {
      const asm = il2cppEngine.getAssembly(selectedAssemblyIndex);
      crumbs.push({
        id: `asm_${selectedAssemblyIndex}`,
        label: asm?.name || `Assembly ${selectedAssemblyIndex}`,
        level: DirectoryLevel.NAMESPACES,
        targetIndex: selectedAssemblyIndex,
      });
    }

    if (selectedNamespace !== null) {
      crumbs.push({
        id: `ns_${selectedNamespace}`,
        label: selectedNamespace || '(global)',
        level: DirectoryLevel.CLASSES,
      });
    }

    if (selectedClassIndex !== null) {
      const cls = il2cppEngine.getClass(selectedClassIndex);
      crumbs.push({
        id: `cls_${selectedClassIndex}`,
        label: cls?.name || `Class ${selectedClassIndex}`,
        level: 'CLASS_DETAILS',
        targetIndex: selectedClassIndex,
      });
    }

    return crumbs;
  }, [selectedAssemblyIndex, selectedNamespace, selectedClassIndex]);

  // Breadcrumb click handler
  const handleBreadcrumbClick = (crumb: BreadcrumbViewData) => {
    if (crumb.level === DirectoryLevel.ASSEMBLIES) {
      setDirectoryLevel(DirectoryLevel.ASSEMBLIES);
      setSelectedAssemblyIndex(null);
      setSelectedNamespace(null);
      setSelectedClassIndex(null);
    } else if (crumb.level === DirectoryLevel.NAMESPACES) {
      setDirectoryLevel(DirectoryLevel.NAMESPACES);
      setSelectedNamespace(null);
      setSelectedClassIndex(null);
    } else if (crumb.level === DirectoryLevel.CLASSES) {
      setDirectoryLevel(DirectoryLevel.CLASSES);
      setSelectedClassIndex(null);
    } else if (crumb.level === 'CLASS_DETAILS') {
      setDirectoryLevel('CLASS_DETAILS');
    }
  };

  // Browser level selection handlers
  const handleSelectAssembly = (index: number) => {
    setSelectedAssemblyIndex(index);
    setSelectedNamespace(null);
    setSelectedClassIndex(null);
    setDirectoryLevel(DirectoryLevel.NAMESPACES);
  };

  const handleSelectNamespace = (ns: string) => {
    setSelectedNamespace(ns);
    setSelectedClassIndex(null);
    setDirectoryLevel(DirectoryLevel.CLASSES);
  };

  const handleSelectClass = (index: number) => {
    const cls = il2cppEngine.getClass(index);
    if (cls) {
      setSelectedAssemblyIndex(cls.assemblyIndex);
      setSelectedNamespace(cls.namespaceName);
    }
    setSelectedClassIndex(index);
    setDirectoryLevel('CLASS_DETAILS');
    setActiveWorkspace('browser');
  };

  const handleCloseCanvasTab = (tabId: string) => {
    const nextTabs = canvasTabs.filter((t) => t.id !== tabId);
    setCanvasTabs(nextTabs);
    if (activeCanvasTabId === tabId) {
      if (nextTabs.length > 0) {
        setActiveCanvasTabId(nextTabs[nextTabs.length - 1].id);
      } else {
        setActiveCanvasTabId(null);
        setActiveWorkspace('browser');
      }
    }
  };

  return (
    <div
      className={`app-root-container flex flex-col h-screen w-screen overflow-hidden text-[#E2E2E4] relative transition-colors duration-300 ${
        themeSettings.customBgImage
          ? 'bg-transparent'
          : themeSettings.themeMode === 'day'
          ? 'bg-[#F4F5F7]'
          : themeSettings.themeMode === 'oled'
          ? 'bg-[#000000]'
          : 'bg-[#18181A]'
      }`}
    >
      {/* Custom Wallpaper Layer (Blurred if set) */}
      {themeSettings.customBgImage && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-all duration-300 bg-cover bg-center bg-no-repeat overflow-hidden"
          style={{
            backgroundImage: `url(${themeSettings.customBgImage})`,
            filter: `blur(${themeSettings.bgBlur}px)`,
            transform: themeSettings.bgBlur > 0 ? 'scale(1.05)' : 'none',
          }}
        />
      )}

      {/* Pure Neutral Dark Dimming Overlay (No white haze) */}
      {themeSettings.customBgImage && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundColor: '#000000',
            opacity: (themeSettings.bgDim * 0.75) / 100,
          }}
        />
      )}

      {/* Header */}
      <div className="relative z-10">
        <ManagerHeader
          storageDumpName={storageDumpName}
          breadcrumbs={breadcrumbs}
          onBreadcrumbClick={handleBreadcrumbClick}
          canvasTabs={canvasTabs}
          activeCanvasTabId={activeCanvasTabId}
          onSelectCanvasTab={(id) => {
            setActiveCanvasTabId(id);
            setActiveWorkspace('canvas');
          }}
          onCloseCanvasTab={handleCloseCanvasTab}
          onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
          isSearchOpen={isSearchOpen}
          onOpenMenu={() => setIsDrawerOpen(true)}
          activeWorkspace={activeWorkspace}
          onSwitchWorkspace={setActiveWorkspace}
        />
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        {activeWorkspace === 'dashboard' ? (
          <MainDashboard
            currentProcess={null}
            storageDumpName={storageDumpName}
            onStorageDumpLoaded={(fileName) => setStorageDumpName(fileName)}
            onOpenProcessPicker={() => {}}
            onNavigateToBrowser={(classIndex, memberKind, memberName) => {
              if (memberKind) {
                setBrowserInitialTab(memberKind);
              }
              if (memberName) {
                setBrowserScrollToMember({ memberName, kind: memberKind || 'FIELD' });
              } else {
                setBrowserScrollToMember(null);
              }
              if (classIndex !== undefined) {
                handleSelectClass(classIndex);
              }
              setActiveWorkspace('browser');
            }}
            onCopyText={handleCopyText}
            showToast={showToast}
            watchlistManager={watchlistManager}
          />
        ) : activeWorkspace === 'browser' ? (
          <ManagerBrowser
            currentLevel={directoryLevel}
            selectedAssemblyIndex={selectedAssemblyIndex}
            selectedNamespace={selectedNamespace}
            selectedClassIndex={selectedClassIndex}
            storageDumpName={storageDumpName}
            initialClassTab={browserInitialTab}
            scrollToMember={browserScrollToMember}
            onSelectAssembly={handleSelectAssembly}
            onSelectNamespace={handleSelectNamespace}
            onSelectClass={handleSelectClass}
            onCopyText={handleCopyText}
            isSearchOpen={isSearchOpen}
            onCloseSearch={() => setIsSearchOpen(false)}
            profiles={profiles}
            activeProfile={activeProfile}
            activeProfileId={activeProfileId}
            onSetActiveProfileId={setActiveProfileId}
            onSaveTargetToProfile={handleSaveTargetToProfile}
            onSwitchWorkspace={setActiveWorkspace}
            showToast={showToast}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8E8E93]">
            <p>No active method tab selected.</p>
            <button
              onClick={() => setActiveWorkspace('browser')}
              className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow transition-colors"
            >
              Return to Browser
            </button>
          </div>
        )}
      </main>

      {/* Appearance & Theme Settings Drawer */}
      <ManagerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        settings={themeSettings}
        updateSettings={updateThemeSettings}
        resetToDefaults={resetThemeDefaults}
        handleUploadImage={uploadThemeImage}
        showToast={showToast}
      />

      {/* Feedback Toast */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
};

export default App;
