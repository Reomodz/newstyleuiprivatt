import React, { useState, useMemo } from 'react';
import { il2cppEngine } from '../services/il2cppEngine';
import {
  FileCode2,
  Copy,
  Download,
  X,
  Filter,
  Check,
} from 'lucide-react';

interface DumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyText: (text: string, label: string) => void;
}

export const DumpModal: React.FC<DumpModalProps> = ({
  isOpen,
  onClose,
  onCopyText,
}) => {
  const [selectedAssembly, setSelectedAssembly] = useState<number | 'ALL'>('ALL');
  const [copied, setCopied] = useState(false);

  const assemblies = useMemo(() => il2cppEngine.getAssemblies(), []);
  const dumpText = useMemo(() => {
    return il2cppEngine.generateDumpCs(
      selectedAssembly === 'ALL' ? undefined : selectedAssembly
    );
  }, [selectedAssembly]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const blob = new Blob([dumpText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dump.cs';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    onCopyText(dumpText, 'C# Dump (dump.cs)');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#1C1C1E] border border-[#353535] rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden text-[#E2E2E4]">
        {/* Header */}
        <div className="p-4 border-b border-[#353535] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Metadata Dump</h3>
              <p className="text-xs text-[#8E8E93]">
                Standard Il2CppDumper-compatible C# header declarations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#28282A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 bg-[#242426] border-b border-[#353535] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Assembly filter */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#8E8E93]" />
            <span className="text-[#8E8E93]">Filter Assembly:</span>
            <select
              value={selectedAssembly}
              onChange={(e) =>
                setSelectedAssembly(
                  e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                )
              }
              className="bg-[#18181A] border border-[#3A3A3C] text-[#E2E2E4] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 font-mono-code"
            >
              <option value="ALL">All Assemblies ({assemblies.length})</option>
              {assemblies.map((a) => (
                <option key={a.index} value={a.index}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E2E32] hover:bg-[#3A3A3E] text-xs font-medium text-white border border-[#444448] transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download dump.cs</span>
            </button>
          </div>
        </div>

        {/* Code Preview */}
        <div className="flex-1 overflow-auto p-4 bg-[#141416] font-mono-code text-xs text-[#E2E2E4] leading-relaxed">
          <pre className="whitespace-pre">{dumpText}</pre>
        </div>
      </div>
    </div>
  );
};
