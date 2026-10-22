import { useState, useEffect, useRef } from "react";
import {
  Check,
  ChevronRight,
  GitBranch,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
  Vote,
  X,
} from "lucide-react";
import { AdminButton } from "@/components/admin-components";
import { type StoryNode } from "@/lib/story-engine-data";

interface StoryPreviewModalProps {
  open: boolean;
  onClose: () => void;
  startNode: StoryNode;
  allNodes: StoryNode[];
}

export function StoryPreviewModal({
  open,
  onClose,
  startNode,
  allNodes,
}: StoryPreviewModalProps) {
  if (!open) return null;

  const [currentNode, setCurrentNode] = useState<StoryNode>(startNode);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(25);
  const [showChoicePrompt, setShowChoicePrompt] = useState(false);
  const [choiceCountdown, setChoiceCountdown] = useState(10);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const nodeMap = new Map<string, StoryNode>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));

  // Reset state when opening
  useEffect(() => {
    setCurrentNode(startNode);
    setProgress(0);
    setShowChoicePrompt(false);
    setSelectedOptionId(null);
  }, [startNode, open]);

  // Handle choice timing or auto-trigger choice
  useEffect(() => {
    if (currentNode.type === "Choice") {
      setShowChoicePrompt(true);
      setChoiceCountdown(10);
      return;
    }

    // For episode node, check if next node is a choice or has direct options
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) {
          clearInterval(timer);
          // If next is a choice node, trigger choice
          if (currentNode.nextNodeId) {
            const next = nodeMap.get(currentNode.nextNodeId);
            if (next && next.type === "Choice") {
              setCurrentNode(next);
              setShowChoicePrompt(true);
            }
          }
          return 100;
        }
        return p + 5;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [currentNode]);

  // Choice countdown
  useEffect(() => {
    if (!showChoicePrompt) return;
    const interval = setInterval(() => {
      setChoiceCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          // Auto pick option A if timeout
          if (currentNode.choiceConfig?.options[0]) {
            handleChooseOption(currentNode.choiceConfig.options[0].destinationNodeId, currentNode.choiceConfig.options[0].id);
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showChoicePrompt, currentNode]);

  const handleChooseOption = (destinationNodeId: string, optionId: string) => {
    setSelectedOptionId(optionId);
    setTimeout(() => {
      const nextNode = nodeMap.get(destinationNodeId);
      if (nextNode) {
        setCurrentNode(nextNode);
        setShowChoicePrompt(false);
        setProgress(0);
        setSelectedOptionId(null);
      }
    }, 700);
  };

  const handleNextLinearNode = () => {
    if (currentNode.nextNodeId) {
      const next = nodeMap.get(currentNode.nextNodeId);
      if (next) {
        setCurrentNode(next);
        setProgress(0);
      }
    }
  };

  const restartStory = () => {
    setCurrentNode(startNode);
    setProgress(0);
    setShowChoicePrompt(false);
    setSelectedOptionId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col md:flex-row items-center gap-6 max-h-[92vh]">
        {/* Mobile Phone Mockup Device Frame */}
        <div className="relative w-[340px] h-[640px] rounded-[44px] border-[6px] border-[#22283A] bg-[#0A0D14] shadow-2xl shadow-primary/20 overflow-hidden flex flex-col">
          {/* Top Notch / Speaker Bar */}
          <div className="absolute top-2 inset-x-0 z-30 flex justify-center">
            <div className="h-4 w-28 rounded-full bg-black/80 flex items-center justify-center">
              <div className="size-2 rounded-full bg-zinc-800" />
            </div>
          </div>

          {/* Video / Background Canvas */}
          <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
            {currentNode.videoUrl ? (
              <video
                ref={videoRef}
                src={currentNode.videoUrl}
                autoPlay
                loop
                muted={muted}
                playsInline
                className="w-full h-full object-cover"
              />
            ) : currentNode.thumbnail ? (
              <img
                src={currentNode.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground text-xs">
                No video stream available for this node
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

            {/* Top Bar Header */}
            <div className="absolute top-8 inset-x-4 z-20 flex items-center justify-between text-white text-xs">
              <span className="flex items-center gap-1.5 font-bold tracking-wider text-[11px] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                SIMULATION MODE
              </span>
              <button
                onClick={() => setMuted(!muted)}
                className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
              >
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-28 inset-x-4 z-20">
              <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Bottom Scene Info */}
            <div className="absolute bottom-4 inset-x-4 z-20 space-y-1.5 text-white">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground uppercase">
                  {currentNode.branchTag ?? "Canonical"}
                </span>
                <span className="text-xs font-bold font-display text-white">
                  {currentNode.title}
                </span>
              </div>
              <p className="text-[11px] text-white/80 line-clamp-2 leading-tight">
                {currentNode.description}
              </p>
            </div>

            {/* Interactive Choice Overlay Popup (Section 8 & 22) */}
            {showChoicePrompt && currentNode.choiceConfig && (
              <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md p-5 flex flex-col justify-end pb-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  {/* Timer */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full">
                      <Timer className="size-3.5" /> DECISION TIMEOUT: {choiceCountdown}s
                    </span>
                    <span className="text-[10px] text-white/60">Choose your path</span>
                  </div>

                  {/* Question */}
                  <h3 className="font-display text-base font-bold text-white tracking-wide">
                    {currentNode.choiceConfig.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {currentNode.choiceConfig.options.map((opt, i) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleChooseOption(opt.destinationNodeId, opt.id)}
                          className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground scale-[1.02]"
                              : i === 0
                              ? "border-primary/50 bg-primary/20 hover:bg-primary/30 text-white"
                              : "border-purple-500/50 bg-purple-500/20 hover:bg-purple-500/30 text-white"
                          }`}
                        >
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                              {opt.label}
                            </p>
                            <p className="text-xs font-bold">{opt.text}</p>
                          </div>
                          <ChevronRight className="size-4 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin Simulation Controller Panel */}
        <div className="w-80 space-y-4 bg-card/95 border border-border p-5 rounded-3xl shadow-xl text-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Interactive Simulator</h3>
              <p className="text-[11px] text-muted-foreground">Admin Story Engine Preview</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Node Playing
            </p>
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
              <p className="font-semibold text-foreground text-xs">{currentNode.title}</p>
              <p className="text-[10px] text-muted-foreground">Type: {currentNode.type}</p>
              <p className="text-[10px] text-muted-foreground">
                Branch: {currentNode.branchTag ?? "Main Timeline"}
              </p>
            </div>
          </div>

          {/* Quick branch skipping */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Jump To Branch
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const ep4a = allNodes.find((n) => n.id === "node-ep4a");
                  if (ep4a) setCurrentNode(ep4a);
                }}
                className="p-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-center font-bold text-[11px] transition-colors"
              >
                Jump to Path A
              </button>
              <button
                type="button"
                onClick={() => {
                  const ep4b = allNodes.find((n) => n.id === "node-ep4b");
                  if (ep4b) setCurrentNode(ep4b);
                }}
                className="p-2 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-center font-bold text-[11px] transition-colors"
              >
                Jump to Path B
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <button
              type="button"
              onClick={restartStory}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground font-semibold transition-colors"
            >
              <RotateCcw className="size-3.5" /> Restart from Episode 1
            </button>
            <div className="w-full">
              <AdminButton variant="secondary" size="md" onClick={onClose}>
                Exit Preview
              </AdminButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
