import React from 'react';
import {
  ProcessDescriptor,
  BreadcrumbViewData,
  CanvasTabViewData,
} from '../types';
import {
  Menu,
  FileCode2,
  ChevronRight,
  X,
  Layers,
  Sparkles,
  Search,
  Activity,
  LayoutDashboard,
  Code2,
} from 'lucide-react';

interface ManagerHeaderProps {
  currentProcess: ProcessDescriptor | null;
  storageDumpName?: string | null;
  breadcrumbs: BreadcrumbViewData[];
  onBreadcrumbClick: (crumb: BreadcrumbViewData) => void;
  canvasTabs: CanvasTabViewData[];
  activeCanvasTabId: string | null;
  onSelectCanvasTab: (tabId: string) => void;
  onCloseCanvasTab: (tabId: string) => void;
  onOpenProcessPicker: () => void;
  onOpenDumpModal: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  onOpenMenu: () => void;
  activeWorkspace: 'dashboard' | 'browser' | 'canvas';
  onSwitchWorkspace: (workspace: 'dashboard' | 'browser' | 'canvas') => void;
}

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  currentProcess,
  storageDumpName,
  breadcrumbs,
  onBreadcrumbClick,
  canvasTabs,
  activeCanvasTabId,
  onSelectCanvasTab,
  onCloseCanvasTab,
  onOpenProcessPicker,
  onOpenDumpModal,
  onToggleSearch,
  isSearchOpen,
  onOpenMenu,
  activeWorkspace,
  onSwitchWorkspace,
}) => {
  const isTargetOrStorageSelected = Boolean(currentProcess || storageDumpName);
  return (
    <header className="bg-[#1A1A1A] text-[#E2E2E4] border-b border-[#353535] shrink-0 flex flex-col select-none">
      {/* Top Primary Bar */}
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* App Title & Process Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              IL2
            </div>
            <span className="font-semibold text-base tracking-tight hidden sm:inline">
              IL2CppManager
            </span>
          </div>

          <div className="h-5 w-[1px] bg-[#353535] hidden sm:block" />

          {/* Process Selector Chip */}
          <button
            onClick={onOpenProcessPicker}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors max-w-[220px] sm:max-w-[320px] truncate ${
              currentProcess
                ? 'bg-[#28282A] hover:bg-[#323235] text-[#E2E2E4] border-[#3F3F42]'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
            title={currentProcess ? `${currentProcess.appName} (${currentProcess.name})` : 'Select target process'}
          >
            <Activity className={`w-3.5 h-3.5 shrink-0 ${currentProcess ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
            <span className="truncate">
              {currentProcess ? `${currentProcess.appName} · PID ${currentProcess.pid}` : 'Select Process'}
            </span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Toggle (Visible only in Browser or Canvas mode) */}
          {activeWorkspace !== 'dashboard' && (
            <button
              onClick={onToggleSearch}
              className={`p-2 rounded-lg transition-colors ${
                isSearchOpen
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-[#B8B8B8] hover:text-[#E2E2E4] hover:bg-[#28282A]'
              }`}
              title="Search (Ctrl/Cmd+F)"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Dump C# Code Modal (Visible only in Browser or Canvas mode when process loaded) */}
          {activeWorkspace !== 'dashboard' && currentProcess && (
            <button
              onClick={onOpenDumpModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#B8B8B8] hover:text-[#E2E2E4] hover:bg-[#28282A] border border-transparent hover:border-[#353535] transition-colors"
              title="Export C# Dump (dump.cs)"
            >
              <FileCode2 className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Dump C#</span>
            </button>
          )}

          {/* Workspace Switcher: Hidden if neither target process nor storage dump is selected */}
          {isTargetOrStorageSelected && (
            <div className="flex items-center bg-[#202020] p-0.5 rounded-lg border border-[#353535]">
              <button
                onClick={() => onSwitchWorkspace('dashboard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeWorkspace === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => onSwitchWorkspace('browser')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeWorkspace === 'browser'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Browser</span>
              </button>
              {canvasTabs.length > 0 && (
                <button
                  onClick={() => onSwitchWorkspace('canvas')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeWorkspace === 'canvas'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  <Layers className="w-3 h-3 text-indigo-300" />
                  <span>Canvas ({canvasTabs.length})</span>
                </button>
              )}
            </div>
          )}

          {/* 3-line Menu Drawer Toggle (Visible only when Dashboard is active) */}
          {activeWorkspace === 'dashboard' && (
            <button
              onClick={onOpenMenu}
              className="p-2 rounded-lg text-[#B8B8B8] hover:text-[#E2E2E4] hover:bg-[#28282A] transition-colors"
              title="App Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Secondary Bar: Breadcrumbs (only when Browser is open) or Canvas Tabs (only when Canvas is open and tabs exist) */}
      {activeWorkspace === 'browser' ? (
        <div className="h-9 px-4 bg-[#202020] border-t border-[#2D2D30] flex items-center overflow-x-auto text-xs text-[#B8B8B8] whitespace-nowrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id || idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#6C6C70] shrink-0" />}
                <button
                  onClick={() => onBreadcrumbClick(crumb)}
                  className={`hover:text-white transition-colors truncate max-w-[200px] ${
                    isLast ? 'font-semibold text-[#E2E2E4]' : 'text-[#8E8E93]'
                  }`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      ) : activeWorkspace === 'canvas' && canvasTabs.length > 0 ? (
        <div className="h-9 px-2 bg-[#202020] border-t border-[#2D2D30] flex items-center overflow-x-auto gap-1 text-xs">
          {canvasTabs.map((tab) => {
            const isActive = tab.id === activeCanvasTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectCanvasTab(tab.id)}
                className={`group flex items-center gap-1.5 h-7 px-3 rounded-md cursor-pointer transition-colors max-w-[220px] ${
                  isActive
                    ? 'bg-[#2E2E32] text-white border border-[#3E3E42]'
                    : 'bg-[#18181A] text-[#8E8E93] hover:text-[#E2E2E4] hover:bg-[#242426]'
                }`}
              >
                <Sparkles className={`w-3 h-3 shrink-0 ${isActive ? 'text-indigo-400' : 'text-[#6C6C70]'}`} />
                <span className="truncate font-mono-code text-[11px]">{tab.methodName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseCanvasTab(tab.id);
                  }}
                  className="p-0.5 rounded-full hover:bg-[#3E3E42] text-[#8E8E93] hover:text-white"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </header>
  );
};
