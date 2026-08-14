'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GraphData, GraphNode, GraphEdge } from '@/lib/types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Code,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  X,
} from 'lucide-react';

interface InteractiveGraphProps {
  data: GraphData;
  onNodeSelect?: (node: GraphNode) => void;
}

const TYPE_COLORS: Record<string, string> = {
  Candidate: '#818cf8', // Indigo
  Job: '#34d399', // Emerald
  Skill: '#fbbf24', // Amber
  Company: '#60a5fa', // Blue
  Project: '#f472b6', // Pink
  Course: '#22d3ee', // Cyan
  Technology: '#2dd4bf', // Teal
};

export default function InteractiveGraph({ data, onNodeSelect }: InteractiveGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Transform & Viewport State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [showQueryDrawer, setShowQueryDrawer] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>('All');

  // Compute node positions using force layout positioning simulation
  const layoutNodes = useMemo(() => {
    if (!data.nodes || data.nodes.length === 0) return [];

    const nodes = data.nodes.map((node, i) => {
      // Calculate polar coordinates for initial layout ring based on type
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      let radius = 180;
      if (node.type === 'Candidate') radius = 0; // Center
      else if (node.type === 'Project') radius = 120;
      else if (node.type === 'Skill') radius = 220;
      else if (node.type === 'Job') radius = 320;
      else if (node.type === 'Company') radius = 400;

      return {
        ...node,
        x: Math.cos(angle) * radius + (Math.random() * 20 - 10),
        y: Math.sin(angle) * radius + (Math.random() * 20 - 10),
      };
    });

    // Run simple force relaxation iterations
    for (let iter = 0; iter < 40; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 100) {
            const force = (100 - dist) / 2;
            nodes[i].x -= (dx / dist) * force * 0.2;
            nodes[i].y -= (dy / dist) * force * 0.2;
            nodes[j].x += (dx / dist) * force * 0.2;
            nodes[j].y += (dy / dist) * force * 0.2;
          }
        }
      }
    }

    return nodes;
  }, [data.nodes]);

  // Filtered nodes & edges
  const activeNodes = useMemo(() => {
    if (filterType === 'All') return layoutNodes;
    return layoutNodes.filter((n) => n.type === filterType);
  }, [layoutNodes, filterType]);

  const activeNodeIds = useMemo(() => new Set(activeNodes.map((n) => n.id)), [activeNodes]);

  const activeEdges = useMemo(() => {
    return (data.edges || []).filter(
      (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
    );
  }, [data.edges, activeNodeIds]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle HiDPI Crisp Canvas Rendering
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear Screen
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center origin
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Node position map
    const posMap = new Map<string, { x: number; y: number }>();
    activeNodes.forEach((n) => posMap.set(n.id, { x: n.x, y: n.y }));

    // 1. Draw Edges / Relationships
    activeEdges.forEach((edge) => {
      const src = posMap.get(edge.source);
      const tgt = posMap.get(edge.target);
      if (!src || !tgt) return;

      const isHighlighted =
        selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isHighlighted ? '#818cf8' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = isHighlighted ? 2.5 : 1;
      ctx.stroke();

      // Relationship Direction Arrow
      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2;
      const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.fillStyle = isHighlighted ? '#818cf8' : 'rgba(148, 163, 184, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6, -4);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();

      // Relationship Label
      ctx.fillStyle = isHighlighted ? '#e2e8f0' : 'rgba(148, 163, 184, 0.6)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(edge.label, 0, -6);
      ctx.restore();
    });

    // 2. Draw Nodes
    activeNodes.forEach((node) => {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const color = TYPE_COLORS[node.type] || '#94a3b8';
      const radius = node.type === 'Candidate' ? 22 : node.type === 'Job' ? 18 : 14;

      // Glow effect for selected or hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}40`;
        ctx.fill();
      }

      // Outer Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(15, 23, 42, 0.8)';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.stroke();

      // Node Label
      ctx.fillStyle = isSelected ? '#ffffff' : '#f1f5f9';
      ctx.font = `${isSelected ? 'bold 11px' : '10px'} sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + radius + 12);
    });

    ctx.restore();
  }, [activeNodes, activeEdges, zoom, pan, selectedNode, hoveredNode]);

  // Pointer Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    // Hover hit test
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - canvas.clientWidth / 2 - pan.x;
    const mouseY = e.clientY - rect.top - canvas.clientHeight / 2 - pan.y;

    const hitNode = activeNodes.find((n) => {
      const dx = n.x * zoom - mouseX;
      const dy = n.y * zoom - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < 20 * zoom;
    });

    setHoveredNode(hitNode || null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - canvas.clientWidth / 2 - pan.x;
    const mouseY = e.clientY - rect.top - canvas.clientHeight / 2 - pan.y;

    const hitNode = activeNodes.find((n) => {
      const dx = n.x * zoom - mouseX;
      const dy = n.y * zoom - mouseY;
      return Math.sqrt(dx * dx + dy * dy) < 20 * zoom;
    });

    if (hitNode) {
      setSelectedNode(hitNode);
      if (onNodeSelect) onNodeSelect(hitNode);
    } else {
      setSelectedNode(null);
    }
  };

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      {/* Top Toolbar Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
          title="Zoom In"
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
          title="Zoom Out"
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setSelectedNode(null);
          }}
          title="Reset View"
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Filter Node Type Pills */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-800 text-xs text-slate-200 font-semibold px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none"
        >
          <option value="All">All Nodes ({activeNodes.length})</option>
          <option value="Candidate">Candidate</option>
          <option value="Job">Job</option>
          <option value="Skill">Skill</option>
          <option value="Project">Project</option>
          <option value="Company">Company</option>
          <option value="Course">Course</option>
        </select>
      </div>

      {/* Cypher Traversal Inspector Trigger */}
      <button
        onClick={() => setShowQueryDrawer(!showQueryDrawer)}
        className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold backdrop-blur-md transition-all glow-primary cursor-pointer"
      >
        <Code className="w-3.5 h-3.5" />
        <span>openCypher Details</span>
      </button>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Legend Footer */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-300 font-medium text-[11px]">{type}</span>
          </div>
        ))}
      </div>

      {/* Selected Node Inspector Sidepanel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-10 w-72 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span
              className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-slate-950 font-mono"
              style={{ backgroundColor: TYPE_COLORS[selectedNode.type] || '#818cf8' }}
            >
              {selectedNode.type}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="font-bold text-slate-100 text-sm mb-1">{selectedNode.label}</h4>
          <p className="text-xs text-slate-400 mb-3 line-clamp-2">
            {selectedNode.properties?.description || selectedNode.properties?.headline || 'Graph Node in CareerGraph'}
          </p>

          <div className="space-y-1 text-[11px] text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            {Object.entries(selectedNode.properties)
              .filter(([k]) => !k.startsWith('_') && k !== 'description' && k !== 'name' && k !== 'title')
              .slice(0, 4)
              .map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-500">{key}:</span>
                  <span className="text-indigo-300 truncate max-w-[140px]">{String(val)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* openCypher Query Details Drawer */}
      {showQueryDrawer && (
        <div className="absolute inset-y-0 right-0 z-20 w-96 bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>openCypher Traversal Details</span>
              </h3>
              <button
                onClick={() => setShowQueryDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Graph Traversal Pattern:
                </label>
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs font-mono text-indigo-300 leading-relaxed">
                  Candidate → BUILT → Project → USES_SKILL → Skill ← REQUIRES - Job
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Executed Cypher Query:
                </label>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {data.queryMetadata?.cypherQuery || `MATCH (c:Candidate {id: $candidateId})\n  -[:BUILT]->(p:Project)\n  -[:USES_SKILL]->(s:Skill)\n  <-[:REQUIRES]-(j:Job)\nRETURN j, p, s;`}
                </pre>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Graph Metric Summary:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                    <div className="text-slate-400 text-[10px]">Total Nodes</div>
                    <div className="text-lg font-bold text-white">{data.nodes.length}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                    <div className="text-slate-400 text-[10px]">Relationships</div>
                    <div className="text-lg font-bold text-indigo-400">{data.edges.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Powered by CognoDB Bolt Protocol</span>
          </div>
        </div>
      )}
    </div>
  );
}
