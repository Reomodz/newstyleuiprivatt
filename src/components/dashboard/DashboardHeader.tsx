import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  RefreshCw,
  Upload,
  ChevronDown,
  Terminal,
  FileCode,
  FileText,
  CheckCircle2,
  Maximize2,
  X,
  Layers,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import {
  WatchlistProfile,
  TargetCardViewSettings,
  StorageDumpMeta,
  DumpParseProgress,
} from '../../types';

interface DashboardHeaderProps {
  cardViewSettings: TargetCardViewSettings;
  loadedStorageFileName?: string | null;
  loadedHeaderFileName?: string | null;
  parsedSummary: { classes: number; methods: number; fields: number; typeInfos?: number } | null;
  storageMeta: StorageDumpMeta;
  onDumpCsUploaded: (file: File) => void;
  onIl2cppHUploaded: (file: File) => void;
  onNavigateToBrowser?: (classIndex?: number) => void;
  isParsingDump: boolean;
  parseProgress?: DumpParseProgress | null;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  profiles: WatchlistProfile[];
  handleScanProfile: () => void;
  isScanning: boolean;
  activeProfile: WatchlistProfile | undefined;
  scanLogs: Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error'; time: string }>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  cardViewSettings,
  parsedSummary,
  storageMeta,
  onDumpCsUploaded,
  onIl2cppHUploaded,
  isParsingDump,
  parseProgress,
  activeProfileId,
  setActiveProfileId,
  profiles,
  handleScanProfile,
  isScanning,
  activeProfile,
  scanLogs,
}) => {
  const dumpCsInputRef = useRef<HTMLInputElement>(null);
  const il2cppHInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingCs, setIsDraggingCs] = useState(false);
  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const handleCsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDumpCsUploaded(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleHFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onIl2cppHUploaded(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleCsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCs(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onDumpCsUploaded(file);
    }
  };

  const handleHDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingH(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onIl2cppHUploaded(file);
    }
  };

  const handleCopyLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scanLogs.length) return;
    const logContent = scanLogs.map((l) => `[${l.time}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(logContent);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const hasDumpCs = Boolean(storageMeta.dumpCsFileName);
  const hasIl2cppH = Boolean(storageMeta.il2cppHFileName);
  const targetCount = activeProfile?.items.length || 0;

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full gap-3 sm:gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={dumpCsInputRef}
        onChange={handleCsFileChange}
        accept=".cs,.txt,text/plain,text/x-csharp,text/csharp,application/octet-stream,*/*"
        className="hidden"
      />
      <input
        type="file"
        ref={il2cppHInputRef}
        onChange={handleHFileChange}
        accept=".h,.hpp,.txt,text/plain,text/x-chdr,application/octet-stream,*/*"
        className="hidden"
      />

      {/* Storage Dump Hub Header */}
      <div className="flex flex-col gap-2 sm:gap-3 w-full">
        {/* Top Info Banner */}
        <div className="bg-[#18181A] border border-[#2D2D30] rounded-lg sm:rounded-2xl p-2 sm:p-3.5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 pt-0.5 sm:pt-1">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <FolderOpen className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h2 className="text-[11px] sm:text-sm md:text-base font-bold text-white tracking-tight">
                    Storage Dump Workspace
                  </h2>
                  <span className="px-1.5 sm:px-2 py-0.2 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[8px] sm:text-[10px] font-mono font-semibold">
                    ARM64 / IL2CPP
                  </span>
                </div>
                <p className="text-[9px] sm:text-xs text-[#8E8E93] truncate">
                  Select <code className="text-sky-300 bg-[#252528] px-1 py-0.2 rounded text-[8.5px] sm:text-[11px]">dump.cs</code> and <code className="text-purple-300 bg-[#252528] px-1 py-0.2 rounded text-[8.5px] sm:text-[11px]">il2cpp.h</code> to parse classes & offsets offline.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mt-2 pt-2 border-t border-[#262629]">
            <div className="bg-[#121214] p-1 sm:p-2 rounded-md sm:rounded-lg border border-[#222225] flex flex-col">
              <span className="text-[8px] sm:text-[10px] text-[#8E8E93]">Parsed Classes</span>
              <span className="text-[11px] sm:text-sm md:text-base font-bold text-sky-300 font-mono">
                {storageMeta.totalClasses || parsedSummary?.classes || 0}
              </span>
            </div>
            <div className="bg-[#121214] p-1 sm:p-2 rounded-md sm:rounded-lg border border-[#222225] flex flex-col">
              <span className="text-[8px] sm:text-[10px] text-[#8E8E93]">Methods & RVAs</span>
              <span className="text-[11px] sm:text-sm md:text-base font-bold text-purple-300 font-mono">
                {storageMeta.totalMethods || parsedSummary?.methods || 0}
              </span>
            </div>
            <div className="bg-[#121214] p-1 sm:p-2 rounded-md sm:rounded-lg border border-[#222225] flex flex-col">
              <span className="text-[8px] sm:text-[10px] text-[#8E8E93]">Fields & Offsets</span>
              <span className="text-[11px] sm:text-sm md:text-base font-bold text-amber-300 font-mono">
                {storageMeta.totalFields || parsedSummary?.fields || 0}
              </span>
            </div>
            <div className="bg-[#121214] p-1 sm:p-2 rounded-md sm:rounded-lg border border-[#222225] flex flex-col">
              <span className="text-[8px] sm:text-[10px] text-[#8E8E93]">TypeInfo Pointers</span>
              <span className="text-[11px] sm:text-sm md:text-base font-bold text-emerald-300 font-mono">
                {storageMeta.totalTypeInfos || parsedSummary?.typeInfos || 0}
              </span>
            </div>
          </div>

          {/* Live Chunked Streaming Parser Progress Bar (Optimized for 75MB+ Dumps) */}
          {isParsingDump && parseProgress && (
            <div className="mt-2 p-2 sm:p-3 bg-[#121215] border border-indigo-500/40 rounded-lg sm:rounded-xl flex flex-col gap-1.5 sm:gap-2 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                  <span className="font-semibold text-[10px] sm:text-xs text-white truncate">
                    {parseProgress.stage || `Streaming & Parsing ${parseProgress.fileName}...`}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8.5px] sm:text-[10px] text-indigo-300 font-mono bg-indigo-500/15 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                    {parseProgress.percent}% ({parseProgress.fileSizeMb} MB)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 sm:h-1.5 bg-[#222226] rounded-full overflow-hidden border border-[#333338]">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-150 rounded-full"
                  style={{ width: `${Math.max(4, parseProgress.percent)}%` }}
                />
              </div>

              {/* Live counts during streaming */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-[8.5px] sm:text-[10px] font-mono text-[#8E8E93] pt-0.5">
                <span>Classes: <strong className="text-sky-300">{parseProgress.classesCount.toLocaleString()}</strong></span>
                <span>Methods: <strong className="text-purple-300">{parseProgress.methodsCount.toLocaleString()}</strong></span>
                <span>Fields: <strong className="text-amber-300">{parseProgress.fieldsCount.toLocaleString()}</strong></span>
                {parseProgress.typeInfosCount !== undefined && (
                  <span>TypeInfos: <strong className="text-emerald-300">{parseProgress.typeInfosCount.toLocaleString()}</strong></span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dual Dump Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3.5">
          {/* Card 1: dump.cs Selector */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingCs(true);
            }}
            onDragLeave={() => setIsDraggingCs(false)}
            onDrop={handleCsDrop}
            className={`bg-[#1E1E20] border rounded-lg sm:rounded-2xl p-2 sm:p-3.5 flex flex-col justify-between gap-1.5 sm:gap-2.5 transition-all ${
              isDraggingCs
                ? 'border-sky-400 bg-sky-500/10'
                : hasDumpCs
                ? 'border-[#333336] hover:border-[#444448]'
                : 'border-dashed border-[#444448]'
            }`}
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <FileCode className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[11px] sm:text-sm text-white truncate">
                      {storageMeta.dumpCsFileName || 'dump.cs'}
                    </span>
                    {hasDumpCs && (
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[8.5px] sm:text-[10px] text-[#8E8E93]">
                    C# Class & Method Definitions
                  </span>
                </div>
              </div>

              <button
                onClick={() => dumpCsInputRef.current?.click()}
                disabled={isParsingDump}
                className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-[#28282B] hover:bg-[#343438] text-sky-300 border border-[#3E3E42] rounded-md sm:rounded-lg text-[9px] sm:text-xs font-semibold transition-colors shrink-0"
              >
                {isParsingDump ? (
                  <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                ) : (
                  <Upload className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
                <span>{hasDumpCs ? 'Change' : 'Select dump.cs'}</span>
              </button>
            </div>

            <div className="bg-[#141416] p-1.5 sm:p-2.5 rounded-md sm:rounded-lg border border-[#262629] text-[9.5px] sm:text-[11px] font-mono text-[#A0A0A5] flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[8.5px] sm:text-[10px]">
                <span className="text-[#6C6C70]">Status</span>
                <span className={hasDumpCs ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {hasDumpCs ? 'Active in Memory' : 'No file selected'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: il2cpp.h Selector */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingH(true);
            }}
            onDragLeave={() => setIsDraggingH(false)}
            onDrop={handleHDrop}
            className={`bg-[#1E1E20] border rounded-lg sm:rounded-2xl p-2 sm:p-3.5 flex flex-col justify-between gap-1.5 sm:gap-2.5 transition-all ${
              isDraggingH
                ? 'border-purple-400 bg-purple-500/10'
                : hasIl2cppH
                ? 'border-[#333336] hover:border-[#444448]'
                : 'border-dashed border-[#444448]'
            }`}
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[11px] sm:text-sm text-white truncate">
                      {storageMeta.il2cppHFileName || 'il2cpp.h'}
                    </span>
                    {hasIl2cppH && (
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[8.5px] sm:text-[10px] text-[#8E8E93]">
                    TypeInfo Pointers & RVAs
                  </span>
                </div>
              </div>

              <button
                onClick={() => il2cppHInputRef.current?.click()}
                disabled={isParsingDump}
                className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-[#28282B] hover:bg-[#343438] text-purple-300 border border-[#3E3E42] rounded-md sm:rounded-lg text-[9px] sm:text-xs font-semibold transition-colors shrink-0"
              >
                {isParsingDump ? (
                  <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                ) : (
                  <Upload className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
                <span>{hasIl2cppH ? 'Change' : 'Select il2cpp.h'}</span>
              </button>
            </div>

            <div className="bg-[#141416] p-1.5 sm:p-2.5 rounded-md sm:rounded-lg border border-[#262629] text-[9.5px] sm:text-[11px] font-mono text-[#A0A0A5] flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[8.5px] sm:text-[10px]">
                <span className="text-[#6C6C70]">Base Address</span>
                <span className="text-purple-300 font-semibold">
                  {storageMeta.baseAddressHex || '0x78F1E0B000'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[8.5px] sm:text-[10px]">
                <span className="text-[#6C6C70]">Static Fields Offset</span>
                <span className="text-amber-300 font-semibold">
                  {storageMeta.staticFieldsOffsetHex || '0xB8'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REDESIGNED: Profile Target Select & Resolve Offsets Trigger Card */}
        {cardViewSettings.showStorageProfileSelect !== false && (
          <div className="bg-[#18181B] border border-[#2D2D32] hover:border-[#383840] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-xl transition-all relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 via-purple-500 to-sky-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />

            {/* Profile Select Section */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pl-1">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-indigo-400/90">
                    Target Profile
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-[8.5px] sm:text-[9.5px] font-semibold">
                    {targetCount} {targetCount === 1 ? 'target' : 'targets'}
                  </span>
                </div>

                <div className="relative w-full">
                  <select
                    value={activeProfileId}
                    onChange={(e) => setActiveProfileId(e.target.value)}
                    className="w-full pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 sm:py-2 bg-[#101012] hover:bg-[#151518] border border-[#323238] focus:border-indigo-500 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-[#E2E2E4] focus:outline-none appearance-none cursor-pointer truncate transition-colors shadow-inner"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#18181B] text-[#E2E2E4]">
                        {p.name} ({p.items.length} {p.items.length === 1 ? 'target' : 'targets'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8E8E93] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Resolve Offsets Action Button */}
            <button
              onClick={handleScanProfile}
              disabled={isScanning || !activeProfile || targetCount === 0}
              className={`flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-xs shadow-lg transition-all active:scale-[0.98] shrink-0 w-full sm:w-auto ${
                isScanning
                  ? 'bg-amber-600/90 text-white cursor-wait animate-pulse'
                  : !activeProfile || targetCount === 0
                  ? 'bg-[#25252A] text-[#707075] border border-[#303035] cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/40 border border-indigo-400/30'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-200" />
                  <span>Resolving Offsets...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Resolve Offsets</span>
                  {targetCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-white font-mono text-[9px] sm:text-[10px]">
                      {targetCount}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Storage Offset Resolution & Execution Log Card */}
      {cardViewSettings.showScanLogCard && (
        <>
          <div
            onClick={() => setIsLogModalOpen(true)}
            className="bg-[#121214] border border-[#28282D] hover:border-[#3E3E45] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-xl flex flex-col gap-2 w-full min-h-[150px] max-h-[260px] sm:max-h-[320px] md:max-h-[380px] cursor-pointer group transition-all"
            title="Click to expand resolution log in screen center"
          >
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-[#242428]">
              <div className="flex items-center gap-2 min-w-0">
                {/* OS Traffic Light Dots */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0 pl-1">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-semibold text-[#E2E2E4] truncate">
                    Storage Dump Resolution Log
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#202025] text-[#8E8E93] text-[8.5px] sm:text-[9.5px] font-mono border border-[#2E2E35]">
                    {scanLogs.length} {scanLogs.length === 1 ? 'log' : 'logs'}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isScanning ? (
                  <span className="flex items-center gap-1 text-[8.5px] sm:text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Resolving...
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[8.5px] sm:text-[9.5px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ready
                  </span>
                )}

                {/* Copy Logs Button */}
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 px-1.5 py-1 text-[#8E8E93] group-hover:text-[#E2E2E4] bg-[#1E1E22] hover:bg-[#28282E] rounded-md border border-[#323238] transition-colors text-[9px] sm:text-[10px]"
                  title="Copy resolution logs"
                >
                  {copiedLogs ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-[#A0A0A5]" />
                  )}
                  <span className="hidden md:inline">{copiedLogs ? 'Copied' : 'Copy'}</span>
                </button>

                {/* Maximize Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLogModalOpen(true);
                  }}
                  className="p-1 text-[#8E8E93] group-hover:text-white bg-[#1E1E22] hover:bg-[#28282E] rounded-md border border-[#323238] transition-colors"
                  title="Open log in center of screen"
                >
                  <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal Console View */}
            <div className="flex-1 overflow-y-auto font-mono text-[9px] sm:text-[10.5px] md:text-[11px] space-y-1.5 p-2 sm:p-3 bg-[#0A0A0C] rounded-lg sm:rounded-xl border border-[#202025] select-text shadow-inner">
              {scanLogs.length === 0 ? (
                <div className="py-6 text-center text-[#606065] text-[9.5px] sm:text-xs italic">
                  No resolution logs yet. Click &apos;Resolve Offsets&apos; above to parse target profile.
                </div>
              ) : (
                scanLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-1.5 sm:gap-2 leading-tight sm:leading-relaxed">
                    <span className="text-[#55555A] shrink-0 text-[8.5px] sm:text-[9.5px]">{log.time}</span>
                    <span
                      className={`break-all sm:break-words ${
                        log.type === 'success'
                          ? 'text-emerald-400 font-medium'
                          : log.type === 'warn'
                          ? 'text-amber-400 font-medium'
                          : log.type === 'error'
                          ? 'text-rose-400 font-medium'
                          : 'text-[#B0B0B8]'
                      }`}
                    >
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Centered Resolution Log Modal Popup (Optimized for Small Mobile & High-Res Displays) */}
          {isLogModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-2.5 sm:p-6 flex items-center justify-center animate-in fade-in duration-200">
              <div className="bg-[#141416] border border-[#333338] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 max-w-3xl w-full shadow-2xl flex flex-col gap-3 my-auto max-h-[88vh] sm:max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#26262B]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-xs sm:text-sm md:text-base font-bold text-[#E2E2E4] truncate">
                        Storage Dump Resolution Log
                      </h3>
                      <span className="text-[9px] sm:text-[10.5px] text-[#8E8E93]">
                        {scanLogs.length} total entries parsed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyLogs}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#202024] hover:bg-[#2C2C32] text-[#E2E2E4] rounded-xl border border-[#353538] transition-colors text-xs font-semibold"
                    >
                      {copiedLogs ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#A0A0A5]" />
                          <span>Copy Logs</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsLogModalOpen(false)}
                      className="p-1.5 bg-[#202024] hover:bg-[#2C2C32] text-[#8E8E93] hover:text-white rounded-xl border border-[#353538] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stream Console */}
                <div className="flex-1 overflow-y-auto font-mono text-xs sm:text-sm space-y-2 p-3 sm:p-4 bg-[#0A0A0C] rounded-xl border border-[#202025] select-text max-h-[60vh] shadow-inner">
                  {scanLogs.length === 0 ? (
                    <div className="py-12 text-center text-[#606065] italic">
                      No logs to display yet.
                    </div>
                  ) : (
                    scanLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-[#55555A] shrink-0 text-xs">{log.time}</span>
                        <span
                          className={`break-words ${
                            log.type === 'success'
                              ? 'text-emerald-400 font-medium'
                              : log.type === 'warn'
                              ? 'text-amber-400 font-medium'
                              : log.type === 'error'
                              ? 'text-rose-400 font-medium'
                              : 'text-[#B0B0B8]'
                          }`}
                        >
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-2 border-t border-[#26262B]">
                  <span className="text-[10px] sm:text-xs text-[#707075] font-mono">
                    Status: {isScanning ? 'Resolving...' : 'Idle'}
                  </span>
                  <button
                    onClick={() => setIsLogModalOpen(false)}
                    className="px-4 py-2 bg-[#222226] hover:bg-[#2E2E34] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors border border-[#333338]"
                  >
                    Close Log
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
