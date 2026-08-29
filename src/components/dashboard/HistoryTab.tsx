import React from 'react';
import { History, Code2, Copy, Download, Trash2, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { ScanHistoryRecord, HistoryCardViewSettings } from '../../types';
import { CODE_STYLE_PRESETS, generateScanHistoryCode } from '../../services/formatters';

interface HistoryTabProps {
  scanHistory: ScanHistoryRecord[];
  handleOpenHistoryRecord: (rec: ScanHistoryRecord) => void;
  onCopyText: (text: string, label: string) => void;
  saveHistory: (history: ScanHistoryRecord[]) => void;
  showToast: (msg: string) => void;
  setIsConfirmClearHistoryOpen: (open: boolean) => void;
  cardViewSettings: HistoryCardViewSettings;
  setIsCardSettingsModalOpen: (open: boolean) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  scanHistory,
  handleOpenHistoryRecord,
  onCopyText,
  saveHistory,
  showToast,
  setIsConfirmClearHistoryOpen,
  cardViewSettings,
  setIsCardSettingsModalOpen,
}) => {
  const isCompact = cardViewSettings.density === 'compact';

  return (
    <div className="max-w-5xl mx-auto w-full p-2.5 sm:p-4 flex flex-col gap-3 sm:gap-4 pb-12">
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col rounded-xl sm:rounded-2xl border border-[#2D2D30] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-2.5 sm:p-3.5 bg-[#1E1E20] border-b border-[#2D2D30] gap-2 flex-wrap">
            <span className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-white">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
              <span>Scan Logs</span>
              <span className="text-[10px] sm:text-xs font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {scanHistory.length}
              </span>
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setIsCardSettingsModalOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#262629] hover:bg-[#323236] text-[#A0A0A5] hover:text-white border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-colors shadow-sm"
                title="History Card Settings"
              >
                <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                <span>Options</span>
              </button>

              {scanHistory.length > 0 && (
                <button
                  onClick={() => setIsConfirmClearHistoryOpen(true)}
                  className="text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg sm:rounded-xl transition-colors flex items-center gap-1 sm:gap-1.5"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          <div
            className={`grid grid-cols-1 ${
              cardViewSettings.tabletLayout === 'grid' ? 'md:grid-cols-2 lg:grid-cols-2' : 'md:grid-cols-1'
            } gap-2 sm:gap-3 p-2 sm:p-3 bg-[#141416]`}
          >
            {scanHistory.length === 0 ? (
              <div className="p-8 sm:p-10 text-center text-[#8E8E93] flex flex-col items-center col-span-full">
                <History className="w-9 h-9 text-[#3A3A3E] mb-2.5" />
                <p className="text-xs sm:text-sm font-medium">No scans recorded yet.</p>
                <p className="text-[10px] sm:text-xs text-[#6C6C70] mt-1 max-w-[220px]">
                  Scan a watchlist profile to generate history logs here.
                </p>
              </div>
            ) : (
              scanHistory.map((rec) => {
                const presetId = rec.codeStylePreset || 'cpp_constexpr';
                const presetObj = CODE_STYLE_PRESETS.find((p) => p.id === presetId) || CODE_STYLE_PRESETS[0];

                return (
                  <div
                    key={rec.id}
                    onClick={() => handleOpenHistoryRecord(rec)}
                    className={`${
                      isCompact ? 'p-2.5 sm:p-3 gap-1.5' : 'p-3 sm:p-4 gap-2.5'
                    } rounded-xl sm:rounded-2xl bg-[#1E1E20] hover:bg-[#242428] border border-[#2D2D30] hover:border-[#4A4A50] transition-all cursor-pointer active:scale-[0.99] group flex flex-col shadow-sm`}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors truncate">
                          {rec.profileName}
                        </span>
                        {cardViewSettings.showCodeStyleBadge && (
                          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                            <Code2 className="w-3 h-3" />
                            <span>{presetObj.label}</span>
                          </span>
                        )}
                      </div>

                      {cardViewSettings.showQuickActions && (
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Direct Copy in Selected Code Style */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const generated = generateScanHistoryCode(rec, rec.codeStylePreset, rec.customCodeStyleTemplate);
                              onCopyText(generated.code, `${rec.profileName} (${presetObj.label})`);
                            }}
                            className="p-1.5 bg-[#1C1C20] hover:bg-[#2A2A30] text-[#A0A0A5] hover:text-white rounded-md sm:rounded-lg border border-[#353538] transition-colors"
                            title={`Copy All Offsets as ${presetObj.label}`}
                          >
                            <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                          </button>

                          {/* Direct Download in Selected Code Style */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const generated = generateScanHistoryCode(rec, rec.codeStylePreset, rec.customCodeStyleTemplate);
                              const blob = new Blob([generated.code], { type: generated.mimeType });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = generated.filename;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              showToast(`Downloaded ${generated.filename}`);
                            }}
                            className="p-1.5 bg-[#1C1C20] hover:bg-[#2A2A30] text-[#A0A0A5] hover:text-white rounded-md sm:rounded-lg border border-[#353538] transition-colors"
                            title={`Download ${presetObj.label} File`}
                          >
                            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                          </button>

                          {/* Delete Record */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = scanHistory.filter((item) => item.id !== rec.id);
                              saveHistory(updated);
                              showToast('Scan record deleted');
                            }}
                            className="p-1.5 text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10 rounded-md sm:rounded-lg transition-colors"
                            title="Delete this scan log"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {cardViewSettings.showMetadata && (
                      <div className="text-[10px] sm:text-xs text-[#8E8E93] flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="bg-[#141416] px-1.5 sm:px-2 py-0.5 rounded border border-[#353538]">
                          {rec.sourceMode === 'live' ? 'Live Scan' : 'Storage Dump'}
                        </span>
                        <span className="text-emerald-400 font-medium px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {rec.resolvedCount}/{rec.totalTargets} Resolved
                        </span>
                        <span className="text-[9px] sm:text-[11px] text-[#6C6C70]">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(rec.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] sm:text-[11px] text-indigo-400/80 ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          View details & code <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    )}

                    {cardViewSettings.showOffsetTags && (
                      <div className="flex flex-wrap gap-1.5 font-mono text-[9px] sm:text-[10px] pt-0.5">
                        {rec.items.slice(0, 5).map((it, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#141416] border border-[#353538] rounded-md sm:rounded-lg text-[#A0A0A5]"
                          >
                            {it.customName || it.memberName}: <span className="text-amber-300 font-bold">{it.offsetHex || it.rvaHex || 'N/A'}</span>
                          </span>
                        ))}
                        {rec.items.length > 5 && (
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[#888] bg-[#141416] border border-[#2D2D30] rounded-md sm:rounded-lg">
                            +{rec.items.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
