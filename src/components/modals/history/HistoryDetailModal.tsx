import React from 'react';
import { Copy, Download, Code2, FileCode, ChevronLeft, Settings2, Sparkles } from 'lucide-react';
import { ScanHistoryRecord, CodeStylePreset } from '../../../types';
import { CODE_STYLE_PRESETS, generateScanHistoryCode, formatTargetCodeSnippet } from '../../../services/formatters';

interface HistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHistoryRecord: ScanHistoryRecord | null;
  historyModalTab?: 'targets' | 'code';
  setHistoryModalTab?: (val: 'targets' | 'code') => void;
  historyModalCodeStyle: CodeStylePreset;
  setHistoryModalCodeStyle: (val: CodeStylePreset) => void;
  historyModalCustomTemplate: string;
  setHistoryModalCustomTemplate: React.Dispatch<React.SetStateAction<string>>;
  onCopyText: (text: string, label: string) => void;
  showToast: (msg: string) => void;
}

export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
  isOpen, onClose, selectedHistoryRecord,
  historyModalCodeStyle, setHistoryModalCodeStyle, historyModalCustomTemplate,
  setHistoryModalCustomTemplate, onCopyText, showToast
}) => {
  const [isHistoryStatsExpanded, setIsHistoryStatsExpanded] = React.useState(false);
  
  if (!isOpen || !selectedHistoryRecord) return null;
  const currentFormatted = generateScanHistoryCode(
    selectedHistoryRecord,
    historyModalCodeStyle,
    historyModalCustomTemplate
  );
  const activePresetObj = CODE_STYLE_PRESETS.find((p) => p.id === historyModalCodeStyle) || CODE_STYLE_PRESETS[0];

  // Sample target item used to render a live template preview
  const firstItem = selectedHistoryRecord.items[0];
  const sampleTarget = {
    id: firstItem?.id || 'sample_target',
    customName: firstItem?.customName || (firstItem ? undefined : 'm_LocalPlayer'),
    className: firstItem?.className || 'PlayerController',
    memberName: firstItem?.memberName || 'localPlayer',
    kind: firstItem?.kind || ('FIELD' as const),
    offsetHex: firstItem?.offsetHex || '0x28',
    rvaHex: firstItem?.rvaHex || '0x18F420',
    vaHex: firstItem?.vaHex || '0x7FF8A4B20028',
    typeName: firstItem?.typeName || 'PlayerController',
    comment: firstItem?.comment || (firstItem ? undefined : 'Player instance pointer'),
    resolvedClassName: firstItem?.resolvedClassName,
    resolvedMemberName: firstItem?.resolvedMemberName,
    resolvedViaFallback: firstItem?.resolvedViaFallback,
  };

  const sampleRenderedSnippet = formatTargetCodeSnippet(
    sampleTarget,
    historyModalCodeStyle,
    historyModalCustomTemplate
  );

  return (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
            <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 max-w-5xl w-full shadow-2xl flex flex-col gap-3 sm:gap-5 animate-in fade-in zoom-in-95 duration-200 my-auto shrink-0 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Header: Back Button, Title, Timestamp & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-[#2D2D30] gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 hover:bg-[#262629] text-[#8E8E93] hover:text-white rounded-lg sm:rounded-xl border border-[#353538] transition-colors shrink-0"
                    title="Back to History"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </button>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-xs sm:text-base font-bold text-[#E2E2E4] truncate">
                        {selectedHistoryRecord.profileName}
                      </h3>
                      <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <Code2 className="w-3 h-3" />
                        <span>{activePresetObj.label}</span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[#8E8E93] truncate">
                      {new Date(selectedHistoryRecord.timestamp).toLocaleString()} • {selectedHistoryRecord.targetApp}
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons: Copy All Code, Download Code File, Settings Toggle */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => {
                      onCopyText(currentFormatted.code, `${selectedHistoryRecord.profileName} (${activePresetObj.label})`);
                    }}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#262629] hover:bg-[#323236] text-[#E2E2E4] hover:text-white rounded-lg sm:rounded-xl border border-[#353538] transition-colors text-[11px] sm:text-xs font-semibold shadow-sm"
                    title={`Copy All Code in ${activePresetObj.label}`}
                  >
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Copy Code</span>
                    <span className="sm:hidden">Copy</span>
                  </button>

                  <button
                    onClick={() => {
                      const blob = new Blob([currentFormatted.code], { type: currentFormatted.mimeType });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = currentFormatted.filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showToast(`Downloaded ${currentFormatted.filename}`);
                    }}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#262629] hover:bg-[#323236] text-[#E2E2E4] hover:text-white rounded-lg sm:rounded-xl border border-[#353538] transition-colors text-[11px] sm:text-xs font-semibold shadow-sm"
                    title={`Download ${activePresetObj.label} File`}
                  >
                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Download Full ({activePresetObj.fileExtension})</span>
                    <span className="sm:hidden">Download Full</span>
                  </button>

                  {/* Settings Logo Toggle for Code Format & Stats */}
                  <button
                    onClick={() => setIsHistoryStatsExpanded(!isHistoryStatsExpanded)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all text-[11px] sm:text-xs font-semibold ${
                      isHistoryStatsExpanded
                        ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-600/20'
                        : 'bg-[#262629] hover:bg-[#323236] text-[#A0A0A5] hover:text-white border-[#353538]'
                    }`}
                    title={isHistoryStatsExpanded ? "Close Code Format Settings" : "Open Code Format Settings"}
                  >
                    <Settings2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isHistoryStatsExpanded ? 'text-indigo-400 rotate-90 transition-transform duration-300' : 'text-indigo-400'}`} />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                </div>
              </div>

              {isHistoryStatsExpanded && (
                <div className="flex flex-col gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-1.5 sm:p-2 duration-200">
                  {/* Code Style Output Selector Bar & Live Template Preview */}
                  <div className="bg-[#141416] p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-semibold text-[#D8D8DC] uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                        Code Style Output Format
                      </span>
                      <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">
                        Choose output template for export & snippets
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
                      {CODE_STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setHistoryModalCodeStyle(preset.id as CodeStylePreset)}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9.5px] sm:text-xs font-medium border transition-all text-center truncate ${
                            historyModalCodeStyle === preset.id
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-600/20 font-bold'
                              : 'bg-[#1E1E20] hover:bg-[#252528] text-[#8E8E93] hover:text-[#E2E2E4] border-[#303034]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Show template format card ONLY when user selects Custom Template */}
                    {historyModalCodeStyle === 'custom' && (
                      <div className="flex flex-col gap-2 p-2.5 sm:p-3 bg-[#19191D] rounded-xl border border-[#2E2E34]">
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] sm:text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-[#E2E2E4]">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Custom Template Format:</span>
                            <code className="font-mono text-indigo-300 bg-[#111113] px-2 py-0.5 rounded border border-[#2D2D32]">
                              {historyModalCustomTemplate || activePresetObj.template}
                            </code>
                          </div>
                          <span className="text-[9px] sm:text-[10px] text-[#8E8E93] italic">
                            {activePresetObj.description}
                          </span>
                        </div>

                        {/* Custom Template Expression Input */}
                        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#26262B]">
                          <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                            <span className="text-indigo-300 font-semibold">Custom Template Editor</span>
                            <span className="text-[#7E7E84]">Insert tags:</span>
                          </div>
                          <input
                            type="text"
                            value={historyModalCustomTemplate}
                            onChange={(e) => setHistoryModalCustomTemplate(e.target.value)}
                            placeholder="constexpr uintptr_t {name} = {offset};"
                            className="w-full px-2.5 py-1.5 sm:py-2 bg-[#101012] border border-indigo-500/40 rounded-lg text-[10px] sm:text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-400 shadow-inner"
                          />
                          <div className="flex items-center gap-1 flex-wrap text-[8px] sm:text-[9px] font-mono">
                            {['{name}', '{offset}', '{rva}', '{va}', '{class}', '{member}', '{type}', '{group}', '{subgroup}', '{kind}', '{comment}', '\\n'].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setHistoryModalCustomTemplate((prev) => `${prev} ${tag}`.trim())}
                                className="px-1.5 py-0.5 bg-[#121214] hover:bg-[#202025] text-indigo-300 hover:text-white rounded border border-[#303036] transition-colors"
                              >
                                +{tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Live Output Preview Block */}
                        <div className="flex flex-col gap-1 pt-1.5 border-t border-[#26262B]">
                          <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                            <span className="text-[#8E8E93] font-semibold flex items-center gap-1">
                              <span>How it looks rendered (Live Output Sample):</span>
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              Rendered Preview
                            </span>
                          </div>
                          <div className="p-2 sm:p-2.5 bg-[#0D0D10] border border-[#28282D] rounded-lg font-mono text-[9px] sm:text-xs text-indigo-200 overflow-x-auto whitespace-pre selection:bg-indigo-600/40">
                            {sampleRenderedSnippet}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Formatted Code View */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-[#2D2D30] pb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      Formatted Code Output
                    </span>
                  </div>

                  <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">
                    Full {activePresetObj.label} export file ({selectedHistoryRecord.items.length} items)
                  </span>
                </div>

                <div className="flex flex-col bg-[#141416] rounded-xl sm:rounded-2xl border border-[#2D2D30] overflow-hidden">
                  <div className="p-2 sm:p-3 bg-[#1A1A1E] border-b border-[#2D2D30] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                      <span className="text-[10px] sm:text-xs font-mono font-semibold text-[#E2E2E4]">
                        {currentFormatted.filename}
                      </span>
                    </div>
                  </div>

                  <pre className="p-2 sm:p-4 font-mono text-[8px] sm:text-[11px] md:text-xs text-[#D8D8E0] overflow-x-auto max-h-80 sm:max-h-96 overflow-y-auto leading-normal sm:leading-relaxed selection:bg-indigo-600/40">
                    <code>{currentFormatted.code}</code>
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#2D2D30]">
                <button
                  onClick={() => {
                    onCopyText(currentFormatted.code, `${selectedHistoryRecord.profileName} (${activePresetObj.label})`);
                  }}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-indigo-500/10 transition-colors"
                >
                  <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Copy All ({activePresetObj.label})</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-[#262629] hover:bg-[#323236] text-[#E2E2E4] rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
  );
};

