import React from 'react';
import { Copy, Download, Code2, FileCode, ChevronLeft, Settings2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { ScanHistoryRecord, CodeStylePreset } from '../../types';
import { CODE_STYLE_PRESETS, generateScanHistoryCode, formatTargetCodeSnippet } from '../../services/formatters';

interface HistoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHistoryRecord: ScanHistoryRecord | null;
  historyModalTab: 'targets' | 'code';
  setHistoryModalTab: (val: 'targets' | 'code') => void;
  historyModalCodeStyle: CodeStylePreset;
  setHistoryModalCodeStyle: (val: CodeStylePreset) => void;
  historyModalCustomTemplate: string;
  setHistoryModalCustomTemplate: React.Dispatch<React.SetStateAction<string>>;
  onCopyText: (text: string, label: string) => void;
  showToast: (msg: string) => void;
}

export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({
  isOpen, onClose, selectedHistoryRecord, historyModalTab, setHistoryModalTab,
  historyModalCodeStyle, setHistoryModalCodeStyle, historyModalCustomTemplate,
  setHistoryModalCustomTemplate, onCopyText, showToast
}) => {
  const [expandedHistoryItems, setExpandedHistoryItems] = React.useState<Set<number>>(new Set());
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
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 flex justify-center items-start sm:items-center">
            <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-5xl w-full shadow-2xl flex flex-col gap-3 sm:gap-5 animate-in fade-in zoom-in-95 duration-200 mt-4 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto">
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
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:px-3.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
                    title={`Download ${activePresetObj.label} File`}
                  >
                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Download {activePresetObj.fileExtension}</span>
                    <span className="sm:hidden">DL</span>
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
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
                    <div className="bg-[#141416] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-1">
                      <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Mode & Target</span>
                      <span className="text-[11px] sm:text-xs font-semibold text-[#E2E2E4] capitalize truncate">
                        {selectedHistoryRecord.sourceMode === 'live' ? 'Live Memory Scan' : 'Storage Dump'}
                      </span>
                    </div>
                    <div className="bg-[#141416] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-1">
                      <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Resolution Rate</span>
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-400">
                        {selectedHistoryRecord.resolvedCount} / {selectedHistoryRecord.totalTargets} Resolved
                      </span>
                    </div>
                    <div className="bg-[#141416] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-1 col-span-2">
                      <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Active Format</span>
                      <span className="text-[10px] sm:text-xs font-mono font-semibold text-indigo-300 truncate">
                        {activePresetObj.label} ({activePresetObj.fileExtension})
                      </span>
                    </div>
                  </div>

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

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {CODE_STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setHistoryModalCodeStyle(preset.id as CodeStylePreset)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium border transition-all ${
                            historyModalCodeStyle === preset.id
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-600/20 font-bold'
                              : 'bg-[#1E1E20] hover:bg-[#252528] text-[#8E8E93] hover:text-[#E2E2E4] border-[#303034]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* How It Looks in Template - Visual Structure & Live Rendered Snippet */}
                    <div className="flex flex-col gap-2 p-2.5 sm:p-3 bg-[#19191D] rounded-xl border border-[#2E2E34]">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] sm:text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-[#E2E2E4]">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Template Format:</span>
                          <code className="font-mono text-indigo-300 bg-[#111113] px-2 py-0.5 rounded border border-[#2D2D32]">
                            {activePresetObj.id === 'custom'
                              ? (historyModalCustomTemplate || activePresetObj.template)
                              : activePresetObj.template}
                          </code>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-[#8E8E93] italic">
                          {activePresetObj.description}
                        </span>
                      </div>

                      {/* Custom Template Expression Input */}
                      {historyModalCodeStyle === 'custom' && (
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
                            {['{name}', '{offset}', '{rva}', '{va}', '{class}', '{member}', '{kind}', '{type}'].map((tag) => (
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
                      )}

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
                  </div>
                </div>
              )}

              {/* View Tabs: Scanned Targets vs Formatted Code Output */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-[#2D2D30] pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoryModalTab('targets')}
                      className={`px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${
                        historyModalTab === 'targets'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-[#8E8E93] hover:text-[#E2E2E4] hover:bg-[#262629]'
                      }`}
                    >
                      Scanned Targets ({selectedHistoryRecord.items.length})
                    </button>

                    <button
                      onClick={() => setHistoryModalTab('code')}
                      className={`px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        historyModalTab === 'code'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-[#8E8E93] hover:text-[#E2E2E4] hover:bg-[#262629]'
                      }`}
                    >
                      <FileCode className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Formatted Code View</span>
                    </button>
                  </div>

                  <span className="text-[9px] sm:text-[11px] text-[#8E8E93] hidden sm:inline">
                    {historyModalTab === 'targets' ? 'Click copy on any row for individual snippet' : `Full ${activePresetObj.label} file`}
                  </span>
                </div>

                {/* TAB CONTENT 1: SCANNED TARGETS LIST */}
                {historyModalTab === 'targets' && (
                  <div className="flex flex-col divide-y divide-[#262629] bg-[#141416] rounded-xl sm:rounded-2xl border border-[#2D2D30] overflow-hidden max-h-80 sm:max-h-96 overflow-y-auto">
                    {selectedHistoryRecord.items.map((item, idx) => {
                      const targetClass = item.resolvedClassName || item.className;
                      const targetMember = item.resolvedMemberName || item.memberName;
                      const offsetOrRva = item.kind === 'FIELD' ? item.offsetHex : item.rvaHex;

                      const singleSnippet = formatTargetCodeSnippet(
                        {
                          id: item.id || `t_${idx}`,
                          customName: item.customName,
                          className: item.className,
                          memberName: item.memberName,
                          kind: item.kind,
                          comment: item.comment,
                          offsetHex: item.offsetHex,
                          rvaHex: item.rvaHex,
                          vaHex: item.vaHex,
                          typeName: item.typeName,
                          signature: item.signature,
                          resolvedClassName: item.resolvedClassName,
                          resolvedMemberName: item.resolvedMemberName,
                          resolvedViaFallback: item.resolvedViaFallback,
                        },
                        historyModalCodeStyle,
                        historyModalCustomTemplate
                      );

                      return (
                        <div key={idx} className="p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 hover:bg-[#1A1A1D] transition-colors">
                          <div className="flex items-start sm:items-center justify-between gap-1.5 sm:gap-3">
                            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
                              {/* Custom Name if exists */}
                              {item.customName && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] sm:text-xs font-bold text-white truncate">{item.customName}</span>
                                  <span className="text-[7px] sm:text-[9px] px-1 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-medium shrink-0">Custom</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-mono flex-wrap">
                                <span className="text-[#8E8E93] truncate max-w-[110px] sm:max-w-none">{targetClass}</span>
                                <span className="text-[#55555A]">.</span>
                                <span className="text-sky-300 font-semibold truncate max-w-[120px] sm:max-w-none">{targetMember}</span>
                                <span
                                  className={`text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded font-mono font-semibold shrink-0 ${
                                    item.kind === 'FIELD'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}
                                >
                                  {item.kind}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                              {offsetOrRva ? (
                                <span className="font-mono text-[9px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-[#202024] border border-[#3E3E44] rounded-md sm:rounded-lg text-amber-300 select-all">
                                  {offsetOrRva}
                                </span>
                              ) : (
                                <span className="text-[8px] sm:text-xs text-red-400/90 font-mono bg-red-500/10 border border-red-500/20 px-1.5 sm:px-2 py-0.5 rounded">
                                  Not Found
                                </span>
                              )}
                              
                              <button
                                onClick={() => {
                                  setExpandedHistoryItems((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(idx)) next.delete(idx);
                                    else next.add(idx);
                                    return next;
                                  });
                                }}
                                className={`p-1 sm:p-2 hover:bg-[#2C2C32] rounded-md sm:rounded-lg border transition-colors flex items-center gap-1 ${
                                  expandedHistoryItems.has(idx) 
                                    ? 'bg-[#26262A] text-indigo-300 border-indigo-500/30' 
                                    : 'bg-[#202024] text-[#A0A0A5] hover:text-white border-[#353538]'
                                }`}
                                title={expandedHistoryItems.has(idx) ? 'Hide code details' : 'Show code details'}
                              >
                                <Code2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                                {expandedHistoryItems.has(idx) ? (
                                  <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8E8E93]" />
                                ) : (
                                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#8E8E93]" />
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  onCopyText(
                                    singleSnippet,
                                    `${item.customName || targetMember} (${activePresetObj.label})`
                                  );
                                }}
                                className="p-1 sm:p-2 bg-[#202024] hover:bg-[#2C2C32] text-[#A0A0A5] hover:text-white rounded-md sm:rounded-lg border border-[#353538] transition-colors"
                                title={`Copy Snippet in ${activePresetObj.label}`}
                              >
                                <Copy className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                              </button>
                            </div>
                          </div>

                          {/* Extra Features (Hidden by default) */}
                          {expandedHistoryItems.has(idx) && (
                            <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                              {(item.comment || item.resolvedViaFallback) && (
                                <div className="flex flex-col gap-0.5 px-1.5 sm:px-2.5 py-1 bg-[#141416] border border-[#262629] rounded-md sm:rounded-lg">
                                  {item.comment && (
                                    <span className="text-[8px] sm:text-[10px] text-[#8E8E93] italic line-clamp-2">
                                      // {item.comment}
                                    </span>
                                  )}
                                  {item.resolvedViaFallback && (
                                    <span className="text-[8px] sm:text-[10px] text-amber-400/90 font-sans">
                                      Matched via fallback ({item.resolvedClassName}.{item.resolvedMemberName})
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Code Style Preview Line */}
                              <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-[#0F0F11] border border-[#262629] rounded-md sm:rounded-lg font-mono text-[8px] sm:text-[11px] text-indigo-200/90 overflow-x-auto whitespace-pre">
                                {singleSnippet}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB CONTENT 2: FORMATTED CODE OUTPUT VIEW */}
                {historyModalTab === 'code' && (
                  <div className="flex flex-col bg-[#141416] rounded-xl sm:rounded-2xl border border-[#2D2D30] overflow-hidden">
                    <div className="p-2 sm:p-3 bg-[#1A1A1E] border-b border-[#2D2D30] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                        <span className="text-[10px] sm:text-xs font-mono font-semibold text-[#E2E2E4]">
                          {currentFormatted.filename}
                        </span>
                      </div>
                    </div>

                    <pre className="p-2 sm:p-4 font-mono text-[7px] sm:text-[10px] md:text-xs text-[#D8D8E0] overflow-x-auto max-h-80 sm:max-h-96 overflow-y-auto leading-normal sm:leading-relaxed selection:bg-indigo-600/40">
                      <code>{currentFormatted.code}</code>
                    </pre>
                  </div>
                )}
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

