import React, { useState, useMemo } from 'react';
import {
  DirectoryLevel,
  BreadcrumbViewData,
  CanvasTabViewData,
  ManagerInfoDestination,
} from './types';
import { il2cppEngine } from './services/il2cppEngine';
import { ManagerHeader } from './components/ManagerHeader';
import { MainDashboard } from './components/MainDashboard';
import { ManagerBrowser } from './components/ManagerBrowser';
import { CallGraphView } from './components/CallGraphView';
import { MethodInstructionsView } from './components/MethodInstructionsView';
import { ManagerDrawer } from './components/ManagerDrawer';
import { InfoModal } from './components/modals/InfoModal';
import { Toast } from './components/common/Toast';

export const App: React.FC = () => {
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

  // Workspace & Canvas Tabs State
  const [activeWorkspace, setActiveWorkspace] = useState<'dashboard' | 'browser' | 'canvas'>('dashboard');
  const [canvasTabs, setCanvasTabs] = useState<CanvasTabViewData[]>([]);
  const [activeCanvasTabId, setActiveCanvasTabId] = useState<string | null>(null);

  // UI Panels & Modals State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [infoModalDest, setInfoModalDest] = useState<ManagerInfoDestination | null>(null);

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

  // Canvas method inspection
  const handleInspectMethod = (
    classIndex: number,
    methodIndex: number,
    mode: 'graph' | 'instructions' = 'graph'
  ) => {
    const method = il2cppEngine.getMethod(classIndex, methodIndex);
    const cls = il2cppEngine.getClass(classIndex);
    if (!method || !cls) return;

    const tabId = `tab_${classIndex}_${methodIndex}`;
    const existing = canvasTabs.find((t) => t.id === tabId);

    if (existing) {
      setCanvasTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, activeSubView: mode } : t))
      );
      setActiveCanvasTabId(tabId);
    } else {
      const newTab: CanvasTabViewData = {
        id: tabId,
        classIndex,
        methodIndex,
        methodName: method.name,
        ownerName: `${cls.namespaceName ? cls.namespaceName + '.' : ''}${cls.name}`,
        activeSubView: mode,
      };
      setCanvasTabs((prev) => [...prev, newTab]);
      setActiveCanvasTabId(tabId);
    }

    setActiveWorkspace('canvas');
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

  const activeCanvasTab = canvasTabs.find((t) => t.id === activeCanvasTabId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#18181A] text-[#E2E2E4]">
      {/* Header */}
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

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeWorkspace === 'dashboard' ? (
          <MainDashboard
            currentProcess={null}
            storageDumpName={storageDumpName}
            onStorageDumpLoaded={(fileName) => setStorageDumpName(fileName)}
            onOpenProcessPicker={() => {}}
            onNavigateToBrowser={(classIndex) => {
              if (classIndex !== undefined) {
                handleSelectClass(classIndex);
              }
              setActiveWorkspace('browser');
            }}
            onCopyText={handleCopyText}
            showToast={showToast}
          />
        ) : activeWorkspace === 'browser' ? (
          <ManagerBrowser
            currentLevel={directoryLevel}
            selectedAssemblyIndex={selectedAssemblyIndex}
            selectedNamespace={selectedNamespace}
            selectedClassIndex={selectedClassIndex}
            storageDumpName={storageDumpName}
            onSelectAssembly={handleSelectAssembly}
            onSelectNamespace={handleSelectNamespace}
            onSelectClass={handleSelectClass}
            onInspectMethod={handleInspectMethod}
            onCopyText={handleCopyText}
            isSearchOpen={isSearchOpen}
            onCloseSearch={() => setIsSearchOpen(false)}
          />
        ) : activeCanvasTab ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas Subview Tab Selector */}
            <div className="h-10 px-4 bg-[#1E1E20] border-b border-[#353535] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCanvasTabs((prev) =>
                      prev.map((t) =>
                        t.id === activeCanvasTab.id ? { ...t, activeSubView: 'graph' } : t
                      )
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeCanvasTab.activeSubView === 'graph'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  Call Graph
                </button>
                <button
                  onClick={() =>
                    setCanvasTabs((prev) =>
                      prev.map((t) =>
                        t.id === activeCanvasTab.id
                          ? { ...t, activeSubView: 'instructions' }
                          : t
                      )
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeCanvasTab.activeSubView === 'instructions'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  Disassembly
                </button>
              </div>

              <div className="text-xs text-[#8E8E93] font-mono truncate hidden sm:block">
                {activeCanvasTab.ownerName}::{activeCanvasTab.methodName}
              </div>
            </div>

            {/* Active Subview Body */}
            {activeCanvasTab.activeSubView === 'graph' ? (
              <CallGraphView
                classIndex={activeCanvasTab.classIndex}
                methodIndex={activeCanvasTab.methodIndex}
                onOpenMethodInstructions={(clsIdx, mIdx) =>
                  handleInspectMethod(clsIdx, mIdx, 'instructions')
                }
                onOpenMethodInNewTab={(clsIdx, mIdx) =>
                  handleInspectMethod(clsIdx, mIdx, 'graph')
                }
                onCopyText={handleCopyText}
              />
            ) : (
              <MethodInstructionsView
                classIndex={activeCanvasTab.classIndex}
                methodIndex={activeCanvasTab.methodIndex}
                onOpenInCallGraph={(clsIdx, mIdx) =>
                  handleInspectMethod(clsIdx, mIdx, 'graph')
                }
                onNavigateToMethod={(clsIdx, mIdx) =>
                  handleInspectMethod(clsIdx, mIdx, 'graph')
                }
                onCopyText={handleCopyText}
              />
            )}
          </div>
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

      {/* App Drawer */}
      <ManagerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenInfo={(dest) => setInfoModalDest(dest)}
      />

      {/* Info / Credits / Licenses Modal */}
      <InfoModal
        destination={infoModalDest}
        onClose={() => setInfoModalDest(null)}
      />

      {/* Feedback Toast */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
};

export default App;
