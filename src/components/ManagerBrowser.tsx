import React, { useState, useMemo } from 'react';
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
import {
  Folder,
  Layers,
  Box,
  Copy,
  ChevronRight,
  Search,
  X,
  Sparkles,
  ExternalLink,
  Code2,
  Tag,
} from 'lucide-react';

interface ManagerBrowserProps {
  currentLevel: DirectoryLevel | 'CLASS_DETAILS';
  selectedAssemblyIndex: number | null;
  selectedNamespace: string | null;
  selectedClassIndex: number | null;
  onSelectAssembly: (index: number) => void;
  onSelectNamespace: (ns: string) => void;
  onSelectClass: (index: number) => void;
  onInspectMethod: (classIndex: number, methodIndex: number, mode: 'graph' | 'instructions') => void;
  onCopyText: (text: string, label: string) => void;
  isSearchOpen: boolean;
  onCloseSearch: () => void;
}

export const ManagerBrowser: React.FC<ManagerBrowserProps> = ({
  currentLevel,
  selectedAssemblyIndex,
  selectedNamespace,
  selectedClassIndex,
  onSelectAssembly,
  onSelectNamespace,
  onSelectClass,
  onInspectMethod,
  onCopyText,
  isSearchOpen,
  onCloseSearch,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'everywhere'>('current');
  const [matchMode, setMatchMode] = useState<SearchMatchMode>(SearchMatchMode.CONTAINS);
  const [matchCase, setMatchCase] = useState(false);
  const [classTab, setClassTab] = useState<ClassTab>(ClassTab.METHODS);

  // Queries
  const assemblies = useMemo(() => il2cppEngine.getAssemblies(), []);
  const namespaces = useMemo(() => {
    if (selectedAssemblyIndex === null) return [];
    return il2cppEngine.getNamespaces(selectedAssemblyIndex);
  }, [selectedAssemblyIndex]);

  const classesInNamespace = useMemo(() => {
    if (selectedAssemblyIndex === null) return [];
    return il2cppEngine.getClasses(
      selectedAssemblyIndex,
      selectedNamespace !== null ? selectedNamespace : undefined
    );
  }, [selectedAssemblyIndex, selectedNamespace]);

  const currentClassInfo: ClassInfoDescriptor | undefined = useMemo(() => {
    if (selectedClassIndex === null) return undefined;
    return il2cppEngine.getClass(selectedClassIndex);
  }, [selectedClassIndex]);

  const currentFields: FieldDescriptor[] = useMemo(() => {
    if (selectedClassIndex === null) return [];
    return il2cppEngine.getFields(selectedClassIndex);
  }, [selectedClassIndex]);

  const currentMethods: MethodDescriptor[] = useMemo(() => {
    if (selectedClassIndex === null) return [];
    return il2cppEngine.getMethods(selectedClassIndex);
  }, [selectedClassIndex]);

  // Global search results
  const globalSearchResults: SymbolSearchDescriptor[] = useMemo(() => {
    if (searchScope !== 'everywhere' || !searchQuery.trim()) return [];
    return il2cppEngine.searchEverywhere(searchQuery, matchMode, matchCase);
  }, [searchScope, searchQuery, matchMode, matchCase]);

  // Filter helper
  const filterMatch = (text: string | undefined): boolean => {
    if (!text) return false;
    if (!searchQuery.trim()) return true;
    const term = matchCase ? searchQuery : searchQuery.toLowerCase();
    const val = matchCase ? text : text.toLowerCase();
    return matchMode === SearchMatchMode.EXACT ? val === term : val.includes(term);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#242426] text-[#E2E2E4] overflow-hidden">
      {/* Search Dock */}
      {isSearchOpen && (
        <div className="bg-[#1C1C1E] border-b border-[#353535] p-3 flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
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
                className="w-full bg-[#28282A] border border-[#3A3A3C] focus:border-indigo-500 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-[#E2E2E4] placeholder-[#8E8E93] outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={onCloseSearch}
              className="px-3 py-2 text-xs font-medium text-[#8E8E93] hover:text-white rounded-lg hover:bg-[#28282A] transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Search Options Toolbar */}
          <div className="flex items-center justify-between text-xs text-[#8E8E93]">
            {/* Scope tabs */}
            <div className="flex items-center bg-[#28282A] p-0.5 rounded-lg border border-[#3A3A3C]">
              <button
                onClick={() => setSearchScope('current')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  searchScope === 'current'
                    ? 'bg-[#3A3A3C] text-white'
                    : 'hover:text-[#E2E2E4]'
                }`}
              >
                CURRENT LEVEL
              </button>
              <button
                onClick={() => setSearchScope('everywhere')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  searchScope === 'everywhere'
                    ? 'bg-[#3A3A3C] text-white'
                    : 'hover:text-[#E2E2E4]'
                }`}
              >
                EVERYWHERE
              </button>
            </div>

            {/* Match mode options */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setMatchMode(
                    matchMode === SearchMatchMode.CONTAINS
                      ? SearchMatchMode.EXACT
                      : SearchMatchMode.CONTAINS
                  )
                }
                className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                  matchMode === SearchMatchMode.EXACT
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'border-[#3A3A3C] hover:text-[#E2E2E4]'
                }`}
              >
                Exact match
              </button>
              <button
                onClick={() => setMatchCase(!matchCase)}
                className={`px-2 py-1 rounded-md border text-[11px] font-mono transition-colors ${
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
      <div className="flex-1 overflow-y-auto">
        {/* Global search results mode */}
        {isSearchOpen && searchScope === 'everywhere' && searchQuery.trim() ? (
          <div>
            <div className="px-4 py-2 text-xs font-semibold text-[#8E8E93] border-b border-[#353535] bg-[#202020]/60 uppercase tracking-wider">
              Search Results · {globalSearchResults.length} found
            </div>
            {globalSearchResults.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-[#8E8E93]">
                No classes, fields, or methods match "{searchQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
                {globalSearchResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => {
                      onSelectClass(res.classIndex);
                      if (res.kind === SymbolKind.METHOD) {
                        onInspectMethod(res.classIndex, res.memberIndex, 'graph');
                      }
                    }}
                    className="p-3 bg-[#1E1E20] hover:bg-[#2C2C2E] border border-[#353535] rounded-xl cursor-pointer flex items-center justify-between group transition-colors shadow-sm"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            res.kind === SymbolKind.CLASS
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : res.kind === SymbolKind.METHOD
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {SymbolKind[res.kind]}
                        </span>
                        <span className="font-medium text-xs sm:text-sm text-white group-hover:text-indigo-300 transition-colors truncate">
                          {res.name}
                        </span>
                      </div>
                      <div className="text-xs text-[#8E8E93] truncate font-mono-code">
                        {res.ownerName} · {res.assemblyName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {res.rvaLabel && (
                        <span className="font-mono-code text-xs px-2 py-0.5 bg-[#1C1C1E] border border-[#353535] rounded text-indigo-300">
                          {res.rvaLabel}
                        </span>
                      )}
                      {res.offsetLabel && (
                        <span className="font-mono-code text-xs px-2 py-0.5 bg-[#1C1C1E] border border-[#353535] rounded text-emerald-300">
                          {res.offsetLabel}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : currentLevel === DirectoryLevel.ASSEMBLIES ? (
          /* Level 1: Assemblies List */
          <div>
            <div className="px-4 py-2.5 text-xs font-semibold text-[#8E8E93] border-b border-[#353535] bg-[#202020]/60 uppercase tracking-wider">
              Assemblies · {assemblies.length}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
              {assemblies
                .filter((a) => filterMatch(a.name))
                .map((asm) => (
                  <div
                    key={asm.index}
                    onClick={() => onSelectAssembly(asm.index)}
                    className="flex items-center justify-between p-4 bg-[#1E1E20] hover:bg-[#2C2C2E] border border-[#353535] rounded-xl cursor-pointer group transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs sm:text-sm text-[#E2E2E4] group-hover:text-white transition-colors truncate">
                          {asm.name}
                        </div>
                        <div className="text-xs text-[#8E8E93]">
                          {asm.classCount || 0} classes
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
            </div>
          </div>
        ) : currentLevel === DirectoryLevel.NAMESPACES ? (
          /* Level 2: Namespaces & Global Classes */
          <div>
            <div className="px-4 py-2.5 text-xs font-semibold text-[#8E8E93] border-b border-[#353535] bg-[#202020]/60 uppercase tracking-wider">
              Namespaces · {namespaces.length}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
              {namespaces
                .filter((ns) => filterMatch(ns.name || 'global'))
                .map((ns) => (
                  <div
                    key={ns.index}
                    onClick={() => onSelectNamespace(ns.name)}
                    className="flex items-center justify-between p-4 bg-[#1E1E20] hover:bg-[#2C2C2E] border border-[#353535] rounded-xl cursor-pointer group transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs sm:text-sm text-[#E2E2E4] group-hover:text-white transition-colors truncate">
                          {ns.name || '(global namespace)'}
                        </div>
                        <div className="text-xs text-[#8E8E93]">
                          {ns.classCount || 0} classes
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
            </div>
          </div>
        ) : currentLevel === DirectoryLevel.CLASSES ? (
          /* Level 3: Classes in Selected Namespace */
          <div>
            <div className="px-4 py-2.5 text-xs font-semibold text-[#8E8E93] border-b border-[#353535] bg-[#202020]/60 uppercase tracking-wider">
              Classes · {classesInNamespace.length}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
              {classesInNamespace
                .filter((c) => filterMatch(c.name))
                .map((cls) => (
                  <div
                    key={cls.index}
                    onClick={() => onSelectClass(cls.index)}
                    className="flex items-center justify-between p-4 bg-[#1E1E20] hover:bg-[#2C2C2E] border border-[#353535] rounded-xl cursor-pointer group transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs sm:text-sm text-[#E2E2E4] group-hover:text-white transition-colors truncate">
                          {cls.name}
                        </div>
                        <div className="text-xs text-[#8E8E93] truncate">
                          {cls.parentType?.name ? `: ${cls.parentType.name}` : cls.namespaceName || 'global'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8E8E93] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))}
            </div>
          </div>
        ) : (
          /* Level 4: Class Details View */
          currentClassInfo && (
            <div className="flex flex-col">
              {/* Class Header Banner */}
              <div className="p-4 bg-[#1C1C1E] border-b border-[#353535]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        CLASS
                      </span>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {currentClassInfo.name}
                      </h2>
                    </div>
                    <div className="text-xs text-[#8E8E93] mt-1 font-mono-code">
                      {currentClassInfo.namespaceName
                        ? `${currentClassInfo.namespaceName}.${currentClassInfo.name}`
                        : currentClassInfo.name}{' '}
                      · {currentClassInfo.assemblyName}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onCopyText(
                        currentClassInfo.namespaceName
                          ? `${currentClassInfo.namespaceName}.${currentClassInfo.name}`
                          : currentClassInfo.name,
                        'Class Full Name'
                      )
                    }
                    className="p-2 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#28282A] border border-[#353535]"
                    title="Copy full class name"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Class Metadata Badges */}
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-[#8E8E93]">
                  {currentClassInfo.parentType?.name && (
                    <div className="px-2.5 py-1 rounded bg-[#28282A] border border-[#353535] font-mono-code text-[11px]">
                      Base: <span className="text-[#E2E2E4]">{currentClassInfo.parentType.name}</span>
                    </div>
                  )}
                  {currentClassInfo.sizes && (
                    <div className="px-2.5 py-1 rounded bg-[#28282A] border border-[#353535] font-mono-code text-[11px]">
                      Size: <span className="text-[#E2E2E4]">0x{currentClassInfo.sizes.instanceSize.toString(16)}</span>
                    </div>
                  )}
                  <div className="px-2.5 py-1 rounded bg-[#28282A] border border-[#353535] font-mono-code text-[11px]">
                    Token: <span className="text-[#E2E2E4]">0x{currentClassInfo.token.toString(16)}</span>
                  </div>
                </div>
              </div>

              {/* Segmented Tabs: Fields vs Methods */}
              <div className="flex border-b border-[#353535] bg-[#1E1E20] sticky top-0 z-10">
                <button
                  onClick={() => setClassTab(ClassTab.METHODS)}
                  className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    classTab === ClassTab.METHODS
                      ? 'border-indigo-500 text-white bg-[#242426]'
                      : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>METHODS ({currentMethods.length})</span>
                </button>
                <button
                  onClick={() => setClassTab(ClassTab.FIELDS)}
                  className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                    classTab === ClassTab.FIELDS
                      ? 'border-indigo-500 text-white bg-[#242426]'
                      : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>FIELDS ({currentFields.length})</span>
                </button>
              </div>

              {/* Tab Content: Methods List */}
              {classTab === ClassTab.METHODS && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
                  {currentMethods.length === 0 ? (
                    <div className="p-8 col-span-full text-center text-xs sm:text-sm text-[#8E8E93]">
                      This class declares no methods.
                    </div>
                  ) : (
                    currentMethods
                      .filter((m) => filterMatch(m.name) || filterMatch(m.signature))
                      .map((method) => (
                        <div
                          key={method.index}
                          className="p-4 bg-[#1E1E20] border border-[#353535] rounded-xl hover:bg-[#2A2A2D] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-xs sm:text-sm text-white font-mono-code tracking-tight">
                              {method.signature || method.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono-code">
                              {method.rva && (
                                <button
                                  onClick={() =>
                                    onCopyText(
                                      `0x${method.rva!.toString(16).toUpperCase()}`,
                                      'RVA'
                                    )
                                  }
                                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1C1C1E] hover:bg-[#353535] text-indigo-300 border border-[#353535] transition-colors"
                                  title="Copy RVA"
                                >
                                  <span>RVA: 0x{method.rva.toString(16).toUpperCase()}</span>
                                  <Copy className="w-3 h-3 text-[#8E8E93]" />
                                </button>
                              )}
                              {method.address && (
                                <button
                                  onClick={() =>
                                    onCopyText(
                                      `0x${method.address!.toString(16).toUpperCase()}`,
                                      'VA'
                                    )
                                  }
                                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1C1C1E] hover:bg-[#353535] text-sky-300 border border-[#353535] transition-colors"
                                  title="Copy VA"
                                >
                                  <span>VA: 0x{method.address.toString(16).toUpperCase()}</span>
                                  <Copy className="w-3 h-3 text-[#8E8E93]" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick Method Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                onInspectMethod(currentClassInfo.index, method.index, 'graph')
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-colors"
                              title="Trace Call Graph"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Call Graph</span>
                            </button>

                            <button
                              onClick={() =>
                                onInspectMethod(
                                  currentClassInfo.index,
                                  method.index,
                                  'instructions'
                                )
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#323235] hover:bg-[#3E3E42] text-[#E2E2E4] border border-[#454549] text-xs font-medium transition-colors"
                              title="Disassemble Instructions"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Disasm</span>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* Tab Content: Fields List */}
              {classTab === ClassTab.FIELDS && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
                  {currentFields.length === 0 ? (
                    <div className="p-8 col-span-full text-center text-xs sm:text-sm text-[#8E8E93]">
                      This class declares no fields.
                    </div>
                  ) : (
                    currentFields
                      .filter((f) => filterMatch(f.name) || filterMatch(f.typeName))
                      .map((field) => (
                        <div
                          key={field.index}
                          className="p-4 bg-[#1E1E20] border border-[#353535] rounded-xl hover:bg-[#2A2A2D] transition-colors flex items-center justify-between gap-3 group shadow-sm"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-mono-code text-xs sm:text-sm">
                              {field.isStatic && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  STATIC
                                </span>
                              )}
                              <span className="font-semibold text-white">{field.name}</span>
                            </div>
                            <div className="text-xs text-[#8E8E93] font-mono-code mt-0.5">
                              {field.typeName || 'object'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {field.offset !== undefined && (
                              <button
                                onClick={() =>
                                  onCopyText(
                                    `0x${field.offset!.toString(16)}`,
                                    'Field Offset'
                                  )
                                }
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1C1C1E] hover:bg-[#353535] text-emerald-300 font-mono-code text-xs border border-[#353535] transition-colors"
                                title="Copy offset"
                              >
                                <span>Offset: 0x{field.offset.toString(16)}</span>
                                <Copy className="w-3 h-3 text-[#8E8E93]" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};
