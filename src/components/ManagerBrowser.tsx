import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  DirectoryLevel,
  ClassTab,
  SearchMatchMode,
  ClassInfoDescriptor,
  MethodDescriptor,
  FieldDescriptor,
  SymbolSearchDescriptor,
  SymbolKind,
  WatchlistProfile,
  WatchlistTargetItem,
} from '../types';
import { il2cppEngine } from '../services/il2cppEngine';
import { VirtualScrollList } from './VirtualScrollList';
import {
  Folder,
  Layers,
  Box,
  Copy,
  ChevronRight,
  Search,
  X,
  Code2,
  Tag,
  SlidersHorizontal,
  RotateCcw,
  Settings2,
  BookmarkPlus,
  Check,
  Target,
} from 'lucide-react';
import { BrowserSaveTargetModal } from './modals/targets/BrowserSaveTargetModal';

export interface SelectedBrowserMember {
  kind: 'FIELD' | 'METHOD';
  className: string;
  namespaceName?: string;
  memberName: string;
  assemblyName?: string;
  typeName?: string;
  signature?: string;
  offset?: number;
  rva?: number;
  field?: FieldDescriptor;
  method?: MethodDescriptor;
}

export interface BrowserCardViewSettings {
  tabletLayout: 'grid' | 'dense' | 'list';
  density: 'compact' | 'comfortable';
  showMetadata: boolean;
  showRvaLabels: boolean;
}

const DEFAULT_BROWSER_VIEW_SETTINGS: BrowserCardViewSettings = {
  tabletLayout: 'list',
  density: 'compact',
  showMetadata: true,
  showRvaLabels: true,
};

interface ManagerBrowserProps {
  currentLevel: DirectoryLevel | 'CLASS_DETAILS';
  selectedAssemblyIndex: number | null;
  selectedNamespace: string | null;
  selectedClassIndex: number | null;
  storageDumpName?: string | null;
  initialClassTab?: 'FIELD' | 'METHOD';
  scrollToMember?: { memberName: string; kind: 'FIELD' | 'METHOD' } | null;
  onSelectAssembly: (index: number) => void;
  onSelectNamespace: (ns: string) => void;
  onSelectClass: (index: number) => void;
  onCopyText: (text: string, label: string) => void;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
  profiles?: WatchlistProfile[];
  activeProfile?: WatchlistProfile;
  activeProfileId?: string;
  onSetActiveProfileId?: (id: string) => void;
  onSaveTargetToProfile?: (target: Omit<WatchlistTargetItem, 'id'>, profileId?: string) => void;
  onSwitchWorkspace?: (workspace: 'dashboard' | 'browser' | 'canvas') => void;
  showToast?: (msg: string) => void;
}

