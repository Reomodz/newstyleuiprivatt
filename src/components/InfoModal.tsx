import React from 'react';
import { ManagerInfoDestination } from '../types';
import { X, Info, Award, FileText } from 'lucide-react';

interface InfoModalProps {
  destination: ManagerInfoDestination | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ destination, onClose }) => {
  if (!destination) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#1C1C1E] border border-[#353535] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-[#E2E2E4]">
        {/* Header */}
        <div className="p-4 border-b border-[#353535] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {destination === 'about' && (
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
            )}
            {destination === 'credits' && (
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            )}
            {destination === 'licenses' && (
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            )}
            <h3 className="text-base font-bold text-white capitalize">
              {destination}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#28282A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-sm space-y-4 leading-relaxed text-[#C7C7CC]">
          {destination === 'about' && (
            <>
              <p className="text-white font-medium">
                IL2CppManager is a high-performance reverse engineering workbench for inspecting Unity IL2CPP runtime metadata, parsing binary instructions, and generating recursive method call graphs.
              </p>
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-indigo-400">
                  Key Capabilities
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#A1A1A6]">
                  <li>
                    <strong className="text-white">Hierarchical Browser:</strong> Browse Assemblies, Namespaces, Classes, TypeDef sizes, Fields with memory offsets, and Methods with RVAs/VAs.
                  </li>
                  <li>
                    <strong className="text-white">ARM64 Machine Code Disassembler:</strong> Analyze native opcodes, operands, and control flow branches.
                  </li>
                  <li>
                    <strong className="text-white">Interactive Call Graph:</strong> Pan, zoom, and expand callers and callees interactively with Bezier connectors.
                  </li>
                  <li>
                    <strong className="text-white">Metadata Dump Generator:</strong> Export standard Il2CppDumper-compatible <code className="text-indigo-300">dump.cs</code> headers.
                  </li>
                </ul>
              </div>
            </>
          )}

          {destination === 'credits' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#242427] rounded-xl border border-[#353535]">
                <h4 className="font-bold text-white text-sm">Capstone Disassembly Engine</h4>
                <p className="text-xs text-[#8E8E93] mt-1">
                  The ultimate disassembly framework for ARM, ARM64, x86, and MIPS binary architectures.
                </p>
              </div>

              <div className="p-3 bg-[#242427] rounded-xl border border-[#353535]">
                <h4 className="font-bold text-white text-sm">libsu & Root IPC Framework</h4>
                <p className="text-xs text-[#8E8E93] mt-1">
                  Root-privileged process memory scanning and runtime bridge communication.
                </p>
              </div>

              <div className="p-3 bg-[#242427] rounded-xl border border-[#353535]">
                <h4 className="font-bold text-white text-sm">Reomodz Community</h4>
                <p className="text-xs text-[#8E8E93] mt-1">
                  Original author and maintainer of IL2CppManager Android toolchain.
                </p>
              </div>
            </div>
          )}

          {destination === 'licenses' && (
            <div className="space-y-4 font-mono-code text-xs text-[#A1A1A6]">
              <div className="p-3 bg-[#18181A] rounded-xl border border-[#353535]">
                <p className="text-white font-bold mb-1">IL2CppManager License</p>
                <p>Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License.</p>
              </div>

              <div className="p-3 bg-[#18181A] rounded-xl border border-[#353535]">
                <p className="text-white font-bold mb-1">Capstone Engine License (BSD-3-Clause)</p>
                <p>Copyright (c) 2013-2024, Nguyen Anh Quynh & Capstone contributors. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
