import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GitBranch,
  ChevronRight,
  Vote,
  Trophy,
  Sparkles,
  Info,
  ExternalLink,
  Layers,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useStoryLab } from "@/lib/story-lab-state";
import { ChoicePathComparisonCard } from "@/components/story-lab-components";

/* ==========================================================================
   STORY LAB — INTERACTIVE SIGNALS
   Route: /admin/story-lab/interactive
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/interactive")({
  component: InteractiveSignalsPage,
});

function InteractiveSignalsPage() {
  const { interactiveSignals } = useStoryLab();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin/story-lab"
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
            >
              Story Lab
              <ChevronRight className="size-3" />
            </Link>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Interactive Story Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Interactive Signals
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Evaluate audience decision participation, branching path continuation, and choice node
            equilibrium.
          </p>
        </div>

        {/* Existing Platform Modules Links (Section 36) */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/builder"
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <GitBranch className="size-3.5" />
            Story Builder (4B)
          </Link>
          <Link
            to="/admin/votes"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Vote className="size-3.5" />
            Live Votes
          </Link>
          <Link
            to="/admin/predictions"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Trophy className="size-3.5" />
            Predictions
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INFORMATIONAL BANNER */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-start gap-3 text-xs leading-relaxed text-purple-950 dark:text-purple-200">
        <Info className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold block mb-0.5 text-purple-900 dark:text-purple-300">
            Path Comparison Principle
          </span>
          Interactive branch differences represent observed cohort behaviour, not qualitative "better" or "worse" narrative paths. Variations in post-choice completion indicate structural pacing, cliffhanger resolution, or context differences that merit investigation.
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. INTERACTIVE AGGREGATE SUMMARY */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Active Choice Nodes
          </span>
          <span className="text-2xl font-black text-foreground">42</span>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            Across 14 interactive series
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Average Choice Participation
          </span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
            52.1%
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
            ↑ 12% over 30 days
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Total Monitored Votes
          </span>
          <span className="text-2xl font-black text-foreground">1.42M</span>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            Validated viewer decisions
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Path Equilibrium Rate
          </span>
          <span className="text-2xl font-black text-foreground">68%</span>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            Within 65/35 balanced split
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. CHOICE NODES & PATH COMPARISON (Section 16 & 17) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="size-4 text-purple-600 dark:text-purple-400" />
              Choice Point Signals & Path Comparisons
            </h2>
            <p className="text-xs text-muted-foreground">
              Comparative analysis of viewer branch choices and downstream episode retention.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {interactiveSignals.length} active interactive signals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interactiveSignals.map((item) => (
            <ChoicePathComparisonCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. STORY BUILDER HOOK */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-purple-500/5 rounded-xl border border-purple-500/20 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-foreground">
            Need to adjust a branch transition or cliffhanger timing?
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Story Builder enables node graph editing, choice timing reconfiguration, and alternate branch testing.
          </p>
        </div>

        <Link
          to="/admin/builder"
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
        >
          <GitBranch className="size-3.5" />
          Launch Story Builder
        </Link>
      </div>
    </div>
  );
}
