import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  RefreshCw,
  Upload,
  Play,
  ChevronDown,
  Terminal,
  FileCode,
  FileText,
  CheckCircle2,
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

  const hasDumpCs = Boolean(storageMeta.dumpCsFileName);
  const hasIl2cppH = Boolean(storageMeta.il2cppHFileName);

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full gap-3 sm:gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={dumpCsInputRef}
        onChange={handleCsFileChange}
        accept=".cs,.txt"
        className="hidden"
      />
      <input
        type="file"
        ref={il2cppHInputRef}
        onChange={handleHFileChange}
        accept=".h,.hpp,.txt"
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

        {/* Profile Target Offset Extraction Trigger */}
        <div className="bg-[#1E1E20] border border-[#2D2D30] rounded-lg sm:rounded-2xl p-1.5 sm:p-3 pl-3 sm:pl-5 shadow-lg flex items-center justify-between gap-1.5 sm:gap-3 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[2.5px] sm:w-[3px] bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />

          {/* Profile Picker */}
          <div className="relative flex-1 min-w-0">
            <select
              value={activeProfileId}
              onChange={(e) => setActiveProfileId(e.target.value)}
              className="w-full pl-2 sm:pl-3 pr-6 sm:pr-8 py-1 sm:py-2 bg-[#141416] hover:bg-[#18181B] border border-[#353538] focus:border-indigo-500 rounded-md sm:rounded-xl text-[9px] sm:text-xs font-bold text-[#E2E2E4] focus:outline-none appearance-none cursor-pointer truncate transition-colors"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1E1E20] text-[#E2E2E4]">
                  {p.name} ({p.items.length} targets)
                </option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#8E8E93] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Scan Action Button */}
          <button
            onClick={handleScanProfile}
            disabled={isScanning || !activeProfile || activeProfile.items.length === 0}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1 sm:py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md sm:rounded-xl font-bold text-[9px] sm:text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-98 shrink-0"
          >
            <Play className={`w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Resolving...' : 'Resolve Offsets'}</span>
          </button>
        </div>
      </div>

      {/* Storage Offset Resolution & Execution Log Card */}
      {cardViewSettings.showScanLogCard && (
        <div className="bg-[#151517] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col gap-2 w-full min-h-[180px] max-h-[340px]">
          <div className="flex items-center justify-between pb-2 border-b border-[#28282B]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-[#E2E2E4]">
                Storage Dump Resolution Log
              </span>
            </div>
            {isScanning && (
              <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-amber-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Resolving from dump...
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[9px] sm:text-[11px] space-y-1.5 p-2 sm:p-3 bg-[#0E0E10] rounded-lg sm:rounded-xl border border-[#222225] select-text">
            {scanLogs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#55555A] shrink-0">{log.time}</span>
                <span
                  className={
                    log.type === 'success'
                      ? 'text-emerald-400 font-medium'
                      : log.type === 'warn'
                      ? 'text-amber-400 font-medium'
                      : log.type === 'error'
                      ? 'text-red-400 font-medium'
                      : 'text-[#A0A0A5]'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
