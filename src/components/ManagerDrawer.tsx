import React from 'react';
import {
  Code,
  Send,
  Info,
  Award,
  FileText,
  X,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { ManagerInfoDestination } from '../types';

interface ManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInfo: (dest: ManagerInfoDestination) => void;
}

export const ManagerDrawer: React.FC<ManagerDrawerProps> = ({
  isOpen,
  onClose,
  onOpenInfo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xs bg-[#1C1C1E] border-l border-[#353535] h-full flex flex-col justify-between p-5 text-[#E2E2E4] shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Top Branding */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#353535]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
                IL2
              </div>
              <div>
                <h2 className="font-bold text-base text-white">IL2CppManager</h2>
                <span className="text-[11px] text-[#8E8E93] font-mono">v1.2.0 · Web Studio</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#28282A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation items */}
          <div className="flex flex-col gap-1 py-4">
            <button
              onClick={() => {
                onOpenInfo('about');
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[#28282A] text-[#C7C7CC] hover:text-white transition-colors text-left"
            >
              <Info className="w-4 h-4 text-indigo-400" />
              <span>About</span>
            </button>

            <button
              onClick={() => {
                onOpenInfo('credits');
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[#28282A] text-[#C7C7CC] hover:text-white transition-colors text-left"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Credits</span>
            </button>

            <button
              onClick={() => {
                onOpenInfo('licenses');
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[#28282A] text-[#C7C7CC] hover:text-white transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Licenses</span>
            </button>
          </div>

          <div className="h-[1px] bg-[#353535] my-2" />

          {/* External community links */}
          <div className="flex flex-col gap-1 py-2">
            <a
              href="https://github.com/Reomodz/New-debug-private-"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[#28282A] text-[#C7C7CC] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <Code className="w-4 h-4 text-slate-300" />
                <span>Source Repository</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#8E8E93]" />
            </a>

            <a
              href="https://t.me/reomodz"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-[#28282A] text-[#C7C7CC] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <Send className="w-4 h-4 text-sky-400" />
                <span>Telegram Channel</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#8E8E93]" />
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#353535] text-xs text-[#8E8E93] flex flex-col gap-1 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Root Engine Ready</span>
          </div>
          <div>ARM64 Disassembly & Call Graph Analyzer</div>
        </div>
      </div>
    </div>
  );
};
