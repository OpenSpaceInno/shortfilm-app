import { useState, useRef, useMemo } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  Film,
  GitBranch,
  Layers,
  Move,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  User,
  Vote,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import {
  type StoryNode,
  type StoryNodeType,
} from "@/lib/story-engine-data";

interface VisualGraphProps {
  nodes: StoryNode[];
  selectedNodeId: string | null;
  onSelectNode: (node: StoryNode) => void;
  onAddNodeAt?: (x: number, y: number) => void;
  activePathHighlight?: string[]; // list of node IDs currently active in path testing
}

export function VisualGraph({
  nodes,
  selectedNodeId,
  onSelectNode,
  activePathHighlight = [],
}: VisualGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Compute bounding box of all nodes
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, maxX: 800, minY: 0, maxY: 1000 };
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x + 240);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y + 120);
    });
    return { minX, maxX, minY, maxY };
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking the canvas background
    if ((e.target as HTMLElement).closest(".story-node-card")) return;
    setIsDraggingCanvas(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCanvas) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const fitToScreen = () => {
    setZoom(0.85);
    setPan({ x: 40, y: 20 });
  };

  // Node Map for looking up connections
  const nodeMap = useMemo(() => {
    const map = new Map<string, StoryNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Compute connections for SVG drawing
  const connections = useMemo(() => {
    const list: {
      fromId: string;
      toId: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      label?: string;
      color?: string;
      isHighlighted: boolean;
    }[] = [];

    nodes.forEach((source) => {
      const sourceWidth = 230;
      const sourceHeight = 90;
      const sx = source.x + sourceWidth / 2;
      const sy = source.y + sourceHeight;

      if (source.type === "Choice" && source.choiceConfig) {
        source.choiceConfig.options.forEach((opt, idx) => {
          const target = nodeMap.get(opt.destinationNodeId);
          if (target) {
            const tx = target.x + sourceWidth / 2;
            const ty = target.y;
            const isHighlighted =
              activePathHighlight.includes(source.id) &&
              activePathHighlight.includes(target.id);

            list.push({
              fromId: source.id,
              toId: target.id,
              x1: sx,
              y1: sy,
              x2: tx,
              y2: ty,
              label: `${opt.label}: ${opt.votePercentage ?? (idx === 0 ? 64 : 36)}%`,
              color: idx === 0 ? "hsl(var(--primary))" : "hsl(var(--accent, 260 80% 60%))",
              isHighlighted,
            });
          }
        });
      } else if (source.nextNodeId) {
        const target = nodeMap.get(source.nextNodeId);
        if (target) {
          const tx = target.x + sourceWidth / 2;
          const ty = target.y;
          const isHighlighted =
            activePathHighlight.includes(source.id) &&
            activePathHighlight.includes(target.id);

          list.push({
            fromId: source.id,
            toId: target.id,
            x1: sx,
            y1: sy,
            x2: tx,
            y2: ty,
            isHighlighted,
          });
        }
      }
    });

    return list;
  }, [nodes, nodeMap, activePathHighlight]);

  const getNodeColor = (type: StoryNodeType) => {
    switch (type) {
      case "Choice":
        return "border-amber-500/50 bg-amber-500/10 text-amber-400";
      case "Ending":
        return "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
      case "Branch":
        return "border-sky-500/50 bg-sky-500/10 text-sky-400";
      default:
        return "border-primary/40 bg-card text-primary";
    }
  };

  const getNodeBadge = (type: StoryNodeType) => {
    switch (type) {
      case "Choice":
        return { label: "AUDIENCE CHOICE", icon: Vote, color: "bg-amber-500/20 text-amber-300" };
      case "Ending":
        return { label: "STORY ENDING", icon: Trophy, color: "bg-emerald-500/20 text-emerald-300" };
      case "Branch":
        return { label: "BRANCH NODE", icon: GitBranch, color: "bg-sky-500/20 text-sky-300" };
      default:
        return { label: "EPISODE", icon: Film, color: "bg-primary/20 text-primary" };
    }
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[650px] overflow-hidden rounded-2xl border border-border bg-[#0B0D13] select-none ${
        isDraggingCanvas ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)`,
        backgroundSize: "28px 28px",
      }}
    >
      {/* Floating Canvas Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-xl border border-border bg-card/90 p-1.5 backdrop-blur-md shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
          className="grid size-7 place-items-center rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="size-4" />
        </button>
        <span className="px-1 text-[11px] font-mono text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="grid size-7 place-items-center rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="size-4" />
        </button>
        <div className="h-4 w-px bg-border mx-0.5" />
        <button
          onClick={resetView}
          className="grid size-7 place-items-center rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <button
          onClick={fitToScreen}
          className="grid size-7 place-items-center rounded-lg hover:bg-muted text-foreground transition-colors"
          title="Fit Graph to Screen"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-xl border border-border bg-card/85 px-3 py-1.5 backdrop-blur-md text-[11px] shadow-lg">
        <span className="flex items-center gap-1 text-primary">
          <span className="size-2 rounded-full bg-primary" /> Episode
        </span>
        <span className="flex items-center gap-1 text-amber-400">
          <span className="size-2 rounded-full bg-amber-400" /> Choice Point
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-400" /> Ending
        </span>
      </div>

      {/* Canvas Viewport with Pan and Zoom */}
      <div
        className="absolute inset-0 origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: "2000px",
          height: "2000px",
        }}
      >
        {/* SVG Connection Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: "visible" }}
        >
          <defs>
            <marker
              id="arrowhead-default"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="rgba(148, 163, 184, 0.6)" />
            </marker>
            <marker
              id="arrowhead-highlight"
              markerWidth="9"
              markerHeight="7"
              refX="8"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 9 3.5, 0 7" fill="hsl(var(--primary))" />
            </marker>
            <marker
              id="arrowhead-amber"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#F59E0B" />
            </marker>
          </defs>

          {connections.map((conn, idx) => {
            const dy = conn.y2 - conn.y1;
            const midY = conn.y1 + dy / 2;
            const pathData = `M ${conn.x1} ${conn.y1} C ${conn.x1} ${midY}, ${conn.x2} ${midY}, ${conn.x2} ${conn.y2}`;

            return (
              <g key={`conn-${conn.fromId}-${conn.toId}-${idx}`}>
                {/* Glow under line if highlighted in path tester */}
                {conn.isHighlighted && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeOpacity="0.3"
                  />
                )}
                {/* Main Curve */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={
                    conn.isHighlighted
                      ? "hsl(var(--primary))"
                      : conn.color ?? "rgba(148, 163, 184, 0.4)"
                  }
                  strokeWidth={conn.isHighlighted ? "3" : "2"}
                  strokeDasharray={conn.color ? "4 3" : undefined}
                  markerEnd={
                    conn.isHighlighted
                      ? "url(#arrowhead-highlight)"
                      : conn.color
                      ? "url(#arrowhead-amber)"
                      : "url(#arrowhead-default)"
                  }
                />

                {/* Choice Option Branch Pill */}
                {conn.label && (
                  <g transform={`translate(${(conn.x1 + conn.x2) / 2}, ${(conn.y1 + conn.y2) / 2})`}>
                    <rect
                      x="-55"
                      y="-11"
                      width="110"
                      height="22"
                      rx="11"
                      fill="#1E2330"
                      stroke={conn.isHighlighted ? "hsl(var(--primary))" : "rgba(255,255,255,0.15)"}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {conn.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isPathActive = activePathHighlight.includes(node.id);
          const badge = getNodeBadge(node.type);

          return (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: "230px",
              }}
              className={`story-node-card absolute rounded-2xl border p-3.5 transition-all cursor-pointer backdrop-blur-md shadow-2xl ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.03] z-30 " +
                    getNodeColor(node.type)
                  : isPathActive
                  ? "ring-2 ring-emerald-400/80 bg-emerald-500/10 border-emerald-500/50 z-20"
                  : "bg-[#141822]/90 hover:border-primary/60 hover:scale-[1.01] z-10 " +
                    getNodeColor(node.type)
              }`}
            >
              {/* Header Badge & Tag */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${badge.color}`}
                >
                  <badge.icon className="size-3" />
                  {node.branchTag ? `${node.branchTag} · ` : ""}
                  {badge.label}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {node.duration ?? node.id}
                </span>
              </div>

              {/* Title & Description */}
              <div className="flex items-start gap-2.5">
                {node.thumbnail ? (
                  <img
                    src={node.thumbnail}
                    alt={node.title}
                    className="size-11 rounded-lg object-cover border border-border/80 shrink-0"
                  />
                ) : (
                  <div className="grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground shrink-0">
                    <Film className="size-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-foreground truncate">
                    {node.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">
                    {node.type === "Choice" && node.choiceConfig
                      ? node.choiceConfig.question
                      : node.description}
                  </p>
                </div>
              </div>

              {/* Character Tags (Section 23) */}
              {node.characters && node.characters.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-1 flex-wrap">
                  <User className="size-2.5 text-muted-foreground shrink-0" />
                  {node.characters.map((ch) => (
                    <span
                      key={ch}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground font-medium"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
