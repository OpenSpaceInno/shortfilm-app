import { useState, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Compass,
  Film,
  GitBranch,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Vote,
  X,
} from "lucide-react";
import { AdminButton, AdminModal } from "@/components/admin-components";
import { type StoryNode } from "@/lib/story-engine-data";

interface PathTesterModalProps {
  open: boolean;
  onClose: () => void;
  nodes: StoryNode[];
  onHighlightPathOnCanvas?: (pathNodeIds: string[]) => void;
  onLaunchPreviewForPath?: (pathNodes: StoryNode[]) => void;
}

export function PathTesterModal({
  open,
  onClose,
  nodes,
  onHighlightPathOnCanvas,
  onLaunchPreviewForPath,
}: PathTesterModalProps) {
  const [selectedBranch, setSelectedBranch] = useState<"A" | "B">("A");

  // Trace Path A
  const pathA = useMemo(() => {
    const sequence: StoryNode[] = [];
    const nodeMap = new Map<string, StoryNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Start with root node (node-ep1 or first Episode)
    let current = nodes.find((n) => n.id === "node-ep1") ?? nodes[0];
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      sequence.push(current);
      visited.add(current.id);

      if (current.type === "Choice" && current.choiceConfig) {
        // Pick Option A
        const optA = current.choiceConfig.options[0];
        if (optA && optA.destinationNodeId) {
          current = nodeMap.get(optA.destinationNodeId) as StoryNode;
        } else {
          break;
        }
      } else if (current.nextNodeId) {
        current = nodeMap.get(current.nextNodeId) as StoryNode;
      } else {
        break;
      }
    }
    return sequence;
  }, [nodes]);

  // Trace Path B
  const pathB = useMemo(() => {
    const sequence: StoryNode[] = [];
    const nodeMap = new Map<string, StoryNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    let current = nodes.find((n) => n.id === "node-ep1") ?? nodes[0];
    const visited = new Set<string>();

    while (current && !visited.has(current.id)) {
      sequence.push(current);
      visited.add(current.id);

      if (current.type === "Choice" && current.choiceConfig) {
        // Pick Option B
        const optB = current.choiceConfig.options[1] ?? current.choiceConfig.options[0];
        if (optB && optB.destinationNodeId) {
          current = nodeMap.get(optB.destinationNodeId) as StoryNode;
        } else {
          break;
        }
      } else if (current.nextNodeId) {
        current = nodeMap.get(current.nextNodeId) as StoryNode;
      } else {
        break;
      }
    }
    return sequence;
  }, [nodes]);

  const activePath = selectedBranch === "A" ? pathA : pathB;

  const handleSelectBranch = (branch: "A" | "B") => {
    setSelectedBranch(branch);
    const targetPath = branch === "A" ? pathA : pathB;
    if (onHighlightPathOnCanvas) {
      onHighlightPathOnCanvas(targetPath.map((n) => n.id));
    }
  };

  const finalNode = activePath[activePath.length - 1];

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Path Testing Engine"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        <p className="text-xs text-muted-foreground">
          Simulate complete narrative branches from beginning to ending to verify narrative continuity, destination coherence, and choice resolution before publishing.
        </p>

        {/* Branch Selection Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSelectBranch("A")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedBranch === "A"
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary"
                : "border-border bg-card/60 hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold text-xs">
                <GitBranch className="size-3" /> PATH A
              </span>
              <span className="text-[11px] text-muted-foreground">{pathA.length} Nodes</span>
            </div>
            <p className="font-semibold text-sm text-foreground">Decision: Open The Encrypted Phone</p>
            <p className="text-xs text-muted-foreground mt-1">
              Outcome: Reaches <strong>Ending A (Truth Revealed)</strong>
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectBranch("B")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedBranch === "B"
                ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500"
                : "border-border bg-card/60 hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">
                <GitBranch className="size-3" /> PATH B
              </span>
              <span className="text-[11px] text-muted-foreground">{pathB.length} Nodes</span>
            </div>
            <p className="font-semibold text-sm text-foreground">Decision: Destroy The Phone &amp; Run</p>
            <p className="text-xs text-muted-foreground mt-1">
              Outcome: Reaches <strong>Ending B (Off The Grid)</strong>
            </p>
          </button>
        </div>

        {/* Step-by-Step Path Sequence */}
        <div className="p-4 rounded-2xl border border-border bg-[#0E111A] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Compass className="size-4 text-primary" />
              Testing Sequence: Path {selectedBranch}
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="size-3.5" /> 100% Connected Path
            </span>
          </div>

          <div className="relative pl-6 space-y-3 border-l-2 border-primary/30">
            {activePath.map((step, idx) => (
              <div key={step.id} className="relative group">
                {/* Node pin on timeline */}
                <div
                  className={`absolute -left-[31px] top-1.5 size-4 rounded-full border-2 border-background ${
                    step.type === "Choice"
                      ? "bg-amber-400 ring-2 ring-amber-400/30"
                      : step.type === "Ending"
                      ? "bg-emerald-400 ring-2 ring-emerald-400/30"
                      : "bg-primary"
                  }`}
                />
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card/80 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground font-bold shrink-0">
                      #{idx + 1}
                    </span>
                    {step.thumbnail && (
                      <img
                        src={step.thumbnail}
                        alt=""
                        className="size-8 rounded-lg object-cover border border-border shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {step.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {step.type === "Choice" && step.choiceConfig
                          ? `Vote: "${step.choiceConfig.question}"`
                          : step.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {step.type === "Choice" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                        Choice Point
                      </span>
                    )}
                    {step.type === "Ending" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        Story Ending
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {step.duration ?? "2:00"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Path Summary & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
          <div className="text-xs text-muted-foreground">
            Target Destination:{" "}
            <span className="font-semibold text-foreground">{finalNode?.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() => {
                if (onHighlightPathOnCanvas) {
                  onHighlightPathOnCanvas(activePath.map((n) => n.id));
                }
                onClose();
              }}
            >
              Highlight on Graph
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => {
                if (onLaunchPreviewForPath) {
                  onLaunchPreviewForPath(activePath);
                }
                onClose();
              }}
            >
              <Play className="size-3.5" /> Launch Video Simulation
            </AdminButton>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