export const ManagerBrowser: React.FC<ManagerBrowserProps> = ({
  currentLevel,
  selectedAssemblyIndex,
  selectedNamespace,
  selectedClassIndex,
  storageDumpName,
  initialClassTab,
  scrollToMember,
  onSelectAssembly,
  onSelectNamespace,
  onSelectClass,
  onCopyText,
  isSearchOpen,
  onCloseSearch,
  profiles,
  activeProfile,
  activeProfileId,
  onSaveTargetToProfile,
  showToast,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'everywhere'>('current');
  const [matchMode, setMatchMode] = useState<SearchMatchMode>(SearchMatchMode.CONTAINS);
  const [matchCase, setMatchCase] = useState(false);
  const [classTab, setClassTab] = useState<ClassTab>(ClassTab.FIELDS);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Selected Target state for Profile Target Saving & Selection Mode
  const [selectedTarget, setSelectedTarget] = useState<SelectedBrowserMember | null>(null);
  const [isTargetSelectionActive, setIsTargetSelectionActive] = useState(false);

  // Edit Target UI Modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [targetEditKind, setTargetEditKind] = useState<'FIELD' | 'METHOD'>('FIELD');
  const [targetEditAssemblyName, setTargetEditAssemblyName] = useState('');
  const [targetEditNamespace, setTargetEditNamespace] = useState('');
  const [targetEditClassName, setTargetEditClassName] = useState('');
  const [targetEditMemberName, setTargetEditMemberName] = useState('');
  const [targetEditCustomName, setTargetEditCustomName] = useState('');
  const [targetEditGroupName, setTargetEditGroupName] = useState('');
  const [targetEditComment, setTargetEditComment] = useState('');
  const [targetEditProfileId, setTargetEditProfileId] = useState('');

  // Clear selected target & selection mode when navigating away
  useEffect(() => {
    setSelectedTarget(null);
    setIsTargetSelectionActive(false);
  }, [selectedClassIndex, currentLevel, classTab]);

  // Debounce search query to prevent main-thread freezing on 75MB+ dumps
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Auto switch tab based on initialClassTab when navigating from target card or modal
  useEffect(() => {
    if (initialClassTab) {
      setClassTab(initialClassTab === 'METHOD' ? ClassTab.METHODS : ClassTab.FIELDS);
    }
  }, [initialClassTab, selectedClassIndex]);

  // Clear search text whenever switching class tabs or navigating levels
  useEffect(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  }, [classTab, selectedClassIndex, selectedNamespace, selectedAssemblyIndex]);

  // Scroll to top when navigating levels or switching tabs
  useEffect(() => {
    if (scrollContainerRef.current && !scrollToMember) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedAssemblyIndex, selectedNamespace, selectedClassIndex, classTab, currentLevel]);

  // Handler to navigate and clear search
  const handleSelectAssemblyAndClear = (index: number) => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    if (onCloseSearch) onCloseSearch();
    onSelectAssembly(index);
  };

  const handleSelectNamespaceAndClear = (ns: string) => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    if (onCloseSearch) onCloseSearch();
    onSelectNamespace(ns);
  };

  const handleSelectClassAndClear = (index: number) => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    if (onCloseSearch) onCloseSearch();
    onSelectClass(index);
  };

  // Browser Card View Settings
  const [browserSettings, setBrowserSettings] = useState<BrowserCardViewSettings>(() => {
    try {
      const vKey = 'il2cpp_browser_view_settings_v4';
      const hasInit = localStorage.getItem(vKey);
      if (hasInit) {
        const saved = localStorage.getItem('il2cpp_browser_view_settings');
        if (saved) {
          return { ...DEFAULT_BROWSER_VIEW_SETTINGS, ...JSON.parse(saved) };
        }
      } else {
        localStorage.setItem(vKey, '1');
        localStorage.setItem('il2cpp_browser_view_settings', JSON.stringify(DEFAULT_BROWSER_VIEW_SETTINGS));
      }
    } catch {
      // fallback
    }
    return DEFAULT_BROWSER_VIEW_SETTINGS;
  });

  const [isBrowserSettingsModalOpen, setIsBrowserSettingsModalOpen] = useState(false);

  const updateBrowserSettings = (patch: Partial<BrowserCardViewSettings>) => {
    setBrowserSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('il2cpp_browser_view_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Queries (re-evaluated when storageDumpName or selections change)
  const assemblies = useMemo(() => il2cppEngine.getAssemblies(), [storageDumpName]);
  const namespaces = useMemo(() => {
    if (selectedAssemblyIndex === null) return [];
    return il2cppEngine.getNamespaces(selectedAssemblyIndex);
  }, [selectedAssemblyIndex, storageDumpName]);

  const classesInNamespace = useMemo(() => {
    if (selectedAssemblyIndex === null) return [];
    return il2cppEngine.getClasses(
      selectedAssemblyIndex,
      selectedNamespace !== null ? selectedNamespace : undefined
    );
  }, [selectedAssemblyIndex, selectedNamespace, storageDumpName]);

  const currentClassInfo: ClassInfoDescriptor | undefined = useMemo(() => {
    if (selectedClassIndex === null) return undefined;
    return il2cppEngine.getClass(selectedClassIndex);
  }, [selectedClassIndex, storageDumpName]);

  const currentFields: FieldDescriptor[] = useMemo(() => {
    if (selectedClassIndex === null) return [];
    return il2cppEngine.getFields(selectedClassIndex);
  }, [selectedClassIndex, storageDumpName]);

  const currentMethods: MethodDescriptor[] = useMemo(() => {
    if (selectedClassIndex === null) return [];
    return il2cppEngine.getMethods(selectedClassIndex);
  }, [selectedClassIndex, storageDumpName]);

  // Auto-scroll down to targeted member in list when scrollToMember is provided
  useEffect(() => {
    if (!scrollToMember || selectedClassIndex === null) return;
    const targetKind = scrollToMember.kind;
    const targetName = scrollToMember.memberName.toLowerCase();

    // Auto set class tab
    setClassTab(targetKind === 'METHOD' ? ClassTab.METHODS : ClassTab.FIELDS);

    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return;
      const list = targetKind === 'METHOD' ? currentMethods : currentFields;
      const idx = list.findIndex((m) => m.name.toLowerCase() === targetName);
      if (idx !== -1) {
        const isCompact = browserSettings.density === 'compact';
        const rowHeight = isCompact ? 40 : 54;
        const targetScrollTop = Math.max(0, idx * rowHeight - 40);
        scrollContainerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [scrollToMember, selectedClassIndex, currentFields, currentMethods, browserSettings.density]);

  // Effective search scope: If inside class details (fields/methods), search scope is locked to 'current' only
  const effectiveSearchScope = selectedClassIndex !== null ? 'current' : searchScope;

  // Global search results (Requires min 2 chars for everywhere search to keep UI fast)
  const globalSearchResults: SymbolSearchDescriptor[] = useMemo(() => {
    if (effectiveSearchScope !== 'everywhere' || !debouncedSearchQuery.trim() || debouncedSearchQuery.trim().length < 2) return [];
    return il2cppEngine.searchEverywhere(debouncedSearchQuery, matchMode, matchCase);
  }, [effectiveSearchScope, debouncedSearchQuery, matchMode, matchCase, storageDumpName]);

  // Filter helper using debounced query for instant smooth typing
  const filterMatch = (text: string | undefined): boolean => {
    if (!text) return false;
    if (!debouncedSearchQuery.trim()) return true;
    const term = matchCase ? debouncedSearchQuery : debouncedSearchQuery.toLowerCase();
    const val = matchCase ? text : text.toLowerCase();
    return matchMode === SearchMatchMode.EXACT ? val === term : val.includes(term);
  };

  // Dynamic grid class computation based on tablet/large screen setting
  const getGridClasses = (context: 'standard' | 'methods') => {
    const layout = browserSettings.tabletLayout || 'grid';
    if (context === 'methods') {
      if (layout === 'list') return 'grid grid-cols-1 gap-2 p-2 sm:p-3';
      if (layout === 'dense') return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2 sm:p-3';
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2.5 sm:gap-3 p-2 sm:p-3';
    }
    // Standard cards (Assemblies, Namespaces, Classes, Fields, Search results)
    if (layout === 'list') return 'grid grid-cols-1 gap-2 p-2 sm:p-3';
    if (layout === 'dense') return 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2 sm:p-3';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 p-2 sm:p-3';
  };

  const getColumnsConfig = (context: 'standard' | 'methods') => {
    const layout = browserSettings.tabletLayout || 'grid';
    if (layout === 'list') return 1;
    if (context === 'methods') {
      if (layout === 'dense') return { sm: 1, md: 2, lg: 3, xl: 3 };
      return { sm: 1, md: 2, lg: 2, xl: 2 };
    }
    if (layout === 'dense') return { sm: 1, md: 3, lg: 4, xl: 4 };
    return { sm: 1, md: 2, lg: 3, xl: 3 };
  };

  const isCompact = browserSettings.density === 'compact';

  // Helper to determine if a member is already saved in active profile
  const isTargetSavedInProfile = (
    classNameOrOwner: string,
    memberName: string,
    kind: 'FIELD' | 'METHOD',
    classIndex?: number
  ): boolean => {
    if (!activeProfile || !activeProfile.items) return false;

    let targetCls = classNameOrOwner.trim();
    let targetNs = '';

    if (classIndex !== undefined && classIndex >= 0) {
      const cls = il2cppEngine.getClass(classIndex);
      if (cls) {
        targetCls = cls.name;
        targetNs = cls.namespaceName || '';
      }
    }

    if (!targetNs) {
      if (targetCls.includes(':')) {
        const parts = targetCls.split(':');
        targetNs = parts[0].trim();
        targetCls = parts.slice(1).join(':').trim();
      } else if (targetCls.includes('::')) {
        const parts = targetCls.split('::');
        targetNs = parts[0].trim();
        targetCls = parts.slice(1).join(':').trim();
      }
    }

    const targetClsLower = targetCls.toLowerCase();
    const targetNsLower = targetNs.toLowerCase();
    const targetMemberLower = memberName.trim().toLowerCase();

    return activeProfile.items.some((t) => {
      if (t.kind !== kind) return false;
      if (!t.memberName || t.memberName.trim().toLowerCase() !== targetMemberLower) return false;

      let itemNs = (t.namespaceName || '').trim().toLowerCase();
      let itemCls = (t.className || '').trim();
      if (itemCls.includes(':')) {
        const parts = itemCls.split(':');
        itemNs = parts[0].trim().toLowerCase() || itemNs;
        itemCls = parts.slice(1).join(':').trim();
      } else if (itemCls.includes('::')) {
        const parts = itemCls.split('::');
        itemNs = parts[0].trim().toLowerCase() || itemNs;
        itemCls = parts.slice(1).join(':').trim();
      }
      const itemClsLower = itemCls.toLowerCase();

      if (itemClsLower === targetClsLower) {
        if (!targetNsLower || !itemNs || targetNsLower === itemNs) return true;
      }
      return false;
    });
  };

  const savedTargetsInCurrentClass = useMemo(() => {
    if (!currentClassInfo || !activeProfile || !activeProfile.items) return 0;
    return activeProfile.items.filter(
      (t) => t.className && t.className.toLowerCase() === currentClassInfo.name.toLowerCase()
    ).length;
  }, [currentClassInfo, activeProfile]);

  const availableGroups = useMemo(() => {
    if (!activeProfile?.items) return [];
    const grps = new Set<string>();
    activeProfile.items.forEach((it) => {
      if (it.groupName) grps.add(it.groupName);
    });
    return Array.from(grps);
  }, [activeProfile]);

  const handleOpenSaveTargetModal = (member?: SelectedBrowserMember) => {
    const target = member || selectedTarget;
    if (!target) return;
    setTargetEditKind(target.kind);
    setTargetEditAssemblyName(target.assemblyName || currentClassInfo?.assemblyName || '');
    
    let ns = target.namespaceName || currentClassInfo?.namespaceName || '';
    let cls = target.className || currentClassInfo?.name || '';
    if (cls.includes(':')) {
      const parts = cls.split(':');
      ns = parts[0].trim() || ns;
      cls = parts.slice(1).join(':').trim();
    } else if (cls.includes('::')) {
      const parts = cls.split('::');
      ns = parts[0].trim() || ns;
      cls = parts.slice(1).join(':').trim();
    }

    setTargetEditNamespace(ns);
    setTargetEditClassName(ns ? `${ns}:${cls}` : cls);
    setTargetEditMemberName(target.memberName);
    setTargetEditCustomName(target.memberName);
    setTargetEditGroupName('');
    setTargetEditComment('');
    setTargetEditProfileId(activeProfileId || (profiles && profiles[0]?.id) || '');
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveTarget = () => {
    if (!targetEditClassName.trim() || !targetEditMemberName.trim()) {
      if (showToast) showToast('Class and member names are required');
      return;
    }
    if (!onSaveTargetToProfile) {
      if (showToast) showToast('Target saving is not available');
      return;
    }

    let parsedNs = targetEditNamespace.trim() || undefined;
    let parsedClass = targetEditClassName.trim();
    if (parsedClass.includes(':')) {
      const parts = parsedClass.split(':');
      parsedNs = parts[0].trim() || undefined;
      parsedClass = parts.slice(1).join(':').trim();
    } else if (parsedClass.includes('::')) {
      const parts = parsedClass.split('::');
      parsedNs = parts[0].trim() || undefined;
      parsedClass = parts.slice(1).join(':').trim();
    }

    const itemToSave: Omit<WatchlistTargetItem, 'id'> = {
      customName: targetEditCustomName.trim() || undefined,
      assemblyName: targetEditAssemblyName.trim() || undefined,
      namespaceName: parsedNs,
      className: parsedClass,
      memberName: targetEditMemberName.trim(),
      kind: targetEditKind,
      groupName: targetEditGroupName.trim() || undefined,
      comment: targetEditComment.trim() || undefined,
      typeName: selectedTarget?.typeName,
      signature: selectedTarget?.signature,
      resolved: true,
      resolvedClassName: parsedClass,
      resolvedMemberName: targetEditMemberName.trim(),
      resolvedAssemblyName: targetEditAssemblyName.trim() || undefined,
      // Zero-offset persistence: No offsetHex, rvaHex, or vaHex saved
      offsetHex: undefined,
      rvaHex: undefined,
      vaHex: undefined,
      lastScannedAt: Date.now(),
    };

    onSaveTargetToProfile(itemToSave, targetEditProfileId);
    setIsSaveModalOpen(false);
    setSelectedTarget(null);
    setIsTargetSelectionActive(false);
  };

  // Responsive Settings Button for Tablet & Big Screen
  const renderTabletToolbar = () => (
    <div className="hidden md:flex items-center shrink-0">
      <button
        onClick={() => setIsBrowserSettingsModalOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#A1A1AA] hover:text-white bg-[#18181A] hover:bg-[#252528] rounded-lg border border-[#333336] transition-colors shadow-sm"
        title="Browser Card Settings"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
        <span>Card Settings</span>
      </button>
    </div>
  );

  return (
    <div className="browser-workspace-container flex-1 flex flex-col bg-[#242426] text-[#E2E2E4] overflow-hidden">
      {/* Search Dock */}
      {isSearchOpen && (
        <div className="bg-[#1C1C1E] border-b border-[#353535] p-2 sm:p-3 flex flex-col gap-2 sm:gap-2.5 shadow-md">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchScope === 'everywhere'
                    ? 'Search classes, fields, methods, RVAs...'
                    : 'Search in current view...'
                }
                autoFocus
                className="w-full bg-[#28282A] border border-[#3A3A3C] focus:border-indigo-500 rounded-lg pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-[11px] sm:text-sm text-[#E2E2E4] placeholder-[#8E8E93] outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white p-0.5"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearchQuery('');
                if (onCloseSearch) onCloseSearch();
              }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-[#8E8E93] hover:text-white rounded-lg hover:bg-[#28282A] transition-colors shrink-0"
            >
              Cancel
            </button>
          </div>

          {/* Search Options Toolbar */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-[#8E8E93] gap-1">
            {/* Scope tabs */}
            {selectedClassIndex === null ? (
              <div className="flex items-center bg-[#28282A] p-0.5 rounded-lg border border-[#3A3A3C]">
                <button
                  onClick={() => setSearchScope('current')}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md font-medium transition-colors text-[9.5px] sm:text-xs ${
                    searchScope === 'current'
                      ? 'bg-[#3A3A3C] text-white'
                      : 'hover:text-[#E2E2E4]'
                  }`}
                >
                  CURRENT LEVEL
                </button>
                <button
                  onClick={() => setSearchScope('everywhere')}
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-md font-medium transition-colors text-[9.5px] sm:text-xs ${
                    searchScope === 'everywhere'
                      ? 'bg-[#3A3A3C] text-white'
                      : 'hover:text-[#E2E2E4]'
                  }`}
                >
                  EVERYWHERE
                </button>
              </div>
            ) : (
              <div className="flex items-center bg-[#28282A] px-2.5 py-1 rounded-lg border border-[#3A3A3C] text-[9.5px] sm:text-xs font-semibold text-sky-400">
                <span>CURRENT LEVEL</span>
              </div>
            )}

            {/* Match mode options */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() =>
                  setMatchMode(
                    matchMode === SearchMatchMode.CONTAINS
                      ? SearchMatchMode.EXACT
                      : SearchMatchMode.CONTAINS
                  )
                }
                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md border text-[9.5px] sm:text-[11px] transition-colors ${
                  matchMode === SearchMatchMode.EXACT
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'border-[#3A3A3C] hover:text-[#E2E2E4]'
                }`}
              >
                Exact match
              </button>
              <button
                onClick={() => setMatchCase(!matchCase)}
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border text-[9.5px] sm:text-[11px] font-mono transition-colors ${
                  matchCase
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'border-[#3A3A3C] hover:text-[#E2E2E4]'
                }`}
                title="Match case"
              >
                Aa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {/* Global search results mode */}
        {isSearchOpen && effectiveSearchScope === 'everywhere' && searchQuery.trim() ? (
          <div>
            <div className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-[#8E8E93] border-b border-[#353535] bg-[#202020]/60 uppercase tracking-wider flex items-center justify-between">
              <span>Search Results · {globalSearchResults.length.toLocaleString()} found</span>
              {renderTabletToolbar()}
            </div>
            {searchQuery.trim().length < 2 ? (
              <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-[#8E8E93]">
                Type at least 2 characters to search everywhere across all assemblies...
              </div>
            ) : globalSearchResults.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-[#8E8E93]">
                No classes, fields, or methods match "{searchQuery}"
              </div>
            ) : (
              <VirtualScrollList
                items={globalSearchResults}
                scrollContainerRef={scrollContainerRef}
                estimatedItemHeight={isCompact ? 46 : 64}
                columns={getColumnsConfig('standard')}
                gridClassName={getGridClasses('standard')}
                renderItem={(res) => (
                  <div
                    key={res.id}
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                      if (onCloseSearch) onCloseSearch();
                      onSelectClass(res.classIndex);
                    }}
                    className={`${
                      isCompact ? 'p-1.5 sm:p-2.5' : 'p-2.5 sm:p-4'
                    } bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] hover:bg-[#2C2C2E] md:hover:to-[#1F1F24] border border-[#353535] md:border-[#38383E] hover:border-indigo-500/40 rounded-lg sm:rounded-xl cursor-pointer flex items-center justify-between group transition-all shadow-sm`}
                  >
                    <div className="min-w-0 pr-2 sm:pr-3">
                      <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <span
                          className={`px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider ${
                            res.kind === SymbolKind.CLASS
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : res.kind === SymbolKind.METHOD
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {SymbolKind[res.kind]}
                        </span>
                        <span className="font-medium text-[11px] sm:text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                          {res.name}
                        </span>
                      </div>
                      {browserSettings.showMetadata && (
                        <div className="text-[9.5px] sm:text-xs text-[#8E8E93] truncate font-mono-code">
                          {res.ownerName} · {res.assemblyName}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      {res.kind === SymbolKind.CLASS && (() => {
                        const counts = il2cppEngine.getClassCounts(res.classIndex);
                        return (
                          <div className="flex items-center gap-1 sm:gap-1.5 font-mono-code text-[8.5px] sm:text-xs">
                            <span
                              className="w-[36px] sm:w-[86px] py-0.2 sm:py-0.5 text-center inline-flex items-center justify-center rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 whitespace-nowrap font-medium"
                              title={`${counts.fieldCount} Fields`}
                            >
                              <span>{counts.fieldCount}</span>
                              <span className="hidden sm:inline">&nbsp;{counts.fieldCount === 1 ? 'field' : 'fields'}</span>
                              <span className="sm:hidden">&nbsp;f</span>
                            </span>
                            <span
                              className="w-[36px] sm:w-[86px] py-0.2 sm:py-0.5 text-center inline-flex items-center justify-center rounded bg-blue-500/10 border border-blue-500/25 text-blue-300 whitespace-nowrap font-medium"
                              title={`${counts.methodCount} Methods`}
                            >
                              <span>{counts.methodCount}</span>
                              <span className="hidden sm:inline">&nbsp;{counts.methodCount === 1 ? 'method' : 'methods'}</span>
                              <span className="sm:hidden">&nbsp;m</span>
                            </span>
                          </div>
                        );
                      })()}
                      {browserSettings.showRvaLabels && res.rvaLabel && (
                        <span className="font-mono-code text-[9px] sm:text-xs px-1 sm:px-2 py-0.2 sm:py-0.5 bg-[#1C1C1E] border border-[#353535] rounded text-indigo-300">
                          {res.rvaLabel}
                        </span>
                      )}
                      {browserSettings.showRvaLabels && res.offsetLabel && (
                        <span className="font-mono-code text-[9px] sm:text-xs px-1 sm:px-2 py-0.2 sm:py-0.5 bg-[#1C1C1E] border border-[#353535] rounded text-emerald-300">
                          {res.offsetLabel}
                        </span>
                      )}

                      {/* Target Quick Save Button in Global Search */}
                      {(res.kind === SymbolKind.FIELD || res.kind === SymbolKind.METHOD) && (() => {
                        const isGlobalSaved = isTargetSavedInProfile(
                          res.ownerName,
                          res.name,
                          res.kind === SymbolKind.FIELD ? 'FIELD' : 'METHOD',
                          res.classIndex
                        );
                        return isGlobalSaved ? (
                          <span
                            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[9px] sm:text-[10.5px] font-medium shrink-0"
                            title="Saved in profile target"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                            <span className="hidden sm:inline">Saved</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const clsObj = res.classIndex !== undefined ? il2cppEngine.getClass(res.classIndex) : undefined;
                              handleOpenSaveTargetModal({
                                kind: res.kind === SymbolKind.FIELD ? 'FIELD' : 'METHOD',
                                className: clsObj?.name || res.ownerName,
                                namespaceName: clsObj?.namespaceName || undefined,
                                memberName: res.name,
                                assemblyName: clsObj?.assemblyName || res.assemblyName,
                                signature: res.signature,
                              });
                            }}
                            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all text-[9px] sm:text-[10.5px] font-semibold shrink-0 active:scale-95"
                            title={`Save ${res.name} to profile targets`}
                          >
                            <BookmarkPlus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400" />
                            <span>+ Target</span>
                          </button>
                        );
                      })()}

                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        ) : currentLevel === DirectoryLevel.ASSEMBLIES ? (
          /* Level 1: Assemblies List */
          <div>
            <div className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-[#8E8E93] border-b border-[#353535] bg-[#202020]/60 uppercase tracking-wider flex items-center justify-between">
              <span>Assemblies · {assemblies.length.toLocaleString()}</span>
              {renderTabletToolbar()}
            </div>
            {(() => {
              const matched = assemblies.filter((a) => filterMatch(a.name));
              return (
                <VirtualScrollList
                  items={matched}
                  scrollContainerRef={scrollContainerRef}
                  estimatedItemHeight={isCompact ? 42 : 56}
                  columns={getColumnsConfig('standard')}
                  gridClassName={getGridClasses('standard')}
                  renderItem={(asm) => (
                    <div
                      key={asm.index}
                      onClick={() => handleSelectAssemblyAndClear(asm.index)}
                      className={`flex items-center justify-between ${
                        isCompact ? 'p-1.5 sm:p-2.5' : 'p-2.5 sm:p-3.5'
                      } bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] hover:bg-[#2C2C2E] md:hover:to-[#1F1F24] border border-[#353535] md:border-[#38383E] hover:border-indigo-500/40 rounded-lg sm:rounded-xl cursor-pointer group transition-all shadow-sm`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[11px] sm:text-sm text-[#E2E2E4] group-hover:text-white transition-colors truncate">
                            {asm.name}
                          </div>
                          {browserSettings.showMetadata && (
                            <div className="text-[9.5px] sm:text-xs text-[#8E8E93]">
                              {asm.classCount || 0} classes
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  )}
                />
              );
            })()}
          </div>
        ) : currentLevel === DirectoryLevel.NAMESPACES ? (
          /* Level 2: Namespaces & Global Classes */
          <div>
            <div className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-[#8E8E93] border-b border-[#353535] bg-[#202020]/60 uppercase tracking-wider flex items-center justify-between">
              <span>Namespaces · {namespaces.length.toLocaleString()}</span>
              {renderTabletToolbar()}
            </div>
            {(() => {
              const matched = namespaces.filter((ns) => filterMatch(ns.name || 'global'));
              return (
                <VirtualScrollList
                  items={matched}
                  scrollContainerRef={scrollContainerRef}
                  estimatedItemHeight={isCompact ? 42 : 56}
                  columns={getColumnsConfig('standard')}
                  gridClassName={getGridClasses('standard')}
                  renderItem={(ns) => (
                    <div
                      key={ns.index}
                      onClick={() => handleSelectNamespaceAndClear(ns.name)}
                      className={`flex items-center justify-between ${
                        isCompact ? 'p-1.5 sm:p-2.5' : 'p-2.5 sm:p-3.5'
                      } bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] hover:bg-[#2C2C2E] md:hover:to-[#1F1F24] border border-[#353535] md:border-[#38383E] hover:border-amber-500/40 rounded-lg sm:rounded-xl cursor-pointer group transition-all shadow-sm`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                          <Folder className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[11px] sm:text-sm text-[#E2E2E4] group-hover:text-white transition-colors truncate">
                            {ns.name || '(global namespace)'}
                          </div>
                          {browserSettings.showMetadata && (
                            <div className="text-[9.5px] sm:text-xs text-[#8E8E93]">
                              {ns.classCount || 0} classes
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  )}
                />
              );
            })()}
          </div>
        ) : currentLevel === DirectoryLevel.CLASSES ? (
          /* Level 3: Classes in Selected Namespace */
          <div>
            <div className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-semibold text-[#8E8E93] border-b border-[#353535] bg-[#202020]/60 uppercase tracking-wider flex items-center justify-between">
              <span>Classes · {classesInNamespace.length.toLocaleString()}</span>
              {renderTabletToolbar()}
            </div>
            {(() => {
              const matchedClasses = classesInNamespace.filter(
                (c) =>
                  filterMatch(c.name) ||
                  filterMatch(c.namespaceName ? `${c.namespaceName}.${c.name}` : undefined)
              );

              return (
                <VirtualScrollList
                  items={matchedClasses}
                  scrollContainerRef={scrollContainerRef}
                  estimatedItemHeight={isCompact ? 42 : 56}
                  columns={getColumnsConfig('standard')}
                  gridClassName={getGridClasses('standard')}
                  renderItem={(cls) => {
                    const counts = il2cppEngine.getClassCounts(cls.index);
                    return (
                      <div
                        key={cls.index}
                        onClick={() => handleSelectClassAndClear(cls.index)}
                        className={`flex items-center justify-between ${
                          isCompact ? 'p-1.5 sm:p-2.5' : 'p-2.5 sm:p-3.5'
                        } bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] hover:bg-[#2C2C2E] md:hover:to-[#1F1F24] border border-[#353535] md:border-[#38383E] hover:border-purple-500/40 rounded-lg sm:rounded-xl cursor-pointer group transition-all shadow-sm`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-1.5 sm:pr-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                            <Box className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-[11px] sm:text-sm text-[#E2E2E4] group-hover:text-white transition-colors truncate">
                              {cls.name}
                            </div>
                            {browserSettings.showMetadata && (
                              <div className="text-[9.5px] sm:text-xs text-[#8E8E93] truncate">
                                {cls.parentType?.name ? `: ${cls.parentType.name}` : cls.namespaceName || 'global'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          <div className="flex items-center gap-1 sm:gap-1.5 font-mono-code text-[8.5px] sm:text-xs">
                            <span
                              className="w-[36px] sm:w-[86px] py-0.2 sm:py-0.5 text-center inline-flex items-center justify-center rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-medium whitespace-nowrap"
                              title={`${counts.fieldCount} Fields`}
                            >
                              <span>{counts.fieldCount}</span>
                              <span className="hidden sm:inline">&nbsp;{counts.fieldCount === 1 ? 'field' : 'fields'}</span>
                              <span className="sm:hidden">&nbsp;f</span>
                            </span>
                            <span
                              className="w-[36px] sm:w-[86px] py-0.2 sm:py-0.5 text-center inline-flex items-center justify-center rounded bg-blue-500/10 border border-blue-500/25 text-blue-300 font-medium whitespace-nowrap"
                              title={`${counts.methodCount} Methods`}
                            >
                              <span>{counts.methodCount}</span>
                              <span className="hidden sm:inline">&nbsp;{counts.methodCount === 1 ? 'method' : 'methods'}</span>
                              <span className="sm:hidden">&nbsp;m</span>
                            </span>
                          </div>
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      </div>
                    );
                  }}
                />
              );
            })()}
          </div>
        ) : (
          /* Level 4: Class Details View */
          currentClassInfo && (
            <div className="flex flex-col">
              {/* Class Header Banner */}
              <div className="p-2.5 sm:p-4 bg-[#1C1C1E] border-b border-[#353535]">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        CLASS
                      </span>
                      <h2 className="text-xs sm:text-base md:text-lg font-bold text-white tracking-tight truncate">
                        {currentClassInfo.name}
                      </h2>
                    </div>
                    <div className="text-[10px] sm:text-xs text-[#8E8E93] mt-0.5 sm:mt-1 font-mono-code truncate">
                      {currentClassInfo.namespaceName
                        ? `${currentClassInfo.namespaceName}.${currentClassInfo.name}`
                        : currentClassInfo.name}{' '}
                      · {currentClassInfo.assemblyName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {savedTargetsInCurrentClass > 0 && (
                      <span
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono text-[9px] sm:text-[10px] font-medium"
                        title={`${savedTargetsInCurrentClass} target(s) saved from this class in ${activeProfile?.name || 'profile'}`}
                      >
                        <Target className="w-2.5 h-2.5 text-indigo-400" />
                        <span>{savedTargetsInCurrentClass} in targets</span>
                      </span>
                    )}
                    <button
                      onClick={() =>
                        onCopyText(
                          currentClassInfo.namespaceName
                            ? `${currentClassInfo.namespaceName}.${currentClassInfo.name}`
                            : currentClassInfo.name,
                          'Class Full Name'
                        )
                      }
                      className="p-1 sm:p-2 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#28282A] border border-[#353535]"
                      title="Copy full class name"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Class Metadata Badges */}
                {browserSettings.showMetadata && (
                  <div className="flex flex-wrap gap-1 sm:gap-2 mt-1.5 sm:mt-3 text-xs text-[#8E8E93]">
                    {currentClassInfo.parentType?.name && (
                      <div className="px-1.5 sm:px-2.5 py-0.2 sm:py-1 rounded bg-[#28282A] border border-[#353535] font-mono-code text-[9px] sm:text-[11px]">
                        Base: <span className="text-[#E2E2E4]">{currentClassInfo.parentType.name}</span>
                      </div>
                    )}
                    {currentClassInfo.typeInfoHex && (
                      <button
                        onClick={() =>
                          onCopyText(currentClassInfo.typeInfoHex!, 'Class TypeInfo')
                        }
                        className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.2 sm:py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 font-mono-code text-[9px] sm:text-[11px] text-purple-300 transition-colors"
                        title="Copy TypeInfo Pointer"
                      >
                        <span>TypeInfo: {currentClassInfo.typeInfoHex}</span>
                        <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Segmented Tabs: Fields vs Methods */}
              <div className="flex items-center justify-between border-b border-[#353535] bg-[#1E1E20] sticky top-0 z-10 pr-2">
                <div className="flex flex-1">
                  <button
                    onClick={() => setClassTab(ClassTab.FIELDS)}
                    className={`flex-1 py-1.5 sm:py-3 text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition-colors ${
                      classTab === ClassTab.FIELDS
                        ? 'border-indigo-500 text-white bg-[#242426]'
                        : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>FIELDS ({currentFields.length})</span>
                  </button>
                  <button
                    onClick={() => setClassTab(ClassTab.METHODS)}
                    className={`flex-1 py-1.5 sm:py-3 text-[10px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition-colors ${
                      classTab === ClassTab.METHODS
                        ? 'border-indigo-500 text-white bg-[#242426]'
                        : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>METHODS ({currentMethods.length})</span>
                  </button>
                </div>

                {/* Tablet toolbar inside Class details */}
                {renderTabletToolbar()}
              </div>

              {/* Tab Content: Fields List */}
              {classTab === ClassTab.FIELDS && (
                <div>
                  {currentFields.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-[#8E8E93]">
                      This class declares no fields.
                    </div>
                  ) : (() => {
                    const matchedFields = currentFields.filter(
                      (f) => filterMatch(f.name) || filterMatch(f.typeName)
                    );

                    return (
                      <VirtualScrollList
                        items={matchedFields}
                        scrollContainerRef={scrollContainerRef}
                        estimatedItemHeight={isCompact ? 40 : 54}
                        columns={getColumnsConfig('standard')}
                        gridClassName={getGridClasses('standard')}
                        renderItem={(field) => {
                          const isSelected =
                            selectedTarget?.kind === 'FIELD' &&
                            selectedTarget.className.toLowerCase() === currentClassInfo.name.toLowerCase() &&
                            selectedTarget.memberName.toLowerCase() === field.name.toLowerCase();
                          const isSaved = isTargetSavedInProfile(currentClassInfo.name, field.name, 'FIELD');

                          return (
                            <div
                              key={field.index}
                              onClick={() => {
                                setSelectedTarget({
                                  kind: 'FIELD',
                                  className: currentClassInfo.name,
                                  namespaceName: currentClassInfo.namespaceName,
                                  memberName: field.name,
                                  assemblyName: currentClassInfo.assemblyName,
                                  typeName: field.typeName,
                                  field,
                                });
                                setIsTargetSelectionActive(true);
                              }}
                              className={`${
                                isCompact ? 'p-1.5 sm:p-2.5' : 'p-2.5 sm:p-3.5'
                              } ${
                                isSelected
                                  ? 'bg-[#25252E] border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/40'
                                  : isTargetSelectionActive
                                  ? 'bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] border-[#353535] md:border-[#38383E] hover:border-indigo-500/60 hover:bg-[#25252B]'
                                  : 'bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] border-[#353535] md:border-[#38383E] hover:bg-[#2A2A2D] md:hover:to-[#1F1F24]'
                              } border rounded-lg sm:rounded-xl transition-all flex items-center justify-between gap-1.5 sm:gap-3 group shadow-sm cursor-pointer`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1 sm:gap-2 font-mono-code text-[11px] sm:text-sm">
                                  {field.isStatic && (
                                    <span className="px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      STATIC
                                    </span>
                                  )}
                                  <span className={`font-semibold truncate ${isSelected ? 'text-indigo-200' : 'text-white'}`}>
                                    {field.name}
                                  </span>
                                </div>
                                {browserSettings.showMetadata && (
                                  <div className="text-[9.5px] sm:text-xs text-[#8E8E93] font-mono-code mt-0.5 truncate">
                                    {field.typeName || 'object'}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                {field.offset !== undefined && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCopyText(
                                        `0x${field.offset!.toString(16)}`,
                                        'Field Offset'
                                      );
                                    }}
                                    className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-[#1C1C1E] hover:bg-[#353535] text-emerald-300 font-mono-code text-[9.5px] sm:text-xs border border-[#353535] transition-colors"
                                    title="Copy offset"
                                  >
                                    <span>0x{field.offset.toString(16)}</span>
                                    <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8E8E93]" />
                                  </button>
                                )}

                                {/* Target Selected / Saved Status */}
                                {isSelected ? (
                                  <span
                                    className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9.5px] sm:text-xs font-semibold shrink-0"
                                    title="Selected for target saving"
                                  >
                                    <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400" />
                                    <span className="hidden xs:inline">Selected</span>
                                  </span>
                                ) : isSaved ? (
                                  <span
                                    className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[9.5px] sm:text-xs font-medium shrink-0"
                                    title={`Saved in profile "${activeProfile?.name || 'Active'}"`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                                    <span className="hidden xs:inline">Saved</span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        }}
                      />
                    );
                  })()}
                </div>
              )}

              {/* Tab Content: Methods List */}
              {classTab === ClassTab.METHODS && (
                <div>
                  {currentMethods.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-[#8E8E93]">
                      This class declares no methods.
                    </div>
                  ) : (() => {
                    const matchedMethods = currentMethods.filter(
                      (m) => filterMatch(m.name) || filterMatch(m.signature)
                    );

                    return (
                      <VirtualScrollList
                        items={matchedMethods}
                        scrollContainerRef={scrollContainerRef}
                        estimatedItemHeight={isCompact ? 52 : 70}
                        columns={getColumnsConfig('methods')}
                        gridClassName={getGridClasses('methods')}
                        renderItem={(method) => {
                          const isSelected =
                            selectedTarget?.kind === 'METHOD' &&
                            selectedTarget.className.toLowerCase() === currentClassInfo.name.toLowerCase() &&
                            selectedTarget.memberName.toLowerCase() === method.name.toLowerCase();
                          const isSaved = isTargetSavedInProfile(currentClassInfo.name, method.name, 'METHOD');

                          return (
                            <div
                              key={method.index}
                              onClick={() => {
                                setSelectedTarget({
                                  kind: 'METHOD',
                                  className: currentClassInfo.name,
                                  namespaceName: currentClassInfo.namespaceName,
                                  memberName: method.name,
                                  assemblyName: currentClassInfo.assemblyName,
                                  signature: method.signature,
                                  method,
                                });
                                setIsTargetSelectionActive(true);
                              }}
                              className={`${
                                isCompact ? 'p-1.5 sm:p-2.5' : 'p-2.5 sm:p-3.5'
                              } ${
                                isSelected
                                  ? 'bg-[#25252E] border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/40'
                                  : isTargetSelectionActive
                                  ? 'bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] border-[#353535] md:border-[#38383E] hover:border-indigo-500/60 hover:bg-[#25252B]'
                                  : 'bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] border-[#353535] md:border-[#38383E] hover:bg-[#2A2A2D] md:hover:to-[#1F1F24]'
                              } border rounded-lg sm:rounded-xl transition-all flex flex-col justify-between group shadow-sm cursor-pointer`}
                            >
                              <div className="min-w-0 flex-1">
                                {/* Line 1: Method Signature / Name and Target Status */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className={`font-semibold text-[11px] sm:text-sm font-mono-code tracking-tight break-words leading-snug flex-1 ${
                                    isSelected ? 'text-indigo-200' : 'text-white'
                                  }`}>
                                    {method.signature || method.name}
                                  </div>

                                  {/* Target Selected / Saved Status */}
                                  {isSelected ? (
                                    <span
                                      className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9.5px] sm:text-xs font-semibold shrink-0"
                                      title="Selected for target saving"
                                    >
                                      <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400" />
                                      <span className="hidden xs:inline">Selected</span>
                                    </span>
                                  ) : isSaved ? (
                                    <span
                                      className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[9.5px] sm:text-xs font-medium shrink-0"
                                      title={`Saved in profile "${activeProfile?.name || 'Active'}"`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                                      <span className="hidden xs:inline">Saved</span>
                                    </span>
                                  ) : null}
                                </div>

                                {/* Line 2: RVA and TypeInfo Pills */}
                                {browserSettings.showRvaLabels && (method.rva || method.typeInfoHex) && (
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs font-mono-code">
                                    {method.rva && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCopyText(
                                            `0x${method.rva!.toString(16).toUpperCase()}`,
                                            'RVA'
                                          );
                                        }}
                                        className="flex items-center gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded bg-[#1C1C1E] hover:bg-[#353535] text-indigo-300 border border-indigo-500/30 transition-colors text-[9px] sm:text-xs font-medium"
                                        title="Copy RVA"
                                      >
                                        <span>RVA: 0x{method.rva.toString(16).toUpperCase()}</span>
                                        <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8E8E93]" />
                                      </button>
                                    )}
                                    {method.typeInfoHex && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCopyText(
                                            method.typeInfoHex!,
                                            'Method TypeInfo'
                                          );
                                        }}
                                        className="flex items-center gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors text-[9px] sm:text-xs font-medium"
                                        title="Copy Method TypeInfo"
                                      >
                                        <span>TypeInfo: {method.typeInfoHex}</span>
                                        <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }}
                      />
                    );
                  })()}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Browser Card & Layout Settings Modal */}
      {isBrowserSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-2.5 sm:p-4 flex justify-center items-start sm:items-center">
          <div className="bg-[#1C1C1F] border border-[#35353A] rounded-xl sm:rounded-3xl p-3 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-2.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 mt-8 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[88vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-[#2C2C30]">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg sm:rounded-xl">
                  <Settings2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs sm:text-base font-bold text-[#E2E2E4]">Browser Card Settings</h3>
                  <p className="text-[9px] sm:text-xs text-[#8E8E93]">Customize card density, grid layout, and badges</p>
                </div>
              </div>
              <button
                onClick={() => setIsBrowserSettingsModalOpen(false)}
                className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] rounded-md sm:rounded-lg transition-colors"
                title="Close settings"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex flex-col gap-2 sm:gap-3 overflow-y-auto pr-0.5">
              {/* Tablet & Big Screen View Style (Hidden on Mobile, shown only on tablet/desktop) */}
              <div className="hidden md:flex bg-[#141416] p-3 rounded-xl border border-[#27272A] flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#D8D8DC]">Tablet & Large Screen Card Style</span>
                  <span className="text-[9px] text-indigo-400 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    Tab & Desktop Only
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => updateBrowserSettings({ tabletLayout: 'list' })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      (browserSettings.tabletLayout || 'list') === 'list'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    List (Default)
                  </button>
                  <button
                    onClick={() => updateBrowserSettings({ tabletLayout: 'grid' })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      browserSettings.tabletLayout === 'grid'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Grid (2-3 Cols)
                  </button>
                  <button
                    onClick={() => updateBrowserSettings({ tabletLayout: 'dense' })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      browserSettings.tabletLayout === 'dense'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Dense (3-4 Cols)
                  </button>
                </div>
              </div>

              {/* Density Segment */}
              <div className="bg-[#141416] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#27272A] flex flex-col gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-semibold text-[#D8D8DC]">Card Density</span>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                    onClick={() => updateBrowserSettings({ density: 'compact' })}
                    className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${
                      (browserSettings.density || 'compact') === 'compact'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Compact (Default)
                  </button>
                  <button
                    onClick={() => updateBrowserSettings({ density: 'comfortable' })}
                    className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${
                      browserSettings.density === 'comfortable'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Comfortable Padding
                  </button>
                </div>
              </div>

              {/* Toggle Options Grid */}
              <div className="flex flex-col gap-1 sm:gap-2 bg-[#141416] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#27272A]">
                <span className="text-[10px] sm:text-xs font-semibold text-[#D8D8DC] mb-0.5 sm:mb-1">Card Details & Information</span>

                {/* Show Metadata Toggle */}
                <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Metadata & Subtext</span>
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display class counts, namespaces, type names, and tokens</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={browserSettings.showMetadata}
                    onChange={(e) => updateBrowserSettings({ showMetadata: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* Show RVA & Offset Tags */}
                <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show RVA & Offset Tags</span>
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display quick copy pills for RVAs and memory offsets</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={browserSettings.showRvaLabels}
                    onChange={(e) => updateBrowserSettings({ showRvaLabels: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-[#2C2C30]">
              <button
                onClick={() => {
                  setBrowserSettings(DEFAULT_BROWSER_VIEW_SETTINGS);
                  try {
                    localStorage.removeItem('il2cpp_browser_view_settings');
                  } catch {}
                  onCopyText('', 'Reset browser card settings to default');
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#8E8E93] hover:text-white hover:bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
                title="Reset all settings to default"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={() => setIsBrowserSettingsModalOpen(false)}
                className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Target Logo & Selection Actions (Bottom-Right, Fields & Methods only) */}
      {Boolean(currentClassInfo && (classTab === ClassTab.FIELDS || classTab === ClassTab.METHODS)) && (
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 max-w-[calc(100vw-24px)]">
          {/* Left-Side Expanding Effects Panel */}
          {isTargetSelectionActive && (
            <div className="flex items-center gap-1 sm:gap-2 bg-[#1C1C20]/95 backdrop-blur-md border border-[#3A3A42] p-1 sm:p-2 rounded-xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-right-4 fade-in duration-200 min-w-0">
              {/* Selected Target Badge / Status Info */}
              <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-[#131315] rounded-lg sm:rounded-xl border border-[#2B2B30] max-w-[100px] sm:max-w-[240px] truncate">
                {selectedTarget ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className={`text-[8px] sm:text-[8.5px] font-mono font-bold px-1 py-0.2 rounded shrink-0 border ${
                        selectedTarget.kind === 'FIELD'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {selectedTarget.kind === 'FIELD' ? 'FLD' : 'MTH'}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white font-mono truncate" title={selectedTarget.memberName}>
                      {selectedTarget.memberName}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#9E9EA4] whitespace-nowrap truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                    <span>
                      Tap a {classTab === ClassTab.FIELDS ? 'field' : 'method'}
                    </span>
                  </div>
                )}
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTarget(null);
                  setIsTargetSelectionActive(false);
                }}
                className="flex items-center gap-0.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium bg-[#25252A] hover:bg-[#2F2F36] text-[#A1A1A8] hover:text-white border border-[#3A3A42] transition-colors shrink-0 cursor-pointer"
                title="Cancel selection mode"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Cancel</span>
              </button>

              {/* Save Button */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedTarget) return;
                  handleOpenSaveTargetModal();
                }}
                disabled={!selectedTarget}
                className={`flex items-center gap-0.5 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-md shrink-0 ${
                  selectedTarget
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 cursor-pointer'
                    : 'bg-[#25252A] text-[#636369] border border-[#323238] cursor-not-allowed'
                }`}
                title={selectedTarget ? `Save "${selectedTarget.memberName}" to Target Profile` : 'Select a member first'}
              >
                <BookmarkPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Save</span>
              </button>
            </div>
          )}

          {/* Floating Target Logo Button */}
          <button
            type="button"
            onClick={() => {
              setIsTargetSelectionActive((prev) => !prev);
            }}
            className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-200 border cursor-pointer active:scale-95 shrink-0 ${
              isTargetSelectionActive
                ? 'bg-indigo-600 border-indigo-400 text-white ring-2 sm:ring-4 ring-indigo-500/25 shadow-indigo-600/50'
                : 'bg-[#202024] hover:bg-[#28282D] border-[#3E3E46] text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/50 shadow-black/60'
            }`}
            title={
              isTargetSelectionActive
                ? 'Target selection mode is active (click to close)'
                : 'Click to select field or method and save to profile targets'
            }
          >
            <Target
              className={`w-4 h-4 sm:w-6 sm:h-6 transition-transform duration-200 ${
                isTargetSelectionActive ? 'scale-110' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* Edit Target UI Modal for saving to profile */}
      <BrowserSaveTargetModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        targetKind={targetEditKind}
        setTargetKind={setTargetEditKind}
        assemblyName={targetEditAssemblyName}
        setAssemblyName={setTargetEditAssemblyName}
        className={targetEditClassName}
        setClassName={setTargetEditClassName}
        memberName={targetEditMemberName}
        setMemberName={setTargetEditMemberName}
        customName={targetEditCustomName}
        setCustomName={setTargetEditCustomName}
        groupName={targetEditGroupName}
        setGroupName={setTargetEditGroupName}
        comment={targetEditComment}
        setComment={setTargetEditComment}
        selectedProfileId={targetEditProfileId}
        setSelectedProfileId={setTargetEditProfileId}
        profiles={profiles}
        availableGroups={availableGroups}
        onSave={handleConfirmSaveTarget}
      />
    </div>
  );
};
