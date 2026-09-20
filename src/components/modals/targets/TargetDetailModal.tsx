import React, { useState } from 'react';
import {
  Sliders,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Eye,
  X,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { WatchlistTargetItem, WatchlistProfile } from '../../../types';
import { il2cppEngine } from '../../../services/il2cppEngine';

interface TargetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewingTargetItem: WatchlistTargetItem | null;
  setViewingTargetItem?: React.Dispatch<React.SetStateAction<WatchlistTargetItem | null>>;
  activeProfile?: WatchlistProfile;
  handleOpenEditTarget: (target: WatchlistTargetItem) => void;
  onCopyText?: (text: string, label: string) => void;
  onNavigateToBrowser?: (classIndex?: number, memberKind?: 'FIELD' | 'METHOD', memberName?: string) => void;
  isDumpLoaded?: boolean;
}

export const TargetDetailModal: React.FC<TargetDetailModalProps> = ({
  isOpen,
  onClose,
  viewingTargetItem,
  setViewingTargetItem,
  activeProfile,
  handleOpenEditTarget,
  onCopyText,
  onNavigateToBrowser,
  isDumpLoaded = true,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !viewingTargetItem) return null;

  const handleCopy = (text: string, label: string, key: string) => {
    if (onCopyText) {
      onCopyText(text, label);
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Find index in profile for Previous/Next navigation
  const profileTargets = activeProfile?.items || [];
  const currentIndex = profileTargets.findIndex((t) => t.id === viewingTargetItem.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < profileTargets.length - 1;

  const navigateTarget = (delta: number) => {
    if (!setViewingTargetItem || currentIndex < 0) return;
    const newIdx = currentIndex + delta;
    if (newIdx >= 0 && newIdx < profileTargets.length) {
      setViewingTargetItem(profileTargets[newIdx]);
    }
  };

  const targetClass = viewingTargetItem.resolvedClassName || viewingTargetItem.className || 'UnknownClass';
  const targetMember = viewingTargetItem.resolvedMemberName || viewingTargetItem.memberName || 'unknownMember';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-2 sm:p-3 flex justify-center items-center">
      <div className="bg-[#18181B] border border-[#2D2D32] rounded-xl sm:rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[82vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-2.5 sm:p-3 bg-[#141416] border-b border-[#27272A] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-[#F4F4F5] truncate">
                  {viewingTargetItem.customName || targetMember}
                </h3>
                {viewingTargetItem.kind && (
                  <span
                    className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold shrink-0 ${
                      viewingTargetItem.kind === 'FIELD'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {viewingTargetItem.kind}
                  </span>
                )}
                {(viewingTargetItem.resolvedAssemblyName || viewingTargetItem.assemblyName) && (
                  <span className="text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                    {viewingTargetItem.resolvedAssemblyName || viewingTargetItem.assemblyName}
                  </span>
                )}
                {viewingTargetItem.resolvedViaFallback && (
                  <span className="text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 shrink-0">
                    Fallback Match
                  </span>
                )}
              </div>
              {!viewingTargetItem.isCustom && (viewingTargetItem.className || viewingTargetItem.memberName) && (
                <span className="text-[9px] text-[#71717A] truncate font-mono">
                  {targetClass}.{targetMember}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {profileTargets.length > 1 && setViewingTargetItem && (
              <div className="flex items-center bg-[#202024] border border-[#2E2E33] rounded-lg p-0.5 mr-0.5">
                <button
                  onClick={() => navigateTarget(-1)}
                  disabled={!hasPrev}
                  className="p-1 text-[#A1A1AA] hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-[#2A2A30] transition-colors"
                  title="Previous target"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[8px] sm:text-[9px] font-mono text-[#A1A1AA] px-1">
                  {currentIndex >= 0 ? currentIndex + 1 : 1}/{profileTargets.length}
                </span>
                <button
                  onClick={() => navigateTarget(1)}
                  disabled={!hasNext}
                  className="p-1 text-[#A1A1AA] hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-[#2A2A30] transition-colors"
                  title="Next target"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 text-[#A1A1AA] hover:text-white hover:bg-[#27272A] rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-2.5 sm:p-3.5 flex-1 overflow-y-auto space-y-2.5 overscroll-contain text-[10px] sm:text-xs pr-1.5">
          
          {/* Target Assembly, Class & Method/Field Details */}
          {viewingTargetItem.isCustom ? (
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[#141417] border border-[#27272B] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-indigo-400 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Direct Offset Target</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Custom Mode
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-xs">
                <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[#18181C] border border-[#26262B]">
                  <span className="text-[#8E8E93] uppercase text-[8px] sm:text-[9px] font-semibold tracking-wider">Custom Name</span>
                  <span className="text-[#F4F4F5] font-semibold text-[11px] sm:text-xs truncate">
                    {viewingTargetItem.customName || viewingTargetItem.className}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[#18181C] border border-[#26262B]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93] uppercase text-[8px] sm:text-[9px] font-semibold tracking-wider">Direct / Default Offset</span>
                    <button
                      onClick={() => handleCopy(viewingTargetItem.defaultOffset || viewingTargetItem.offsetHex || viewingTargetItem.rvaHex || '0x0', 'Default Offset', 'offset')}
                      className="text-[#A1A1AA] hover:text-emerald-300 transition-colors p-0.5"
                      title="Copy Offset"
                    >
                      {copiedKey === 'offset' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px] sm:text-xs font-bold truncate">
                    {viewingTargetItem.defaultOffset || viewingTargetItem.offsetHex || viewingTargetItem.rvaHex || '0x0'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-[#141417] border border-[#27272B] space-y-2">
              {/* Assembly / DLL info */}
              <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[#18181C] border border-[#26262B]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E93] uppercase text-[8px] sm:text-[9px] font-semibold tracking-wider flex items-center gap-1">
                    <span>Assembly Module (.dll)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(viewingTargetItem.resolvedAssemblyName || viewingTargetItem.assemblyName || 'Assembly-CSharp.dll', 'Assembly / DLL', 'dll')}
                    className="text-[#A1A1AA] hover:text-indigo-300 transition-colors p-0.5"
                    title="Copy Assembly (.dll)"
                  >
                    {copiedKey === 'dll' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-indigo-300 font-mono text-[10px] sm:text-xs font-semibold truncate select-all">
                  {viewingTargetItem.resolvedAssemblyName || viewingTargetItem.assemblyName || 'Assembly-CSharp.dll'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-xs">
                
                {/* Class Name (Namespace::ClassName) */}
                <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[#18181C] border border-[#26262B]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93] uppercase text-[8px] sm:text-[9px] font-semibold tracking-wider">Target Namespace & Class</span>
                    <button
                      onClick={() =>
                        handleCopy(
                          viewingTargetItem.namespaceName
                            ? `${viewingTargetItem.namespaceName}::${viewingTargetItem.className || ''}`
                            : viewingTargetItem.className || '',
                          'Class Name',
                          'class'
                        )
                      }
                      className="text-[#A1A1AA] hover:text-indigo-300 transition-colors p-0.5"
                      title="Copy Target Class"
                    >
                      {copiedKey === 'class' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <span className="text-[#F4F4F5] font-mono text-[10px] sm:text-xs font-semibold truncate select-all">
                    {viewingTargetItem.namespaceName ? (
                      <>
                        <span className="text-amber-300/90">{viewingTargetItem.namespaceName}</span>
                        <span className="text-indigo-400">::</span>
                        <span>{viewingTargetItem.className}</span>
                      </>
                    ) : (
                      viewingTargetItem.className
                    )}
                  </span>
                  {viewingTargetItem.resolvedClassName && viewingTargetItem.resolvedClassName !== viewingTargetItem.className && (
                    <span className="text-[8px] sm:text-[9px] text-amber-400/90 font-mono mt-0.5">
                      ↳ Resolved: {viewingTargetItem.resolvedClassName}
                    </span>
                  )}
                </div>

                {/* Target Method / Field */}
                <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-[#18181C] border border-[#26262B]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93] uppercase text-[8px] sm:text-[9px] font-semibold tracking-wider">
                      {viewingTargetItem.kind === 'FIELD' ? 'Target Field' : 'Target Method'}
                    </span>
                    <button
                      onClick={() => handleCopy(viewingTargetItem.memberName || '', `${viewingTargetItem.kind === 'FIELD' ? 'Field' : 'Method'} Name`, 'member')}
                      className="text-[#A1A1AA] hover:text-sky-300 transition-colors p-0.5"
                      title={`Copy ${viewingTargetItem.kind === 'FIELD' ? 'Field' : 'Method'} Name`}
                    >
                      {copiedKey === 'member' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <span className="text-sky-300 font-mono text-[10px] sm:text-xs font-semibold truncate select-all">
                    {viewingTargetItem.memberName}
                  </span>
                  {viewingTargetItem.resolvedMemberName && viewingTargetItem.resolvedMemberName !== viewingTargetItem.memberName && (
                    <span className="text-[8px] sm:text-[9px] text-amber-400/90 font-mono mt-0.5">
                      ↳ Resolved: {viewingTargetItem.resolvedMemberName}
                    </span>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Fallbacks View (if any exist) */}
          {((viewingTargetItem.fallbackClassNames && viewingTargetItem.fallbackClassNames.length > 0) ||
            (viewingTargetItem.fallbackMemberNames && viewingTargetItem.fallbackMemberNames.length > 0)) && (
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#121215] border border-[#242428] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-semibold text-[#A1A1AA]">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Configured Fallback Search Chains</span>
              </div>
              
              {viewingTargetItem.fallbackClassNames && viewingTargetItem.fallbackClassNames.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] sm:text-[9px] text-[#71717A]">Alternative Classes:</span>
                  <div className="flex flex-wrap gap-1">
                    {viewingTargetItem.fallbackClassNames.map((cls: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.2 bg-[#1C1C20] border border-[#303036] rounded font-mono text-[8px] sm:text-[9px] text-amber-300/90">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingTargetItem.fallbackMemberNames && viewingTargetItem.fallbackMemberNames.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className="text-[8px] sm:text-[9px] text-[#71717A]">Alternative Members:</span>
                  <div className="flex flex-wrap gap-1">
                    {viewingTargetItem.fallbackMemberNames.map((mem: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.2 bg-[#1C1C20] border border-[#303036] rounded font-mono text-[8px] sm:text-[9px] text-sky-300/90">
                        {mem}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Comment Note */}
          {viewingTargetItem.comment && (
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#141417] border border-[#27272B] flex flex-col gap-0.5">
              <span className="text-[8px] sm:text-[9px] text-[#71717A] uppercase font-semibold tracking-wider">Comment / Annotation</span>
              <span className="text-[#D4D4D8] italic text-[10px] sm:text-xs leading-relaxed">
                "{viewingTargetItem.comment}"
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-2.5 sm:p-3 border-t border-[#27272A] shrink-0 bg-[#141416] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                handleOpenEditTarget(viewingTargetItem);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#202024] hover:bg-[#2B2B30] text-[#E4E4E7] rounded-lg sm:rounded-xl border border-[#33333A] transition-colors text-[10px] sm:text-xs font-semibold"
            >
              <Pencil className="w-3 h-3 text-indigo-400" />
              <span>Edit Target</span>
            </button>

            {isDumpLoaded && onNavigateToBrowser && !viewingTargetItem.isCustom && viewingTargetItem.className && (
              <button
                onClick={() => {
                  onClose();
                  const targetClass = viewingTargetItem.resolvedClassName || viewingTargetItem.className || '';
                  const targetNs = viewingTargetItem.namespaceName;
                  const classIdx = il2cppEngine.findClassIndexForTarget(targetClass, targetNs);
                  onNavigateToBrowser(classIdx, viewingTargetItem.kind, viewingTargetItem.memberName);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/35 text-sky-300 hover:text-white rounded-lg sm:rounded-xl border border-sky-500/30 transition-colors text-[10px] sm:text-xs font-semibold shadow-sm active:scale-95"
                title="Redirect to Assembly Browser and view target member"
              >
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Show</span>
              </button>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="px-3.5 sm:px-4 py-1.5 bg-[#27272A] hover:bg-[#323236] text-[#F4F4F5] rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

