import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CallGraphNodeViewData,
  CallGraphEdgeViewData,
  CallGraphPosition,
} from '../types';
import { il2cppEngine } from '../services/il2cppEngine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Code2,
} from 'lucide-react';

interface CallGraphViewProps {
  classIndex: number;
  methodIndex: number;
  onOpenMethodInstructions: (classIndex: number, methodIndex: number) => void;
  onOpenMethodInNewTab: (classIndex: number, methodIndex: number) => void;
  onCopyText: (text: string, label: string) => void;
}

export const CallGraphView: React.FC<CallGraphViewProps> = ({
  classIndex,
  methodIndex,
  onOpenMethodInstructions,
  onOpenMethodInNewTab,
  onCopyText,
}) => {
  // Graph state
  const [nodes, setNodes] = useState<CallGraphNodeViewData[]>([]);
  const [edges, setEdges] = useState<CallGraphEdgeViewData[]>([]);
  const [nodePositions, setNodePositions] = useState<Record<string, CallGraphPosition>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Undo/Redo history
  const [history, setHistory] = useState<Record<string, CallGraphPosition>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Canvas viewport (pan & zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 100, y: 150 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging single node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize graph
  useEffect(() => {
    const data = il2cppEngine.buildCallGraph(classIndex, methodIndex);
    setNodes(data.nodes);
    setEdges(data.edges);

    // Initial automatic hierarchical layout
    const positions: Record<string, CallGraphPosition> = {};
    const root = data.nodes.find((n) => n.isRoot) || data.nodes[0];

    if (root) {
      positions[root.id] = { x: 350, y: 200 };
    }

    const otherNodes = data.nodes.filter((n) => n.id !== root?.id);
    otherNodes.forEach((node, idx) => {
      const yOffset = (idx - (otherNodes.length - 1) / 2) * 160;
      positions[node.id] = { x: 750, y: 200 + yOffset };
    });

    setNodePositions(positions);
    setHistory([positions]);
    setHistoryIndex(0);
    setSelectedNodeId(root?.id || null);
  }, [classIndex, methodIndex]);

  const savePositionsToHistory = (newPositions: Record<string, CallGraphPosition>) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newPositions);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodePositions(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodePositions(history[historyIndex + 1]);
    }
  };

  const handleResetLayout = () => {
    const positions: Record<string, CallGraphPosition> = {};
    const root = nodes.find((n) => n.isRoot) || nodes[0];
    if (root) {
      positions[root.id] = { x: 350, y: 200 };
    }

    const callers = nodes.filter((n) => n.depth < 0);
    const callees = nodes.filter((n) => n.depth > 0);

    callers.forEach((node, idx) => {
      const yOffset = (idx - (callers.length - 1) / 2) * 160;
      positions[node.id] = { x: 50, y: 200 + yOffset };
    });

    callees.forEach((node, idx) => {
      const yOffset = (idx - (callees.length - 1) / 2) * 160;
      positions[node.id] = { x: 750, y: 200 + yOffset };
    });

    setNodePositions(positions);
    savePositionsToHistory(positions);
    setZoom(1);
    setPan({ x: 80, y: 150 });
  };

  // Expand Callees for a node
  const handleToggleCalls = (node: CallGraphNodeViewData) => {
    if (node.classIndex === undefined || node.methodIndex === undefined) return;

    if (node.callsExpanded) {
      // Collapse
      const directCalls = il2cppEngine.getCalls(node.classIndex, node.methodIndex);
      const targetIds = directCalls.map((c) => `node_${c.classIndex}_${c.methodIndex}`);

      setEdges((prev) => prev.filter((e) => e.fromNodeId !== node.id));
      setNodes((prev) =>
        prev
          .map((n) => (n.id === node.id ? { ...n, callsExpanded: false } : n))
          .filter((n) => n.isRoot || !targetIds.includes(n.id))
      );
    } else {
      // Expand
      const directCalls = il2cppEngine.getCalls(node.classIndex, node.methodIndex);
      const newNodes = [...nodes];
      const newEdges = [...edges];
      const currentPos = nodePositions[node.id] || { x: 400, y: 200 };
      const newPositions = { ...nodePositions };

      directCalls.forEach((call, idx) => {
        const targetMethod = il2cppEngine.getMethod(call.classIndex, call.methodIndex);
        const targetClass = il2cppEngine.getClass(call.classIndex);
        if (!targetMethod || !targetClass) return;

        const targetId = `node_${call.classIndex}_${call.methodIndex}`;
        const edgeId = `edge_${node.id}_${targetId}`;

        if (!newNodes.some((n) => n.id === targetId)) {
          const callCount = il2cppEngine.getCalls(call.classIndex, call.methodIndex).length;
          const callerCount = il2cppEngine.getCallers(call.classIndex, call.methodIndex).length;

          newNodes.push({
            id: targetId,
            classIndex: call.classIndex,
            methodIndex: call.methodIndex,
            name: targetMethod.name,
            ownerName: `${targetClass.namespaceName ? targetClass.namespaceName + '.' : ''}${targetClass.name}`,
            signature: targetMethod.signature || targetMethod.name,
            address: targetMethod.address || 0x7B42000000,
            addressLabel: targetMethod.address
              ? `0x${targetMethod.address.toString(16).toUpperCase()}`
              : '0x7B42000000',
            rva: targetMethod.rva,
            rvaLabel: targetMethod.rva
              ? `0x${targetMethod.rva.toString(16).toUpperCase()}`
              : undefined,
            isRoot: false,
            canOpen: true,
            depth: node.depth + 1,
            callCount,
            callerCount,
            callsExpanded: false,
            callersExpanded: false,
          });

          const yOffset = (idx - (directCalls.length - 1) / 2) * 160;
          newPositions[targetId] = {
            x: currentPos.x + 380,
            y: currentPos.y + yOffset,
          };
        }

        if (!newEdges.some((e) => e.id === edgeId)) {
          newEdges.push({
            id: edgeId,
            fromNodeId: node.id,
            toNodeId: targetId,
            callSiteRva: call.callSiteRva,
          });
        }
      });

      setNodes(newNodes.map((n) => (n.id === node.id ? { ...n, callsExpanded: true } : n)));
      setEdges(newEdges);
      setNodePositions(newPositions);
      savePositionsToHistory(newPositions);
    }
  };

  // Expand Callers for a node
  const handleToggleCallers = (node: CallGraphNodeViewData) => {
    if (node.classIndex === undefined || node.methodIndex === undefined) return;

    if (node.callersExpanded) {
      // Collapse
      const directCallers = il2cppEngine.getCallers(node.classIndex, node.methodIndex);
      const targetIds = directCallers.map((c) => `node_${c.classIndex}_${c.methodIndex}`);

      setEdges((prev) => prev.filter((e) => e.toNodeId !== node.id));
      setNodes((prev) =>
        prev
          .map((n) => (n.id === node.id ? { ...n, callersExpanded: false } : n))
          .filter((n) => n.isRoot || !targetIds.includes(n.id))
      );
    } else {
      // Expand
      const directCallers = il2cppEngine.getCallers(node.classIndex, node.methodIndex);
      const newNodes = [...nodes];
      const newEdges = [...edges];
      const currentPos = nodePositions[node.id] || { x: 400, y: 200 };
      const newPositions = { ...nodePositions };

      directCallers.forEach((caller, idx) => {
        const callerMethod = il2cppEngine.getMethod(caller.classIndex, caller.methodIndex);
        const callerClass = il2cppEngine.getClass(caller.classIndex);
        if (!callerMethod || !callerClass) return;

        const callerId = `node_${caller.classIndex}_${caller.methodIndex}`;
        const edgeId = `edge_${callerId}_${node.id}`;

        if (!newNodes.some((n) => n.id === callerId)) {
          const callCount = il2cppEngine.getCalls(caller.classIndex, caller.methodIndex).length;
          const callerCount = il2cppEngine.getCallers(caller.classIndex, caller.methodIndex).length;

          newNodes.push({
            id: callerId,
            classIndex: caller.classIndex,
            methodIndex: caller.methodIndex,
            name: callerMethod.name,
            ownerName: `${callerClass.namespaceName ? callerClass.namespaceName + '.' : ''}${callerClass.name}`,
            signature: callerMethod.signature || callerMethod.name,
            address: callerMethod.address || 0x7B42000000,
            addressLabel: callerMethod.address
              ? `0x${callerMethod.address.toString(16).toUpperCase()}`
              : '0x7B42000000',
            rva: callerMethod.rva,
            rvaLabel: callerMethod.rva
              ? `0x${callerMethod.rva.toString(16).toUpperCase()}`
              : undefined,
            isRoot: false,
            canOpen: true,
            depth: node.depth - 1,
            callCount,
            callerCount,
            callsExpanded: false,
            callersExpanded: false,
          });

          const yOffset = (idx - (directCallers.length - 1) / 2) * 160;
          newPositions[callerId] = {
            x: currentPos.x - 380,
            y: currentPos.y + yOffset,
          };
        }

        if (!newEdges.some((e) => e.id === edgeId)) {
          newEdges.push({
            id: edgeId,
            fromNodeId: callerId,
            toNodeId: node.id,
            callSiteRva: caller.callSiteRva,
          });
        }
      });

      setNodes(newNodes.map((n) => (n.id === node.id ? { ...n, callersExpanded: true } : n)));
      setEdges(newEdges);
      setNodePositions(newPositions);
      savePositionsToHistory(newPositions);
    }
  };

  // Close / Remove node from canvas
  const handleCloseNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Mouse pan & drag interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.graph-node')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      const container = containerRef.current?.getBoundingClientRect();
      if (!container) return;

      const newX = (e.clientX - container.left - pan.x) / zoom - dragOffset.x;
      const newY = (e.clientY - container.top - pan.y) / zoom - dragOffset.y;

      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: { x: Math.round(newX), y: Math.round(newY) },
      }));
    }
  }, [isPanning, draggingNodeId, pan.x, pan.y, panStart.x, panStart.y, zoom, dragOffset.x, dragOffset.y]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingNodeId) {
      setDraggingNodeId(null);
      savePositionsToHistory(nodePositions);
    }
  }, [isPanning, draggingNodeId, nodePositions]);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);

    const pos = nodePositions[nodeId] || { x: 0, y: 0 };
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    const mouseX = (e.clientX - container.left - pan.x) / zoom;
    const mouseY = (e.clientY - container.top - pan.y) / zoom;

    setDragOffset({
      x: mouseX - pos.x,
      y: mouseY - pos.y,
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 2.5);
    setZoom(newZoom);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex-1 flex flex-col bg-[#1E1E20] text-[#E2E2E4] relative overflow-hidden select-none">
      {/* Floating Canvas Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center bg-[#141416]/90 border border-[#353535] rounded-xl p-1 shadow-2xl backdrop-blur-md gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          className="p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          className="p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-[#353535] mx-0.5" />
        <button
          onClick={handleResetLayout}
          className="p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white transition-colors"
          title="Reset Layout & Fit"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Undo Position"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Redo Position"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Graph Surface */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(#38383C 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* SVG Bezier Connection Edges */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {edges.map((edge) => {
              const fromPos = nodePositions[edge.fromNodeId];
              const toPos = nodePositions[edge.toNodeId];
              if (!fromPos || !toPos) return null;

              // Node dimensions approx 280x120
              const startX = fromPos.x + 280;
              const startY = fromPos.y + 55;
              const endX = toPos.x;
              const endY = toPos.y + 55;

              const dx = Math.abs(endX - startX) * 0.5;
              const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

              return (
                <g key={edge.id}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="2.5"
                    strokeOpacity="0.8"
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.callSiteRva && (
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 - 8}
                      fill="#A5B4FC"
                      fontSize="10"
                      fontFamily="JetBrains Mono"
                      textAnchor="middle"
                      className="select-none bg-[#1C1C1E]"
                    >
                      {edge.callSiteRva}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Nodes Layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: 300, y: 200 };
            const isSelected = selectedNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  width: '280px',
                }}
                className={`graph-node absolute pointer-events-auto rounded-xl p-3.5 bg-[#1C1C1E] border shadow-xl cursor-move transition-shadow ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-[#222226]'
                    : node.isRoot
                    ? 'border-indigo-500/60 bg-[#1E1E22]'
                    : 'border-[#38383C] hover:border-[#4F4F55]'
                }`}
              >
                {/* Node Header */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {node.isRoot && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        ROOT
                      </span>
                    )}
                    <span className="font-mono-code font-bold text-xs text-white truncate">
                      {node.name}
                    </span>
                  </div>

                  {!node.isRoot && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseNode(node.id);
                      }}
                      className="p-1 rounded text-[#8E8E93] hover:text-white hover:bg-[#353535]"
                      title="Close node"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Owner class */}
                <div className="text-[11px] text-[#8E8E93] truncate font-mono-code mb-2">
                  {node.ownerName}
                </div>

                {/* Address Chips */}
                <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono-code">
                  {node.rvaLabel && (
                    <span className="px-1.5 py-0.5 rounded bg-[#28282A] text-indigo-300 border border-[#3A3A3C]">
                      {node.rvaLabel}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-[#28282A] text-sky-300 border border-[#3A3A3C]">
                    {node.addressLabel}
                  </span>
                </div>

                {/* Expansion Controls Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#2D2D30] text-[11px]">
                  {/* Callers expansion button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCallers(node);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      node.callersExpanded
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-[#8E8E93] hover:text-white hover:bg-[#28282A]'
                    }`}
                    title="Toggle Callers"
                  >
                    <span>Callers ({node.callerCount})</span>
                    {node.callersExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {/* Calls expansion button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCalls(node);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      node.callsExpanded
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-[#8E8E93] hover:text-white hover:bg-[#28282A]'
                    }`}
                    title="Toggle Calls"
                  >
                    <span>Calls ({node.callCount})</span>
                    {node.callsExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Inspector Bottom Sheet */}
      {selectedNode && (
        <div className="bg-[#18181A] border-t border-[#353535] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl z-20 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono-code font-bold text-sm text-white truncate">
                {selectedNode.signature || selectedNode.name}
              </span>
            </div>
            <div className="text-xs text-[#8E8E93] font-mono-code truncate">
              {selectedNode.ownerName} · RVA: {selectedNode.rvaLabel || 'N/A'} · VA:{' '}
              {selectedNode.addressLabel}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedNode.rvaLabel && (
              <button
                onClick={() => onCopyText(selectedNode.rvaLabel!, 'RVA')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#28282A] hover:bg-[#353535] text-xs font-mono-code text-indigo-300 border border-[#3A3A3C] transition-colors"
                title="Copy RVA"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy RVA</span>
              </button>
            )}

            {selectedNode.classIndex !== undefined && selectedNode.methodIndex !== undefined && (
              <>
                <button
                  onClick={() =>
                    onOpenMethodInstructions(
                      selectedNode.classIndex!,
                      selectedNode.methodIndex!
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#323235] hover:bg-[#3E3E42] text-xs font-medium text-white border border-[#444448] transition-colors"
                  title="View Disassembly"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Disasm</span>
                </button>

                <button
                  onClick={() =>
                    onOpenMethodInNewTab(
                      selectedNode.classIndex!,
                      selectedNode.methodIndex!
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-sm transition-colors"
                  title="Open in Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Tab</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
