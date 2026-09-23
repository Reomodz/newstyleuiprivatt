import React from 'react';
import {
  BreadcrumbViewData,
  CanvasTabViewData,
} from '../types';
import {
  Menu,
  ChevronRight,
  X,
  Layers,
  Sparkles,
  Search,
  Code2,
  BookmarkPlus,
  Cpu,
  History,
} from 'lucide-react';

interface ManagerHeaderProps {
  currentProcess?: any;
  storageDumpName?: string | null;
  breadcrumbs: BreadcrumbViewData[];
  onBreadcrumbClick: (crumb: BreadcrumbViewData) => void;
  canvasTabs: CanvasTabViewData[];
  activeCanvasTabId: string | null;
  onSelectCanvasTab: (tabId: string) => void;
  onCloseCanvasTab: (tabId: string) => void;
  onOpenProcessPicker?: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  onOpenMenu: () => void;
  activeWorkspace: 'dashboard' | 'browser' | 'canvas';
  onSwitchWorkspace: (workspace: 'dashboard' | 'browser' | 'canvas') => void;
  dashboardTab?: 'target' | 'watchlist' | 'history';
  activeProfileName?: string;
}

export const ManagerHeader: React.FC<ManagerHeaderProps> = ({
  storageDumpName,
  breadcrumbs,
  onBreadcrumbClick,
  canvasTabs,
  activeCanvasTabId,
  onSelectCanvasTab,
  onCloseCanvasTab,
  onToggleSearch,
  isSearchOpen,
  onOpenMenu,
  activeWorkspace,
  onSwitchWorkspace,
  dashboardTab = 'watchlist',
  activeProfileName,
}) => {
  // Dynamic header tab representation
  const getDashboardButtonInfo = () => {
    switch (dashboardTab) {
      case 'watchlist':
        return {
          label: activeProfileName ? `${activeProfileName}` : 'Profiles & Offsets',
          shortLabel: 'Profiles',
          icon: <BookmarkPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
        };
      case 'history':
        return {
          label: 'History',
          shortLabel: 'History',
          icon: <History className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
        };
      case 'target':
      default:
        return {
          label: 'Storage Dump',
          shortLabel: 'Dump',
          icon: <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
        };
    }
  };

  const dashInfo = getDashboardButtonInfo();
  return (
    <header className="app-top-header bg-[#1A1A1A]/80 backdrop-blur-md text-[#E2E2E4] border-b border-[#353535]/70 shrink-0 flex flex-col select-none transition-colors">
      {/* Top Primary Bar */}
      <div className="h-12 sm:h-14 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* App Title Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs sm:text-sm shadow-sm">
              IL2
            </div>
            <span className="font-bold text-xs sm:text-sm md:text-base tracking-tight text-white">
              IL2CppManager
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Search Toggle (Visible only in Browser or Canvas mode) */}
          {activeWorkspace !== 'dashboard' && (
            <button
              onClick={onToggleSearch}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                isSearchOpen
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-[#B8B8B8] hover:text-[#E2E2E4] hover:bg-[#28282A]'
              }`}
              title="Search (Ctrl/Cmd+F)"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Workspace Switcher (Visible only when dump.cs is loaded) */}
          {Boolean(storageDumpName) && (
            <div className="flex items-center bg-[#202020] p-0.5 rounded-lg border border-[#353535] animate-in fade-in duration-200">
              <button
                onClick={() => onSwitchWorkspace('dashboard')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all max-w-[150px] sm:max-w-[200px] truncate ${
                  activeWorkspace === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                }`}
                title={`Switch to ${dashInfo.label}`}
              >
                {dashInfo.icon}
                <span className="truncate">{dashInfo.label}</span>
              </button>
              <button
                onClick={() => onSwitchWorkspace('browser')}
                className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                  activeWorkspace === 'browser'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                }`}
              >
                <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Browser</span>
              </button>
              {canvasTabs.length > 0 && (
                <button
                  onClick={() => onSwitchWorkspace('canvas')}
                  className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                    activeWorkspace === 'canvas'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  <Layers className="w-3 h-3 text-indigo-300" />
                  <span>Canvas ({canvasTabs.length})</span>
                </button>
              )}
            </div>
          )}

          {/* 3-line Menu Drawer Toggle: Appearance & Theme Settings */}
          <button
            onClick={onOpenMenu}
            className="p-1.5 sm:p-2 rounded-lg text-[#B8B8B8] hover:text-white hover:bg-[#28282A] transition-colors"
            title="Appearance & Theme Settings"
          >
            <Menu className="w-4 h-4" />
          </button>
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
