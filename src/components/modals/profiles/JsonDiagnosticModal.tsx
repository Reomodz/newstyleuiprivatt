import React, { useState } from 'react';
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  X,
  FileCode,
  ShieldAlert,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { JsonDiagnosticResult } from '../../../utils/jsonValidator';
import { WatchlistProfile, TargetCardViewSettings } from '../../../types';

interface JsonDiagnosticModalProps {
  diagnostic: JsonDiagnosticResult | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (profile: WatchlistProfile, cardSettings?: TargetCardViewSettings) => void;
}

export const JsonDiagnosticModal: React.FC<JsonDiagnosticModalProps> = ({
  diagnostic,
  isOpen,
  onClose,
  onConfirmImport,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen || !diagnostic) return null;

  const isUnsupported = diagnostic.status === 'unsupported';
  const isPartial = diagnostic.status === 'partial';

  const handleConfirm = () => {
    if (diagnostic.recoveredProfile) {
      onConfirmImport(diagnostic.recoveredProfile, diagnostic.recoveredCardSettings);
      onClose();
    }
  };

  return (
    <div
      id="json-diagnostic-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-3 sm:p-4 flex justify-center items-center overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="json-diagnostic-dialog"
        className="bg-[#1C1C1F] border border-[#35353A] rounded-2xl max-w-xl w-full shadow-2xl flex flex-col overflow-hidden text-[#E2E2E4] max-h-[90vh] my-auto"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#2C2C30] flex items-center justify-between bg-[#17171A]">
          <div className="flex items-center gap-2.5">
            {isUnsupported ? (
              <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                <XCircle className="w-5 h-5" />
              </div>
            ) : isPartial ? (
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {isUnsupported
                  ? 'Unsupported / Malformed JSON'
                  : isPartial
                  ? 'JSON Safety Diagnostic & Recovery'
                  : 'Valid Profile JSON'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#8E8E93]">
                {isUnsupported
                  ? 'The JSON structure cannot be parsed or lacks valid schema.'
                  : isPartial
                  ? 'Minor structure/field issues were identified and auto-corrected.'
                  : 'File structure is healthy and conforms to profile schema.'}
              </p>
            </div>
          </div>
          <button
            id="close-json-diag-modal-btn"
            onClick={onClose}
            className="p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {/* Status Alert Banner */}
          {isUnsupported && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-red-300 text-xs">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Format Not Supported: {diagnostic.errorTitle || 'Structure Error'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-300/90 pl-1">
                {diagnostic.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Partial Warnings Banner */}
          {isPartial && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/40 text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Diagnostic Notice ({diagnostic.warnings.length} issues corrected)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/90 pl-1">
                {diagnostic.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid Info & Recovery Preview */}
          {diagnostic.recoveredProfile && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[#8E8E93] font-medium text-[11px] uppercase tracking-wider">
                <span>Recovered Profile Preview</span>
                <span className="text-emerald-400 font-mono-code font-bold">
                  {diagnostic.recoveredProfile.items.length} Target(s) Ready
                </span>
              </div>

              <div className="p-3 bg-[#141417] border border-[#2B2B30] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E93]">Profile Name:</span>
                  <span className="font-semibold text-white truncate max-w-[240px]">
                    {diagnostic.recoveredProfile.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E93]">Target App:</span>
                  <span className="font-mono-code text-[11px] text-indigo-300">
                    {diagnostic.recoveredProfile.targetApp}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8E8E93]">Code Preset:</span>
                  <span className="font-mono-code text-[11px] text-amber-300">
                    {diagnostic.recoveredProfile.codeStylePreset}
                  </span>
                </div>
                {diagnostic.recoveredCardSettings && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E8E93]">Card Display Settings:</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3" /> Included
                    </span>
                  </div>
                )}
              </div>

              {/* Diagnostic Log Details */}
              {diagnostic.info.length > 0 && (
                <div className="p-2.5 bg-black/25 border border-white/5 rounded-xl space-y-1">
                  <div className="text-[10px] text-[#6E6E73] font-semibold uppercase tracking-wider">
                    Diagnostic Log:
                  </div>
                  {diagnostic.info.map((inf, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#A1A1A8]">
                      <Info className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{inf}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Raw JSON toggle */}
          {diagnostic.rawText && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="flex items-center gap-1.5 text-[11px] text-[#8E8E93] hover:text-white transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{showRawJson ? 'Hide Raw Input JSON' : 'Inspect Raw Input JSON'}</span>
              </button>
              {showRawJson && (
                <pre className="p-2.5 bg-[#111113] border border-[#27272B] rounded-xl text-[10px] font-mono-code text-gray-300 overflow-x-auto max-h-40 leading-tight">
                  {diagnostic.rawText}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-[#2C2C30] flex items-center justify-end gap-2 bg-[#17171A]">
          <button
            id="cancel-json-diag-btn"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-[#35353A] text-xs font-semibold text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
          >
            {isUnsupported ? 'Close' : 'Cancel'}
          </button>

          {!isUnsupported && diagnostic.recoveredProfile && (
            <button
              id="confirm-json-import-btn"
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-xs font-semibold shadow-lg shadow-indigo-950/40 transition-all"
            >
              <span>{isPartial ? 'Add Recovered Profile' : 'Import Profile'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
