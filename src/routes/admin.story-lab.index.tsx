import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Flame,
  GitBranch,
  FlaskConical,
  Clock,
  CheckCircle2,
  Users,
  Eye,
  Share2,
  Tv,
  ArrowRight,
  Info,
  Lightbulb,
  Layers,
  ChevronRight,
  Activity,
  Heart,
} from "lucide-react";
import { useStoryLab } from "@/lib/story-lab-state";
import {
  storyLabEcosystemKPIs,
  storyEcosystemSnapshot,
} from "@/lib/story-lab-data";
import {
  StoryInsightCard,
  StoryLabFilterBar,
  AIStoryAnalystPlaceholder,
} from "@/components/story-lab-components";

/* ==========================================================================
   STORY LAB — OVERVIEW
   Route: /admin/story-lab
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/")({
  component: StoryLabOverviewPage,
});

function StoryLabOverviewPage() {
  const { filteredSignals, openCreateExperiment, filters } = useStoryLab();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER & HERO */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-primary/20">
              <Sparkles className="size-3.5" />
              Content Intelligence Workspace
            </span>
            <span className="text-xs text-muted-foreground">• Iteration 4D</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Story Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Understand audience behaviour. Discover story signals. Explore content
            opportunities.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/story-lab/stories"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Tv className="size-3.5" />
            Story Intelligence
          </Link>
          <button
            onClick={openCreateExperiment}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FlaskConical className="size-3.5" />
            New Story Experiment
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INFORMATIONAL BANNER (Section 6) */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3 text-xs leading-relaxed text-blue-950 dark:text-blue-200">
        <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold block mb-0.5 text-blue-900 dark:text-blue-300">
            Editorial Decision-Support Guideline
          </span>
          Story Lab provides data-driven signals to support editorial and content
          decisions. Signals are directional observations derived from audience telemetry
          and should be reviewed and validated by the content team. Story Lab does not
          make autonomous editorial commitments.
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TOP KPI CARDS (Section 7) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
          <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Stories Analysed
            </span>
            <div className="text-2xl font-black text-foreground">
              {storyLabEcosystemKPIs.storiesAnalysed}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Across active catalog
            </span>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Active Stories
            </span>
            <div className="text-2xl font-black text-foreground">
              {storyLabEcosystemKPIs.activeStories}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
              62% catalog streaming
            </span>
          </div>

          <div className="bg-card rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
              Breakout Signals
            </span>
            <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
              {storyLabEcosystemKPIs.breakoutSignals}
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 block font-medium">
              Surpassing benchmarks
            </span>
          </div>

          <div className="bg-card rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block mb-1">
              Needing Review
            </span>
            <div className="text-2xl font-black text-rose-800 dark:text-rose-300">
              {storyLabEcosystemKPIs.storiesNeedingReview}
            </div>
            <span className="text-[10px] text-rose-700 dark:text-rose-400 mt-1 block font-medium">
              Drop-offs flagged
            </span>
          </div>

          <div className="bg-card rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 block mb-1">
              Interactive Stories
            </span>
            <div className="text-2xl font-black text-purple-800 dark:text-purple-300">
              {storyLabEcosystemKPIs.interactiveStories}
            </div>
            <span className="text-[10px] text-purple-700 dark:text-purple-400 mt-1 block font-medium">
              Branching nodes live
            </span>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Active Experiments
            </span>
            <div className="text-2xl font-black text-foreground">
              {storyLabEcosystemKPIs.activeExperiments}
            </div>
            <span className="text-[10px] text-primary mt-1 block font-medium">
              A/B pacing cohorts
            </span>
          </div>
        </div>

        {/* Secondary Supporting Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/80 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block">Total Watch Time</span>
              <span className="font-bold text-foreground">
                {storyLabEcosystemKPIs.totalWatchTime}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block">Avg Completion</span>
              <span className="font-bold text-foreground">
                {storyLabEcosystemKPIs.averageCompletion}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block">
                Choice Participation
              </span>
              <span className="font-bold text-foreground">
                {storyLabEcosystemKPIs.interactiveParticipation}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block">Returning Viewers</span>
              <span className="font-bold text-foreground">
                {storyLabEcosystemKPIs.returningViewers}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Share2 className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block">Story Shares</span>
              <span className="font-bold text-foreground">
                {storyLabEcosystemKPIs.storyShares}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Heart className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block">Character Follows</span>
              <span className="font-bold text-foreground">
                {storyLabEcosystemKPIs.characterFollows}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <StoryLabFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 5. STORY ECOSYSTEM SNAPSHOT (Section 8) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Story Ecosystem Snapshot
            </h2>
            <p className="text-xs text-muted-foreground">
              Aggregated directional shifts across content dimensions for {filters.timeRange}.
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
            Directional changes vs previous period
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {storyEcosystemSnapshot.map((item) => (
            <div
              key={item.title}
              className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {item.title}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="size-3" />
                    {item.directionalChange}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-black text-foreground">
                    {item.currentValue}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    from {item.previousPeriod}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/60 leading-relaxed">
                  <strong className="text-foreground block text-[11px] mb-0.5">
                    Observation:
                  </strong>
                  {item.observation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. STORY SIGNALS (Section 9 & 10) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Flame className="size-5 text-amber-500" />
              Story Signals
            </h2>
            <p className="text-xs text-muted-foreground">
              Directional signals identified for content and editorial review.
            </p>
          </div>
          <Link
            to="/admin/story-lab/stories"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            View all stories in Story Intelligence
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        {filteredSignals.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <AlertTriangle className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-sm text-foreground mb-1">
              No matching story signals
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Story Lab needs enough audience activity matching your current filter criteria
              before meaningful signals can be generated.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSignals.map((signal) => (
              <StoryInsightCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 7. AI STORY ANALYST PLACEHOLDER (Section 35) */}
      {/* ------------------------------------------------------------------ */}
      <AIStoryAnalystPlaceholder />

      {/* ------------------------------------------------------------------ */}
      {/* 8. STORY LAB SUB-WORKSPACE DIRECTORY */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Explore Story Lab Intelligence Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/story-lab/stories"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Tv className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Story Intelligence
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Full catalog performance table, multi-episode funnels and drop-off analysis.
            </p>
          </Link>

          <Link
            to="/admin/story-lab/interactive"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <GitBranch className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Interactive Signals
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Choice point performance, path differences, and branch continuation metrics.
            </p>
          </Link>

          <Link
            to="/admin/story-lab/characters"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Users className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Character Signals
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Character follower growth, episode introduction surges, and spin-off signals.
            </p>
          </Link>

          <Link
            to="/admin/story-lab/audience"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Layers className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Audience Signals
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Genre trends, viewing mood intents, regional languages, and organic discovery.
            </p>
          </Link>

          <Link
            to="/admin/story-lab/opportunities"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Lightbulb className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Content Opportunities
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Human review workspace for story expansions, spin-offs, and creator pairings.
            </p>
          </Link>

          <Link
            to="/admin/story-lab/experiments"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <FlaskConical className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Story Experiments
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Controlled A/B testing of cliffhangers, opening hooks, and choice timings.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
