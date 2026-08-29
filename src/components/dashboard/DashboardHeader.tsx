import React from 'react';
import { Cpu, FolderOpen, RefreshCw, Upload, Play, ChevronDown, Terminal } from 'lucide-react';
import { ProcessDescriptor, TargetSourceMode, WatchlistProfile, TargetCardViewSettings } from '../../types';

interface DashboardHeaderProps {
  sourceMode: TargetSourceMode;
  setSourceMode: (mode: TargetSourceMode) => void;
  cardViewSettings: TargetCardViewSettings;
  currentProcess: ProcessDescriptor | null;
  onOpenProcessPicker: () => void;
  loadedStorageFileName: string | null;
  parsedSummary: { classes: number; methods: number; fields: number } | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleDumpFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isParsingDump: boolean;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  profiles: WatchlistProfile[];
  handleScanProfile: () => void;
  isScanning: boolean;
  activeProfile: WatchlistProfile | undefined;
  scanLogs: Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error'; time: string }>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  sourceMode,
  setSourceMode,
  cardViewSettings,
  currentProcess,
  onOpenProcessPicker,
  loadedStorageFileName,
  parsedSummary,
  fileInputRef,
  handleDumpFileUpload,
  isParsingDump,
  activeProfileId,
  setActiveProfileId,
  profiles,
  handleScanProfile,
  isScanning,
  activeProfile,
  scanLogs,
}) => {
  return (
    <div className="flex flex-col max-w-3xl mx-auto w-full gap-3 sm:gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Target Setup Controls */}
      <div className="flex flex-col gap-2.5 sm:gap-4 w-full">
        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#141416] p-1 sm:p-1.5 rounded-lg sm:rounded-2xl border border-[#353538] shrink-0 mb-0.5 sm:mb-2 shadow-lg">
          <button
            onClick={() => setSourceMode('live')}
            className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-md sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${
              sourceMode === 'live'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[#8E8E93] hover:text-[#E2E2E4]'
            }`}
          >
            <Cpu className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Live Scan</span>
          </button>

          <button
            onClick={() => setSourceMode('storage')}
            className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-md sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${
              sourceMode === 'storage'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-[#8E8E93] hover:text-[#E2E2E4]'
            }`}
          >
            <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Storage Dump</span>
          </button>
        </div>

        {/* Active Target Banner */}
        {cardViewSettings.showTargetBanner && (
          <div className="flex flex-col bg-[#1E1E20] border border-[#2D2D30] rounded-lg sm:rounded-2xl p-2 sm:p-4 md:p-5 shadow-lg relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-0.5 sm:h-1 ${sourceMode === 'live' ? 'bg-indigo-500' : 'bg-sky-500'}`} />
            {sourceMode === 'live' ? (
              <div className="flex flex-col gap-1 sm:gap-2.5">
                {currentProcess ? (
                  <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-[11px] sm:text-sm font-semibold text-[#E2E2E4] truncate">
                          {currentProcess.appName}
                        </span>
                        <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                          PID {currentProcess.pid}
                        </span>
                      </div>
                      <div className="text-[8px] sm:text-xs text-[#8E8E93] truncate">
                        Arch: {currentProcess.arch || 'arm64-v8a'} · Unity: {currentProcess.unityVersion || '2022.3'} · Memory mapped
                      </div>
                    </div>

                    <button
                      onClick={onOpenProcessPicker}
                      className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-[#262629] hover:bg-[#323236] text-indigo-300 hover:text-white border border-[#3A3A3E] rounded-md sm:rounded-xl text-[9px] sm:text-xs font-semibold shrink-0 transition-colors shadow-sm"
                      title="Switch to another target process"
                    >
                      <RefreshCw className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                      <span>Change</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 sm:gap-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-[11px] sm:text-sm font-semibold text-[#E2E2E4]">
                          No Live Process Selected
                        </span>
                      </div>
                      <div className="text-[8px] sm:text-xs text-[#8E8E93]">
                        Attach to a running game to scan live memory addresses
                      </div>
                    </div>

                    <button
                      onClick={onOpenProcessPicker}
                      className="w-full px-2 sm:px-4 py-1 sm:py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-md sm:rounded-xl text-[10px] sm:text-sm font-medium transition-colors"
                    >
                      Select Process Target
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2.5 rounded-full bg-sky-400 shrink-0" />
                    <span className="text-[11px] sm:text-sm font-semibold text-[#E2E2E4] truncate">
                      {loadedStorageFileName ? loadedStorageFileName : 'Load dump.cs from Storage'}
                    </span>
                    {loadedStorageFileName && (
                      <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 shrink-0">
                        Loaded
                      </span>
                    )}
                  </div>
                  {parsedSummary ? (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-0.5">
                      <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                        {parsedSummary.classes} Classes
                      </span>
                      <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {parsedSummary.fields} Fields
                      </span>
                      <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {parsedSummary.methods} Methods
                      </span>
                    </div>
                  ) : (
                    <div className="text-[8px] sm:text-xs text-[#8E8E93] truncate">
                      Upload or pick a previously generated dump.cs file offline
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDumpFileUpload}
                  accept=".cs,.txt,.dat"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsingDump}
                  className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-[#262629] hover:bg-[#323236] text-sky-300 hover:text-white border border-[#3A3A3E] rounded-md sm:rounded-xl text-[9px] sm:text-xs font-semibold shrink-0 transition-colors shadow-sm"
                  title={loadedStorageFileName ? 'Upload or change dump.cs file' : 'Upload dump.cs file'}
                >
                  {loadedStorageFileName ? (
                    <RefreshCw className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${isParsingDump ? 'animate-spin' : ''}`} />
                  ) : (
                    <Upload className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${isParsingDump ? 'animate-spin' : ''}`} />
                  )}
                  <span>{isParsingDump ? 'Parsing...' : loadedStorageFileName ? 'Change' : 'Upload'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compact Scan Profile Box & Trigger */}
        <div className="bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 pl-4 sm:pl-6 shadow-lg flex items-center justify-between gap-1.5 sm:gap-3 relative overflow-hidden">
          {/* Left Blue Accent Line */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-400 via-sky-400 to-indigo-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />

          {/* Small Box with Profile Name & Target Count */}
          <div className="relative flex-1 min-w-0">
            <select
              value={activeProfileId}
              onChange={(e) => setActiveProfileId(e.target.value)}
              className="w-full pl-2.5 sm:pl-3.5 pr-7 sm:pr-8 py-1 sm:py-2.5 bg-[#141416] hover:bg-[#18181B] border border-[#353538] focus:border-indigo-500 rounded-md sm:rounded-xl text-[9px] sm:text-xs font-bold text-[#E2E2E4] focus:outline-none appearance-none cursor-pointer truncate transition-colors"
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
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md sm:rounded-xl font-bold text-[9px] sm:text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-98 shrink-0"
          >
            <Play className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Start Scan'}</span>
          </button>
        </div>
      </div>

      {/* Live Scan Output & Execution Log Card */}
      {cardViewSettings.showScanLogCard && (
        <div className="bg-[#151517] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col gap-2 w-full min-h-[180px] max-h-[340px]">
          <div className="flex items-center justify-between pb-2 border-b border-[#28282B]">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-[#E2E2E4]">Live Scan Log</span>
            </div>
            {isScanning && (
              <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-amber-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Scanning...
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
