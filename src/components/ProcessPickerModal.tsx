import React, { useState } from 'react';
import { ProcessDescriptor } from '../types';
import { il2cppEngine } from '../services/il2cppEngine';
import {
  Activity,
  Search,
  X,
  Gamepad2,
} from 'lucide-react';

interface ProcessPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProcess: (process: ProcessDescriptor) => void;
  currentProcess: ProcessDescriptor | null;
}

export const ProcessPickerModal: React.FC<ProcessPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectProcess,
  currentProcess,
}) => {
  const [search, setSearch] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPackage, setCustomPackage] = useState('');
  const [customPid, setCustomPid] = useState('');

  if (!isOpen) return null;

  const processes = il2cppEngine.getProcesses();
  const filtered = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.appName.toLowerCase().includes(search.toLowerCase()) ||
      p.pid.toString().includes(search)
  );

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPackage.trim()) return;
    const pid = parseInt(customPid, 10) || Math.floor(10000 + Math.random() * 80000);
    const proc = il2cppEngine.addCustomProcess(
      customPackage.trim(),
      customName.trim() || customPackage.trim(),
      pid
    );
    onSelectProcess(proc);
    setIsCustomMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1C1C1E] border border-[#353535] rounded-xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#E2E2E4]">
        {/* Modal Header */}
        <div className="p-2.5 sm:p-4 border-b border-[#353535] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-base font-bold text-white leading-tight">Target Process</h3>
              <p className="text-[9px] sm:text-xs text-[#8E8E93]">
                Attach to Unity IL2CPP runtime process
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#28282A] transition-colors"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Search or Custom toggle */}
        <div className="p-2.5 sm:p-4 border-b border-[#353535] bg-[#222225] flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
              {isCustomMode ? 'Custom Process PID' : 'Running Applications'}
            </span>
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-[10px] sm:text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              {isCustomMode ? 'Browse standard games' : '+ Enter custom PID'}
            </button>
          </div>

          {!isCustomMode ? (
            <div className="relative">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by app name, package, or PID..."
                className="w-full bg-[#18181A] border border-[#3A3A3C] focus:border-indigo-500 rounded-lg sm:rounded-xl pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#E2E2E4] placeholder-[#8E8E93] outline-none"
              />
            </div>
          ) : (
            <form onSubmit={handleAddCustom} className="flex flex-col gap-2 sm:gap-2.5">
              <input
                type="text"
                placeholder="Game Name (e.g., Cyber Arena)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#18181A] border border-[#3A3A3C] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs text-[#E2E2E4] outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Package Name (e.g., com.studio.game)"
                value={customPackage}
                onChange={(e) => setCustomPackage(e.target.value)}
                required
                className="w-full bg-[#18181A] border border-[#3A3A3C] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs text-[#E2E2E4] outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="PID (e.g. 32014)"
                  value={customPid}
                  onChange={(e) => setCustomPid(e.target.value)}
                  className="flex-1 bg-[#18181A] border border-[#3A3A3C] rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs text-[#E2E2E4] outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow transition-colors"
                >
                  Attach Custom
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Process List */}
        {!isCustomMode && (
          <div className="flex-1 overflow-y-auto divide-y divide-[#2C2C2F]">
            {filtered.map((proc) => {
              const isSelected = currentProcess?.pid === proc.pid;
              return (
                <div
                  key={proc.pid}
                  onClick={() => {
                    onSelectProcess(proc);
                    onClose();
                  }}
                  className={`p-2.5 sm:p-3.5 flex items-center justify-between hover:bg-[#28282B] cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-950/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                          : 'bg-[#28282A] text-[#8E8E93]'
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-white truncate">
                          {proc.appName}
                        </span>
                        {isSelected && (
                          <span className="px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                            ATTACHED
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] sm:text-xs text-[#8E8E93] font-mono truncate">
                        {proc.name} · PID {proc.pid}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div className="text-[9px] sm:text-[11px] font-mono text-indigo-400">
                      {proc.unityVersion}
                    </div>
                    <div className="text-[8px] sm:text-[10px] text-[#8E8E93]">{proc.arch}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
