import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CallGraphNodeViewData,
  CallGraphEdgeViewData,
  CallGraphPosition,
} from '../types';
import { il2cppEngine } from '../services/il2cppEngine';
import {
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Code2,
  Sparkles,
  Crosshair,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface CallGraphViewProps {
  classIndex: number;
  methodIndex: number;
  onOpenMethodInstructions: (classIndex: number, methodIndex: number) => void;
  onOpenMethodInNewTab: (classIndex: number, methodIndex: number) => void;
  onCopyText: (text: string, label: string) => void;
}

const CARD_WIDTH = 280;
const CARD_HEIGHT = 135;
const HORIZONTAL_SPACING = 380;
const VERTICAL_MIN_GAP = 25;
const NODE_TOTAL_HEIGHT = CARD_HEIGHT + VERTICAL_MIN_GAP; // ~160px

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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Undo/Redo history
  const [history, setHistory] = useState<Record<string, CallGraphPosition>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Canvas viewport (pan & zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 100, y: 150 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Two-finger pinch-to-zoom gesture reference
  const pinchRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    graphFocal: { x: number; y: number };
  } | null>(null);

  // Dragging single node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Column-based collision relaxation algorithm
   * Ensures that no two nodes in the same column (depth) overlap vertically.
   */
  const resolveColumnCollisions = useCallback(
    (
      currentNodes: CallGraphNodeViewData[],
      currentEdges: CallGraphEdgeViewData[],
      positions: Record<string, CallGraphPosition>
    ): Record<string, CallGraphPosition> => {
      const newPos: Record<string, CallGraphPosition> = { ...positions };

      // Group nodes by depth column
      const depthGroups: Record<number, CallGraphNodeViewData[]> = {};
      currentNodes.forEach((node) => {
        const depth = node.depth ?? 0;
        if (!depthGroups[depth]) depthGroups[depth] = [];
        depthGroups[depth].push(node);
      });

      // Sort depth keys (from left-most callers to right-most callees)
      const depths = Object.keys(depthGroups)
        .map(Number)
        .sort((a, b) => a - b);

      depths.forEach((depth) => {
        const group = depthGroups[depth];
        const colX = depth * HORIZONTAL_SPACING;

        if (depth === 0) {
          // Root column - if multiple, stack around 0
          group.forEach((node, idx) => {
            const y = (idx - (group.length - 1) / 2) * NODE_TOTAL_HEIGHT;
            newPos[node.id] = { x: colX, y: Math.round(y) };
          });
          return;
        }

        // For other depths, calculate ideal Y based on connected parents/children
        const nodeTargetYs: { node: CallGraphNodeViewData; idealY: number }[] = [];

        group.forEach((node) => {
          let connectedYSum = 0;
          let connectedCount = 0;

          if (depth > 0) {
            // Callee: look at incoming edges from left
            const inEdges = currentEdges.filter((e) => e.toNodeId === node.id);
            inEdges.forEach((edge) => {
              if (newPos[edge.fromNodeId]) {
                connectedYSum += newPos[edge.fromNodeId].y;
                connectedCount++;
              }
            });
          } else {
            // Caller: look at outgoing edges to right
            const outEdges = currentEdges.filter((e) => e.fromNodeId === node.id);
            outEdges.forEach((edge) => {
              if (newPos[edge.toNodeId]) {
                connectedYSum += newPos[edge.toNodeId].y;
                connectedCount++;
              }
            });
          }

          const idealY =
            connectedCount > 0
              ? connectedYSum / connectedCount
              : newPos[node.id]?.y ?? 0;

          nodeTargetYs.push({ node, idealY });
        });

        // Sort nodes in this column by ideal Y
        nodeTargetYs.sort((a, b) => a.idealY - b.idealY);

        // Distribute with minimum gap to prevent any overlap
        const count = nodeTargetYs.length;
        if (count === 1) {
          newPos[nodeTargetYs[0].node.id] = {
            x: colX,
            y: Math.round(nodeTargetYs[0].idealY),
          };
        } else {
          // Forward pass to eliminate overlaps downwards
          const adjustedYs: number[] = [];
          nodeTargetYs.forEach((item, idx) => {
            if (idx === 0) {
              adjustedYs.push(item.idealY);
            } else {
              const prevY = adjustedYs[idx - 1];
              adjustedYs.push(Math.max(item.idealY, prevY + NODE_TOTAL_HEIGHT));
            }
          });

          // Center the column block relative to average ideal Y
          const avgIdeal =
            nodeTargetYs.reduce((sum, item) => sum + item.idealY, 0) / count;
          const avgAdjusted =
            adjustedYs.reduce((sum, y) => sum + y, 0) / count;
          const shift = avgIdeal - avgAdjusted;

          nodeTargetYs.forEach((item, idx) => {
            newPos[item.node.id] = {
              x: colX,
              y: Math.round(adjustedYs[idx] + shift),
            };
          });
        }
      });

      return newPos;
    },
    []
  );

  /**
   * Find a collision-free position for a single node without shifting other nodes
   */
  const findNonOverlappingPosition = useCallback(
    (
      desiredX: number,
      desiredY: number,
      existingPositions: Record<string, CallGraphPosition>
    ): CallGraphPosition => {
      let x = desiredX;
      let y = desiredY;
      let step = 0;
      const maxSteps = 40;

      const overlaps = (px: number, py: number) => {
        for (const pos of Object.values(existingPositions)) {
          if (
            Math.abs(pos.x - px) < CARD_WIDTH + 20 &&
            Math.abs(pos.y - py) < CARD_HEIGHT + 20
          ) {
            return true;
          }
        }
        return false;
      };

      while (overlaps(x, y) && step < maxSteps) {
        step++;
        const offsetMultiplier = Math.ceil(step / 2);
        const direction = step % 2 === 1 ? 1 : -1;
        y = desiredY + direction * offsetMultiplier * NODE_TOTAL_HEIGHT;
      }

      return { x: Math.round(x), y: Math.round(y) };
    },
    []
  );

  /**
   * Center the graph canvas around a target coordinate (or root node)
   */
  const centerGraph = useCallback(
    (targetPos?: { x: number; y: number }, zoomLevel = 1) => {
      const container = containerRef.current;
      const width = container ? container.clientWidth : window.innerWidth;
      const height = container ? container.clientHeight : window.innerHeight;

      const nodeCenterX = (targetPos ? targetPos.x : 0) + CARD_WIDTH / 2;
      const nodeCenterY = (targetPos ? targetPos.y : 0) + CARD_HEIGHT / 2;

      const newPanX = width / 2 - nodeCenterX * zoomLevel;
      const newPanY = height / 2 - nodeCenterY * zoomLevel;

      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
      setZoom(zoomLevel);
    },
    []
  );

  // Initialize graph
  useEffect(() => {
    const data = il2cppEngine.buildCallGraph(classIndex, methodIndex);
    setNodes(data.nodes);
    setEdges(data.edges);

    // Initial tidy layout
    const initialPositions: Record<string, CallGraphPosition> = {};
    const root = data.nodes.find((n) => n.isRoot) || data.nodes[0];

    const rootPos = { x: 0, y: 0 };
    if (root) {
      initialPositions[root.id] = rootPos;
    }

    const otherNodes = data.nodes.filter((n) => n.id !== root?.id);
    otherNodes.forEach((node, idx) => {
      const yOffset = (idx - (otherNodes.length - 1) / 2) * NODE_TOTAL_HEIGHT;
      initialPositions[node.id] = { x: HORIZONTAL_SPACING, y: Math.round(yOffset) };
    });

    const relaxedPositions = resolveColumnCollisions(
      data.nodes,
      data.edges,
      initialPositions
    );

    setNodePositions(relaxedPositions);
    setHistory([relaxedPositions]);
    setHistoryIndex(0);
    setSelectedNodeId(root?.id || null);

    // Auto-center in viewport
    const timer = setTimeout(() => {
      const initialZoom = window.innerWidth < 640 ? 0.75 : window.innerWidth < 1024 ? 0.9 : 1;
      centerGraph(rootPos, initialZoom);
    }, 50);

    return () => clearTimeout(timer);
  }, [classIndex, methodIndex, centerGraph, resolveColumnCollisions]);

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

  // Full Auto-Tidy Layout across all active columns
  const handleAutoTidyLayout = () => {
    const relaxed = resolveColumnCollisions(nodes, edges, nodePositions);
    setNodePositions(relaxed);
    savePositionsToHistory(relaxed);

    const root = nodes.find((n) => n.isRoot) || nodes[0];
    const rootPos = relaxed[root?.id || ''] || { x: 0, y: 0 };
    const fitZoom = window.innerWidth < 640 ? 0.75 : 0.95;
    centerGraph(rootPos, fitZoom);
  };

  // Expand / Collapse Callees for a node
  const handleToggleCalls = (node: CallGraphNodeViewData) => {
    if (node.classIndex === undefined || node.methodIndex === undefined) return;

    if (node.callsExpanded) {
      // Collapse
      const directCalls = il2cppEngine.getCalls(node.classIndex, node.methodIndex);
      const targetIds = directCalls.map((c) => `node_${c.classIndex}_${c.methodIndex}`);

      // Filter out edges originating from this node
      const remainingEdges = edges.filter((e) => e.fromNodeId !== node.id);

      // Keep nodes if they are still connected to other remaining edges or are root
      const nodesToKeep = nodes
        .map((n) => (n.id === node.id ? { ...n, callsExpanded: false } : n))
        .filter((n) => {
          if (n.isRoot) return true;
          if (!targetIds.includes(n.id)) return true;
          return remainingEdges.some((e) => e.fromNodeId === n.id || e.toNodeId === n.id);
        });

      setEdges(remainingEdges);
      setNodes(nodesToKeep);

      // Clean up unreferenced positions
      const newPos: Record<string, CallGraphPosition> = {};
      nodesToKeep.forEach((n) => {
        if (nodePositions[n.id]) newPos[n.id] = nodePositions[n.id];
      });
      setNodePositions(newPos);
      savePositionsToHistory(newPos);
    } else {
      // Expand
      const directCalls = il2cppEngine.getCalls(node.classIndex, node.methodIndex);
      const newNodes = [...nodes];
      const newEdges = [...edges];
      const currentPos = nodePositions[node.id] || { x: 0, y: 0 };
      let newPositions = { ...nodePositions };
      const currentDepth = node.depth ?? 0;
      const targetDepth = currentDepth + 1;

      directCalls.forEach((call, idx) => {
        const targetMethod = il2cppEngine.getMethod(call.classIndex, call.methodIndex);
        const targetClass = il2cppEngine.getClass(call.classIndex);
        if (!targetMethod || !targetClass) return;

        const targetId = `node_${call.classIndex}_${call.methodIndex}`;
        const edgeId = `edge_${node.id}_${targetId}`;

        // If node already exists on canvas, just create the connecting edge without duplicating card
        const existingNodeIndex = newNodes.findIndex((n) => n.id === targetId);

        if (existingNodeIndex === -1) {
          const callCount = il2cppEngine.getCalls(call.classIndex, call.methodIndex).length;
          const callerCount = il2cppEngine.getCallers(call.classIndex, call.methodIndex).length;

          newNodes.push({
            id: targetId,
            classIndex: call.classIndex,
            methodIndex: call.methodIndex,
            name: targetMethod.name,
            ownerName: `${targetClass.namespaceName ? targetClass.namespaceName + '.' : ''}${targetClass.name}`,
            signature: targetMethod.signature || targetMethod.name,
            address: targetMethod.address || 0x7b42000000,
            addressLabel: targetMethod.address
              ? `0x${targetMethod.address.toString(16).toUpperCase()}`
              : '0x7B42000000',
            rva: targetMethod.rva,
            rvaLabel: targetMethod.rva
              ? `0x${targetMethod.rva.toString(16).toUpperCase()}`
              : undefined,
            isRoot: false,
            canOpen: true,
            depth: targetDepth,
            callCount,
            callerCount,
            callsExpanded: false,
            callersExpanded: false,
          });

          const desiredX = targetDepth * HORIZONTAL_SPACING;
          const yOffset = (idx - (directCalls.length - 1) / 2) * NODE_TOTAL_HEIGHT;
          const targetPos = findNonOverlappingPosition(
            desiredX,
            currentPos.y + yOffset,
            newPositions
          );
          newPositions[targetId] = targetPos;
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

      const updatedNodes = newNodes.map((n) =>
        n.id === node.id ? { ...n, callsExpanded: true } : n
      );

      // Relax layout to maintain neat vertical alignment
      const relaxed = resolveColumnCollisions(updatedNodes, newEdges, newPositions);

      setNodes(updatedNodes);
      setEdges(newEdges);
      setNodePositions(relaxed);
      savePositionsToHistory(relaxed);
    }
  };

  // Expand / Collapse Callers for a node
  const handleToggleCallers = (node: CallGraphNodeViewData) => {
    if (node.classIndex === undefined || node.methodIndex === undefined) return;

    if (node.callersExpanded) {
      // Collapse
      const directCallers = il2cppEngine.getCallers(node.classIndex, node.methodIndex);
      const targetIds = directCallers.map((c) => `node_${c.classIndex}_${c.methodIndex}`);

      const remainingEdges = edges.filter((e) => e.toNodeId !== node.id);

      const nodesToKeep = nodes
        .map((n) => (n.id === node.id ? { ...n, callersExpanded: false } : n))
        .filter((n) => {
          if (n.isRoot) return true;
          if (!targetIds.includes(n.id)) return true;
          return remainingEdges.some((e) => e.fromNodeId === n.id || e.toNodeId === n.id);
        });

      setEdges(remainingEdges);
      setNodes(nodesToKeep);

      const newPos: Record<string, CallGraphPosition> = {};
      nodesToKeep.forEach((n) => {
        if (nodePositions[n.id]) newPos[n.id] = nodePositions[n.id];
      });
      setNodePositions(newPos);
      savePositionsToHistory(newPos);
    } else {
      // Expand
      const directCallers = il2cppEngine.getCallers(node.classIndex, node.methodIndex);
      const newNodes = [...nodes];
      const newEdges = [...edges];
      const currentPos = nodePositions[node.id] || { x: 0, y: 0 };
      let newPositions = { ...nodePositions };
      const currentDepth = node.depth ?? 0;
      const targetDepth = currentDepth - 1;

      directCallers.forEach((caller, idx) => {
        const callerMethod = il2cppEngine.getMethod(caller.classIndex, caller.methodIndex);
        const callerClass = il2cppEngine.getClass(caller.classIndex);
        if (!callerMethod || !callerClass) return;

        const callerId = `node_${caller.classIndex}_${caller.methodIndex}`;
        const edgeId = `edge_${callerId}_${node.id}`;

        const existingNodeIndex = newNodes.findIndex((n) => n.id === callerId);

        if (existingNodeIndex === -1) {
          const callCount = il2cppEngine.getCalls(caller.classIndex, caller.methodIndex).length;
          const callerCount = il2cppEngine.getCallers(caller.classIndex, caller.methodIndex).length;

          newNodes.push({
            id: callerId,
            classIndex: caller.classIndex,
            methodIndex: caller.methodIndex,
            name: callerMethod.name,
            ownerName: `${callerClass.namespaceName ? callerClass.namespaceName + '.' : ''}${callerClass.name}`,
            signature: callerMethod.signature || callerMethod.name,
            address: callerMethod.address || 0x7b42000000,
            addressLabel: callerMethod.address
              ? `0x${callerMethod.address.toString(16).toUpperCase()}`
              : '0x7B42000000',
            rva: callerMethod.rva,
            rvaLabel: callerMethod.rva
              ? `0x${callerMethod.rva.toString(16).toUpperCase()}`
              : undefined,
            isRoot: false,
            canOpen: true,
            depth: targetDepth,
            callCount,
            callerCount,
            callsExpanded: false,
            callersExpanded: false,
          });

          const desiredX = targetDepth * HORIZONTAL_SPACING;
          const yOffset = (idx - (directCallers.length - 1) / 2) * NODE_TOTAL_HEIGHT;
          const targetPos = findNonOverlappingPosition(
            desiredX,
            currentPos.y + yOffset,
            newPositions
          );
          newPositions[callerId] = targetPos;
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

      const updatedNodes = newNodes.map((n) =>
        n.id === node.id ? { ...n, callersExpanded: true } : n
      );

      const relaxed = resolveColumnCollisions(updatedNodes, newEdges, newPositions);

      setNodes(updatedNodes);
      setEdges(newEdges);
      setNodePositions(relaxed);
      savePositionsToHistory(relaxed);
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

  // Center on a specific node
  const handleFocusNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const pos = nodePositions[nodeId];
    if (pos) {
      centerGraph(pos, zoom);
    }
  };

  // Mouse & Touch Pan and Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.graph-node') || (e.target as HTMLElement).closest('.graph-btn')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Multi-touch two-finger pinch zoom
      setIsPanning(false);
      setDraggingNodeId(null);

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);

      const containerRect = containerRef.current?.getBoundingClientRect();
      const containerLeft = containerRect?.left ?? 0;
      const containerTop = containerRect?.top ?? 0;

      const screenFocalX = (touch1.clientX + touch2.clientX) / 2 - containerLeft;
      const screenFocalY = (touch1.clientY + touch2.clientY) / 2 - containerTop;

      // Coordinate in the graph virtual space under the pinch center
      const graphFocalX = (screenFocalX - pan.x) / zoom;
      const graphFocalY = (screenFocalY - pan.y) / zoom;

      pinchRef.current = {
        initialDist: Math.max(dist, 1),
        initialZoom: zoom,
        initialPan: { ...pan },
        graphFocal: { x: graphFocalX, y: graphFocalY },
      };
      return;
    }

    if ((e.target as HTMLElement).closest('.graph-node') || (e.target as HTMLElement).closest('.graph-btn')) {
      return;
    }

    if (e.touches.length === 1) {
      pinchRef.current = null;
      setIsPanning(true);
      setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [isPanning, draggingNodeId, pan.x, pan.y, panStart.x, panStart.y, zoom, dragOffset.x, dragOffset.y]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const { initialDist, initialZoom, graphFocal } = pinchRef.current;

        const scale = currentDist / initialDist;
        const newZoom = Math.min(Math.max(initialZoom * scale, 0.35), 2.5);

        const containerRect = containerRef.current?.getBoundingClientRect();
        const containerLeft = containerRect?.left ?? 0;
        const containerTop = containerRect?.top ?? 0;

        const currentFocalX = (touch1.clientX + touch2.clientX) / 2 - containerLeft;
        const currentFocalY = (touch1.clientY + touch2.clientY) / 2 - containerTop;

        // Keep the graph anchor coordinate under the two fingers
        const newPanX = currentFocalX - graphFocal.x * newZoom;
        const newPanY = currentFocalY - graphFocal.y * newZoom;

        setZoom(newZoom);
        setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
        return;
      }

      if (isPanning && e.touches.length === 1) {
        setPan({
          x: Math.round(e.touches[0].clientX - panStart.x),
          y: Math.round(e.touches[0].clientY - panStart.y),
        });
      } else if (draggingNodeId && e.touches.length === 1) {
        const container = containerRef.current?.getBoundingClientRect();
        if (!container) return;

        const newX = (e.touches[0].clientX - container.left - pan.x) / zoom - dragOffset.x;
        const newY = (e.touches[0].clientY - container.top - pan.y) / zoom - dragOffset.y;

        setNodePositions((prev) => ({
          ...prev,
          [draggingNodeId]: { x: Math.round(newX), y: Math.round(newY) },
        }));
      }
    },
    [isPanning, draggingNodeId, pan.x, pan.y, panStart.x, panStart.y, zoom, dragOffset.x, dragOffset.y]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingNodeId) {
      setDraggingNodeId(null);
      savePositionsToHistory(nodePositions);
    }
  }, [isPanning, draggingNodeId, nodePositions]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 0) {
        pinchRef.current = null;
        setIsPanning(false);
        if (draggingNodeId) {
          setDraggingNodeId(null);
          savePositionsToHistory(nodePositions);
        }
      } else if (e.touches.length === 1) {
        // Smoothly transition from two fingers back to single finger pan
        pinchRef.current = null;
        if (isPanning) {
          setPanStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
        }
      }
    },
    [draggingNodeId, isPanning, nodePositions, pan.x, pan.y]
  );

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
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

  const handleNodeTouchStart = (e: React.TouchEvent, nodeId: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.touches.length > 1) {
      // Allow multi-finger pinch to bubble to canvas
      return;
    }
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);

    const pos = nodePositions[nodeId] || { x: 0, y: 0 };
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;

    const touchX = (e.touches[0].clientX - container.left - pan.x) / zoom;
    const touchY = (e.touches[0].clientY - container.top - pan.y) / zoom;

    setDragOffset({
      x: touchX - pos.x,
      y: touchY - pos.y,
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 2.5);
    setZoom(newZoom);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Connected edges and neighbor IDs for active highlighting
  const connectedEdgeIds = useMemo(() => {
    const activeId = hoveredNodeId || selectedNodeId;
    if (!activeId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach((e) => {
      if (e.fromNodeId === activeId || e.toNodeId === activeId) {
        set.add(e.id);
      }
    });
    return set;
  }, [hoveredNodeId, selectedNodeId, edges]);

  const connectedNeighborIds = useMemo(() => {
    const activeId = hoveredNodeId || selectedNodeId;
    if (!activeId) return new Set<string>();
    const set = new Set<string>();
    set.add(activeId);
    edges.forEach((e) => {
      if (e.fromNodeId === activeId) set.add(e.toNodeId);
      if (e.toNodeId === activeId) set.add(e.fromNodeId);
    });
    return set;
  }, [hoveredNodeId, selectedNodeId, edges]);

  // Root node helper
  const rootNode = nodes.find((n) => n.isRoot) || nodes[0];

  return (
    <div className="flex-1 flex flex-col bg-[#161618] text-[#E2E2E4] relative overflow-hidden select-none">
      {/* Floating Canvas Top Bar Controls */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex flex-wrap items-center bg-[#141416]/95 border border-[#353535] rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-2xl backdrop-blur-md gap-0.5 sm:gap-1.5 max-w-[calc(100vw-24px)]">
        {/* Zoom Controls */}
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <span className="text-[10px] sm:text-xs font-mono font-bold text-[#A1A1AA] px-1 select-none min-w-[34px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.35))}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="h-4 w-[1px] bg-[#353535] mx-0.5" />

        {/* Center & Fit */}
        <button
          onClick={() => {
            const rootPos = nodePositions[rootNode?.id || ''] || { x: 0, y: 0 };
            const fitZoom = window.innerWidth < 640 ? 0.75 : 0.95;
            centerGraph(rootPos, fitZoom);
          }}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white transition-colors flex items-center gap-1"
          title="Center on Root Node"
        >
          <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          <span className="text-[10px] sm:text-xs font-semibold hidden md:inline">Center</span>
        </button>

        {/* Auto-Tidy Layout */}
        <button
          onClick={handleAutoTidyLayout}
          className="p-1.5 sm:p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center gap-1"
          title="Auto-Tidy Column Layout (No Overlap)"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />
          <span className="text-[10px] sm:text-xs font-semibold hidden sm:inline">Auto-Tidy</span>
        </button>

        <div className="h-4 w-[1px] bg-[#353535] mx-0.5" />

        {/* Undo / Redo */}
        <button
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Undo Position"
        >
          <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-[#28282A] text-[#8E8E93] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          title="Redo Position"
        >
          <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Top-Right Canvas Info Legend */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 hidden md:flex items-center gap-2 bg-[#141416]/90 border border-[#353535] rounded-xl px-3 py-1.5 text-[11px] font-mono shadow-xl backdrop-blur-md text-[#8E8E93]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Root ({nodes.filter((n) => n.isRoot).length})
        </span>
        <span className="text-[#444]">•</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> Callers
        </span>
        <span className="text-[#444]">•</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" /> Calls
        </span>
        <span className="text-[#444]">•</span>
        <span className="text-white font-bold">{nodes.length} Nodes</span>
      </div>

      {/* Interactive Graph Surface */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden touch-none"
        style={{
          backgroundImage: `radial-gradient(#303034 1.2px, transparent 1.2px)`,
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
              id="arrowhead-default"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#38BDF8" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {edges.map((edge) => {
              const fromPos = nodePositions[edge.fromNodeId];
              const toPos = nodePositions[edge.toNodeId];
              if (!fromPos || !toPos) return null;

              const isEdgeActive = connectedEdgeIds.has(edge.id);

              // Standard card dimension connection ports
              const startX = fromPos.x + CARD_WIDTH;
              const startY = fromPos.y + 60;
              const endX = toPos.x;
              const endY = toPos.y + 60;

              const dx = Math.max(Math.abs(endX - startX) * 0.45, 60);
              const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

              return (
                <g key={edge.id} className="transition-opacity duration-150">
                  {/* Outer glow line for active path */}
                  {isEdgeActive && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="6"
                      strokeOpacity="0.3"
                    />
                  )}

                  {/* Main Bezier Line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isEdgeActive ? '#38BDF8' : '#4F46E5'}
                    strokeWidth={isEdgeActive ? '3' : '2'}
                    strokeOpacity={isEdgeActive ? 1 : 0.75}
                    markerEnd={isEdgeActive ? 'url(#arrowhead-active)' : 'url(#arrowhead-default)'}
                  />

                  {/* Call Site RVA Chip */}
                  {edge.callSiteRva && (
                    <g transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2})`}>
                      <rect
                        x="-30"
                        y="-10"
                        width="60"
                        height="16"
                        rx="4"
                        fill="#18181B"
                        stroke={isEdgeActive ? '#38BDF8' : '#3F3F46'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="2"
                        fill={isEdgeActive ? '#E0F2FE' : '#A5B4FC'}
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="select-none"
                      >
                        {edge.callSiteRva}
                      </text>
                    </g>
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
            const pos = nodePositions[node.id] || { x: 0, y: 0 };
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isConnected = connectedNeighborIds.has(node.id);

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onTouchStart={(e) => handleNodeTouchStart(e, node.id)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  width: `${CARD_WIDTH}px`,
                  minHeight: `${CARD_HEIGHT}px`,
                }}
                className={`graph-node absolute pointer-events-auto rounded-xl p-3 bg-[#1C1C1F] border shadow-2xl cursor-move transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-[#222228]'
                    : isHovered || isConnected
                    ? 'border-sky-500/80 bg-[#1E2026]'
                    : node.isRoot
                    ? 'border-indigo-500/70 bg-[#1E1E24]'
                    : 'border-[#333338] hover:border-[#4B4B52]'
                }`}
              >
                <div>
                  {/* Node Header */}
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {node.isRoot ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shrink-0">
                          ROOT
                        </span>
                      ) : (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            node.depth < 0 ? 'bg-purple-400' : 'bg-sky-400'
                          }`}
                        />
                      )}
                      <span
                        className="font-mono font-bold text-[11px] sm:text-xs text-white truncate"
                        title={node.name}
                      >
                        {node.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Focus button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFocusNode(node.id);
                        }}
                        className="graph-btn p-1 rounded text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
                        title="Focus & Center"
                      >
                        <Crosshair className="w-3 h-3" />
                      </button>

                      {/* Close button (non-root only) */}
                      {!node.isRoot && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseNode(node.id);
                          }}
                          className="graph-btn p-1 rounded text-[#8E8E93] hover:text-red-300 hover:bg-red-500/20 transition-colors"
                          title="Close node"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Owner Class & Namespace */}
                  <div
                    className="text-[10px] text-[#8E8E93] truncate font-mono mb-2"
                    title={node.ownerName}
                  >
                    {node.ownerName}
                  </div>

                  {/* Offset & Address Badges */}
                  <div className="flex items-center flex-wrap gap-1.5 mb-2 text-[9px] font-mono">
                    {node.rvaLabel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyText(node.rvaLabel!, 'RVA');
                          setCopiedId(`${node.id}_rva`);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#252528] hover:bg-[#2E2E33] text-indigo-300 border border-[#3A3A3E] transition-colors flex items-center gap-1"
                        title="Click to copy RVA"
                      >
                        {copiedId === `${node.id}_rva` ? (
                          <Check className="w-2.5 h-2.5 text-green-400" />
                        ) : null}
                        <span>{node.rvaLabel}</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyText(node.addressLabel, 'VA');
                        setCopiedId(`${node.id}_va`);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      className="px-1.5 py-0.5 rounded bg-[#252528] hover:bg-[#2E2E33] text-sky-300 border border-[#3A3A3E] transition-colors flex items-center gap-1"
                      title="Click to copy VA"
                    >
                      {copiedId === `${node.id}_va` ? (
                        <Check className="w-2.5 h-2.5 text-green-400" />
                      ) : null}
                      <span>{node.addressLabel}</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Expansion Controls */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#2A2A2E] text-[10px] sm:text-[11px]">
                  {/* Callers (Left / Incoming) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCallers(node);
                    }}
                    className={`graph-btn flex items-center gap-1 px-1.5 py-1 rounded transition-colors ${
                      node.callersExpanded
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                        : 'text-[#8E8E93] hover:text-white hover:bg-[#28282A]'
                    }`}
                    title="Toggle Callers"
                  >
                    <ArrowLeft className="w-2.5 h-2.5" />
                    <span>Callers ({node.callerCount})</span>
                    {node.callersExpanded ? (
                      <ChevronUp className="w-2.5 h-2.5" />
                    ) : (
                      <ChevronDown className="w-2.5 h-2.5" />
                    )}
                  </button>

                  {/* Calls (Right / Outgoing) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCalls(node);
                    }}
                    className={`graph-btn flex items-center gap-1 px-1.5 py-1 rounded transition-colors ${
                      node.callsExpanded
                        ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                        : 'text-[#8E8E93] hover:text-white hover:bg-[#28282A]'
                    }`}
                    title="Toggle Calls"
                  >
                    <span>Calls ({node.callCount})</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                    {node.callsExpanded ? (
                      <ChevronUp className="w-2.5 h-2.5" />
                    ) : (
                      <ChevronDown className="w-2.5 h-2.5" />
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
        <div className="bg-[#18181A] border-t border-[#353535] p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-2xl z-20 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono font-bold text-xs sm:text-sm text-white truncate">
                {selectedNode.signature || selectedNode.name}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-[#8E8E93] font-mono truncate">
              {selectedNode.ownerName} · RVA: {selectedNode.rvaLabel || 'N/A'} · VA:{' '}
              {selectedNode.addressLabel}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {selectedNode.rvaLabel && (
              <button
                onClick={() => onCopyText(selectedNode.rvaLabel!, 'RVA')}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#28282A] hover:bg-[#353535] text-[11px] sm:text-xs font-mono text-indigo-300 border border-[#3A3A3C] transition-colors"
                title="Copy RVA"
              >
                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#323235] hover:bg-[#3E3E42] text-[11px] sm:text-xs font-medium text-white border border-[#444448] transition-colors"
                  title="View Disassembly"
                >
                  <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Disasm</span>
                </button>

                <button
                  onClick={() =>
                    onOpenMethodInNewTab(
                      selectedNode.classIndex!,
                      selectedNode.methodIndex!
                    )
                  }
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] sm:text-xs font-medium text-white shadow-sm transition-colors"
                  title="Open in Tab"
                >
                  <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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

