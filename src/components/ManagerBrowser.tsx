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
} from 'lucide-react';

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
  onSelectAssembly: (index: number) => void;
  onSelectNamespace: (ns: string) => void;
  onSelectClass: (index: number) => void;
  onInspectMethod?: (classIndex: number, methodIndex: number, mode: 'graph' | 'instructions') => void;
  onCopyText: (text: string, label: string) => void;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
}

export const ManagerBrowser: React.FC<ManagerBrowserProps> = ({
  currentLevel,
  selectedAssemblyIndex,
  selectedNamespace,
  selectedClassIndex,
  storageDumpName,
  onSelectAssembly,
  onSelectNamespace,
  onSelectClass,
  onCopyText,
  isSearchOpen,
  onCloseSearch,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'everywhere'>('current');
  const [matchMode, setMatchMode] = useState<SearchMatchMode>(SearchMatchMode.CONTAINS);
  const [matchCase, setMatchCase] = useState(false);
  const [classTab, setClassTab] = useState<ClassTab>(ClassTab.FIELDS);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query to prevent main-thread freezing on 75MB+ dumps
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Scroll to top when navigating levels or switching tabs
  useEffect(() => {
    if (scrollContainerRef.current) {
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

  // Global search results (Requires min 2 chars for everywhere search to keep UI fast)
  const globalSearchResults: SymbolSearchDescriptor[] = useMemo(() => {
    if (searchScope !== 'everywhere' || !debouncedSearchQuery.trim() || debouncedSearchQuery.trim().length < 2) return [];
    return il2cppEngine.searchEverywhere(debouncedSearchQuery, matchMode, matchCase);
  }, [searchScope, debouncedSearchQuery, matchMode, matchCase, storageDumpName]);

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
    <div className="flex-1 flex flex-col bg-[#242426] text-[#E2E2E4] overflow-hidden">
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
              onClick={onCloseSearch}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-[#8E8E93] hover:text-white rounded-lg hover:bg-[#28282A] transition-colors shrink-0"
            >
              Cancel
            </button>
          </div>

          {/* Search Options Toolbar */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-[#8E8E93] gap-1">
            {/* Scope tabs */}
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
        {isSearchOpen && searchScope === 'everywhere' && searchQuery.trim() ? (
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
                        renderItem={(field) => (
                          <div
                            key={field.index}
                            className={`${
                              isCompact ? 'p-1.5 sm:p-2.5' : 'p-2.5 sm:p-3.5'
                            } bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] border border-[#353535] md:border-[#38383E] rounded-lg sm:rounded-xl hover:bg-[#2A2A2D] md:hover:to-[#1F1F24] transition-all flex items-center justify-between gap-1.5 sm:gap-3 group shadow-sm`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 font-mono-code text-[11px] sm:text-sm">
                                {field.isStatic && (
                                  <span className="px-1 sm:px-1.5 py-0.2 rounded text-[8px] sm:text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    STATIC
                                  </span>
                                )}
                                <span className="font-semibold text-white truncate">{field.name}</span>
                              </div>
                              {browserSettings.showMetadata && (
                                <div className="text-[9.5px] sm:text-xs text-[#8E8E93] font-mono-code mt-0.5 truncate">
                                  {field.typeName || 'object'}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                              {field.offset !== undefined && (
                                <button
                                  onClick={() =>
                                    onCopyText(
                                      `0x${field.offset!.toString(16)}`,
                                      'Field Offset'
                                    )
                                  }
                                  className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-[#1C1C1E] hover:bg-[#353535] text-emerald-300 font-mono-code text-[9.5px] sm:text-xs border border-[#353535] transition-colors"
                                  title="Copy offset"
                                >
                                  <span>0x{field.offset.toString(16)}</span>
                                  <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8E8E93]" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
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
                        renderItem={(method) => (
                          <div
                            key={method.index}
                            className={`${
                              isCompact ? 'p-1.5 sm:p-2.5' : 'p-2.5 sm:p-3.5'
                            } bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] border border-[#353535] md:border-[#38383E] rounded-lg sm:rounded-xl hover:bg-[#2A2A2D] md:hover:to-[#1F1F24] transition-all flex flex-col justify-between group shadow-sm`}
                          >
                            <div className="min-w-0 flex-1">
                              {/* Line 1: Method Signature / Name */}
                              <div className="font-semibold text-[11px] sm:text-sm text-white font-mono-code tracking-tight break-words leading-snug">
                                {method.signature || method.name}
                              </div>

                              {/* Line 2: RVA and TypeInfo Pills */}
                              {browserSettings.showRvaLabels && (method.rva || method.typeInfoHex) && (
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs font-mono-code">
                                  {method.rva && (
                                    <button
                                      onClick={() =>
                                        onCopyText(
                                          `0x${method.rva!.toString(16).toUpperCase()}`,
                                          'RVA'
                                        )
                                      }
                                      className="flex items-center gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded bg-[#1C1C1E] hover:bg-[#353535] text-indigo-300 border border-indigo-500/30 transition-colors text-[9px] sm:text-xs font-medium"
                                      title="Copy RVA"
                                    >
                                      <span>RVA: 0x{method.rva.toString(16).toUpperCase()}</span>
                                      <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8E8E93]" />
                                    </button>
                                  )}
                                  {method.typeInfoHex && (
                                    <button
                                      onClick={() =>
                                        onCopyText(
                                          method.typeInfoHex!,
                                          'Method TypeInfo'
                                        )
                                      }
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
                        )}
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
    </div>
  );
};
