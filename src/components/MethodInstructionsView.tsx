import React, { useState, useMemo } from 'react';
import {
  InstructionAddressMode,
  InstructionFlowKind,
  InstructionDescriptor,
} from '../types';
import { il2cppEngine } from '../services/il2cppEngine';
import {
  Copy,
  ArrowUpRight,
  Sparkles,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';

interface MethodInstructionsViewProps {
  classIndex: number;
  methodIndex: number;
  onOpenInCallGraph: (classIndex: number, methodIndex: number) => void;
  onNavigateToMethod: (classIndex: number, methodIndex: number) => void;
  onCopyText: (text: string, label: string) => void;
}

export const MethodInstructionsView: React.FC<MethodInstructionsViewProps> = ({
  classIndex,
  methodIndex,
  onOpenInCallGraph,
  onNavigateToMethod,
  onCopyText,
}) => {
  const [addressMode, setAddressMode] = useState<InstructionAddressMode>(
    InstructionAddressMode.RVA
  );
  const [selectedInstructionIdx, setSelectedInstructionIdx] = useState<number | null>(null);

  const method = useMemo(() => il2cppEngine.getMethod(classIndex, methodIndex), [classIndex, methodIndex]);
  const cls = useMemo(() => il2cppEngine.getClass(classIndex), [classIndex]);
  const instructions: InstructionDescriptor[] = useMemo(
    () => il2cppEngine.getInstructions(classIndex, methodIndex),
    [classIndex, methodIndex]
  );

  return (
    <div className="flex-1 flex flex-col bg-[#1C1C1E] text-[#E2E2E4] overflow-hidden select-none font-mono-code">
      {/* Header Info */}
      <div className="p-4 bg-[#242426] border-b border-[#353535] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
              DISASSEMBLY
            </span>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {method?.signature || method?.name || 'Method'}
            </h2>
          </div>
          <div className="text-xs text-[#8E8E93] mt-1 truncate">
            {cls?.namespaceName ? `${cls.namespaceName}.${cls.name}` : cls?.name} ·{' '}
            {cls?.assemblyName}
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Address Mode Toggle (RVA vs VA) */}
          <div className="flex items-center bg-[#18181A] p-0.5 rounded-lg border border-[#353535]">
            <button
              onClick={() => setAddressMode(InstructionAddressMode.RVA)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                addressMode === InstructionAddressMode.RVA
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              RVA
            </button>
            <button
              onClick={() => setAddressMode(InstructionAddressMode.VA)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                addressMode === InstructionAddressMode.VA
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              VA
            </button>
          </div>

          <button
            onClick={() => onOpenInCallGraph(classIndex, methodIndex)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Call Graph</span>
          </button>
        </div>
      </div>

      {/* Disassembly Table Header */}
      <div className="grid grid-cols-12 px-4 py-2 bg-[#18181A] border-b border-[#2D2D30] text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider shrink-0">
        <div className="col-span-3 sm:col-span-2">Address</div>
        <div className="col-span-3 sm:col-span-3 hidden sm:block">Bytes</div>
        <div className="col-span-9 sm:col-span-7">Instruction / Disassembly</div>
      </div>

      {/* Disassembly List Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2A2A2D]">
        {instructions.map((ins, idx) => {
          const addressLabel =
            addressMode === InstructionAddressMode.RVA
              ? `0x${(ins.rva ?? 0).toString(16).toUpperCase().padStart(8, '0')}`
              : `0x${ins.address.toString(16).toUpperCase()}`;

          const isSelected = selectedInstructionIdx === idx;
          const isTargetBranch = ins.flowKind === InstructionFlowKind.DIRECT_BRANCH;
          const isDirectCall = ins.flowKind === InstructionFlowKind.DIRECT_CALL;

          return (
            <div
              key={idx}
              onClick={() => setSelectedInstructionIdx(idx)}
              className={`grid grid-cols-12 px-4 py-2.5 text-xs items-center cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                  : 'hover:bg-[#252528]'
              }`}
            >
              {/* Address */}
              <div className="col-span-3 sm:col-span-2 text-indigo-400 font-semibold truncate">
                {addressLabel}
              </div>

              {/* Machine code bytes */}
              <div className="col-span-3 sm:col-span-3 hidden sm:block text-[#8E8E93] text-[11px] truncate">
                {ins.bytes}
              </div>

              {/* Mnemonic, Operands, Annotations */}
              <div className="col-span-9 sm:col-span-7 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`font-bold ${
                      ins.mnemonic.startsWith('b') || ins.mnemonic === 'ret'
                        ? 'text-amber-400'
                        : ins.mnemonic === 'bl'
                        ? 'text-emerald-400'
                        : 'text-[#E2E2E4]'
                    }`}
                  >
                    {ins.mnemonic}
                  </span>
                  <span className="text-[#C7C7CC]">{ins.operands}</span>

                  {/* Branch direction indicator */}
                  {isTargetBranch && ins.targetInstructionIndex !== undefined && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
                      {ins.targetInstructionIndex > idx ? (
                        <>
                          <ArrowDown className="w-3 h-3" /> Jump +
                          {ins.targetInstructionIndex - idx}
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-3 h-3" /> Jump -
                          {idx - ins.targetInstructionIndex}
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* Target Symbol Chip (if direct call) */}
                {isDirectCall && ins.target && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        ins.target?.classIndex !== undefined &&
                        ins.target?.methodIndex !== undefined
                      ) {
                        onNavigateToMethod(ins.target.classIndex, ins.target.methodIndex);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2D2D35] hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] transition-colors shrink-0"
                    title={`Go to ${ins.target.ownerName}::${ins.target.name}`}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    <span className="truncate max-w-[180px]">
                      CALL {ins.target.ownerName?.split('.').pop()}::{ins.target.name}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Instruction Sticky Footer */}
      {selectedInstructionIdx !== null && instructions[selectedInstructionIdx] && (
        <div className="p-3 bg-[#18181A] border-t border-[#353535] flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="truncate">
            <span className="text-[#8E8E93]">Selected: </span>
            <span className="text-indigo-300">
              {addressMode === InstructionAddressMode.RVA
                ? `0x${(instructions[selectedInstructionIdx].rva ?? 0).toString(16).toUpperCase()}`
                : `0x${instructions[selectedInstructionIdx].address.toString(16).toUpperCase()}`}{' '}
            </span>
            <span className="text-white font-bold">
              {instructions[selectedInstructionIdx].mnemonic}{' '}
            </span>
            <span className="text-[#C7C7CC]">
              {instructions[selectedInstructionIdx].operands}
            </span>
          </div>

          <button
            onClick={() => {
              const ins = instructions[selectedInstructionIdx];
              const text = `${
                addressMode === InstructionAddressMode.RVA
                  ? `0x${(ins.rva ?? 0).toString(16).toUpperCase()}`
                  : `0x${ins.address.toString(16).toUpperCase()}`
              }  ${ins.bytes}  ${ins.mnemonic} ${ins.operands}`;
              onCopyText(text, 'Instruction');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border border-[#3E3E42] transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
      )}
    </div>
  );
};
