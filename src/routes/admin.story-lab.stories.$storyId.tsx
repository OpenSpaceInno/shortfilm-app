import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Tv,
  ChevronRight,
  GitBranch,
  Eye,
  Clock,
  CheckCircle2,
  Users,
  Share2,
  Heart,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight,
  FileEdit,
  ArrowLeft,
} from "lucide-react";
import { useStoryLab } from "@/lib/story-lab-state";
import { EpisodeFunnel, SignalBadge, SignalStrengthBadge } from "@/components/story-lab-components";

/* ==========================================================================
   STORY LAB — STORY INTELLIGENCE DETAIL
   Route: /admin/story-lab/stories/:storyId
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/stories/$storyId")({
  component: StoryIntelligenceDetailPage,
});

function StoryIntelligenceDetailPage() {
  const { storyId } = useParams({ from: "/admin/story-lab/stories/$storyId" });
  const { storyIntelligence, openInvestigation } = useStoryLab();

  // Find targeted story or default to first
  const story =
    storyIntelligence.find((s) => s.id === storyId || s.slug === storyId) ||
    storyIntelligence[0];

  if (!story) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-foreground">Story Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested story could not be found in Story Intelligence.
        </p>
        <Link to="/admin/story-lab/stories" className="text-sm text-primary hover:underline">
          Return to Story Intelligence
        </Link>
      </div>
    );
  }

  const storyTitle = story.storyTitle || story.title;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* 1. BREADCRUMBS & TOP NAVIGATION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            to="/admin/story-lab"
            className="hover:text-foreground font-medium flex items-center gap-1"
          >
            Story Lab
          </Link>
          <ChevronRight className="size-3" />
          <Link
            to="/admin/story-lab/stories"
            className="hover:text-foreground font-medium"
          >
            Story Intelligence
          </Link>
          <ChevronRight className="size-3" />
          <span className="font-semibold text-foreground">{storyTitle}</span>
        </div>

        <Link
          to="/admin/story-lab/stories"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="size-3" /> Back to catalog
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. STORY HEADER & ACTIONS (Section 12) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={story.poster}
            alt={story.storyTitle}
            className="w-20 h-28 object-cover rounded-xl border border-border shadow-sm shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/20">
                Story Intelligence
              </span>
              <span className="text-xs text-muted-foreground">• {story.genre}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="size-3" />
                {story.status}
              </span>
              {story.interactive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  <GitBranch className="size-3" />
                  Interactive Series
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {story.storyTitle}
            </h1>

            <p className="text-xs text-muted-foreground mt-1">
              Created by{" "}
              <Link
                to="/admin/creators"
                className="font-semibold text-foreground hover:text-primary transition-colors underline"
              >
                {story.creatorName}
              </Link>{" "}
              • {story.episodesCount} Episodes • {story.language} • Released {story.releasePeriod}
            </p>
          </div>
        </div>

        {/* Existing Platform Module Integration (Section 12 & 36) */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <Link
            to="/admin/series"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Tv className="size-3.5" />
            Open Series
          </Link>
          <Link
            to="/admin/builder"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <GitBranch className="size-3.5" />
            Open Story Builder
          </Link>
          <Link
            to="/admin/creators"
            className="px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Users className="size-3.5" />
            View Creator
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. STORY PERFORMANCE METRICS (Section 13) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-card rounded-xl border border-border p-3.5 shadow-xs text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Total Views
          </span>
          <span className="text-lg font-black text-foreground">{story.totalViews}</span>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-xs text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Unique Viewers
          </span>
          <span className="text-lg font-black text-foreground">{story.uniqueViewers}</span>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-xs text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Watch Time
          </span>
          <span className="text-lg font-black text-foreground">{story.watchTime}</span>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-xs text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Series Completion
          </span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {story.completionRate}
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-xs text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Returning Viewers
          </span>
          <span className="text-lg font-black text-foreground">{story.returningViewers}</span>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-xs text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Shares
          </span>
          <span className="text-lg font-black text-foreground">{story.shares}</span>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-xs text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Followers Gen.
          </span>
          <span className="text-lg font-black text-foreground">
            +{story.followersGenerated.toLocaleString()}
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-3.5 shadow-xs text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Choice Partic.
          </span>
          <span className="text-lg font-black text-purple-600 dark:text-purple-400">
            {story.interactiveParticipation}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. STORY HEALTH SIGNALS (Section 13) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Story Health Signals
            </h2>
            <p className="text-xs text-muted-foreground">
              Directional observations grounded in episode-by-episode telemetry.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">Updated: Today, 09:30</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {story.healthSignals.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
                item.type === "positive"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : item.type === "warning"
                  ? "bg-rose-500/5 border-rose-500/20"
                  : "bg-muted/40 border-border"
              }`}
            >
              {item.type === "positive" ? (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : item.type === "warning" ? (
                <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="size-4 text-primary shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold text-foreground block mb-0.5">
                  {item.title}
                </span>
                <p className="text-muted-foreground leading-relaxed mb-1.5">
                  {item.description}
                </p>
                <span className="inline-block text-[11px] font-medium text-foreground bg-card/80 px-2 py-0.5 rounded border border-border">
                  Evidence: {item.supportingData}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. EPISODE FUNNEL & DROP-OFF INVESTIGATION (Section 14 & 15) */}
      {/* ------------------------------------------------------------------ */}
      <EpisodeFunnel
        nodes={story.funnel}
        largestDrop={story.largestObservedDrop}
        onInvestigateDrop={() =>
          openInvestigation({
            title: `${storyTitle} Pacing Drop Investigation`,
            storyTitle: storyTitle,
            signal: "Drop-off Signal",
            observation: story.largestObservedDrop.observation,
            suggestedInvestigation: story.largestObservedDrop.suggestedInvestigation,
            storyId: story.id,
            episode: `${story.largestObservedDrop.fromEpisode} → ${story.largestObservedDrop.toEpisode}`,
            supportingData: `Observed drop: -${story.largestObservedDrop.dropPercentage}% continuation`,
          })
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* 6. LINKED OPPORTUNITIES & ACTIONS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-muted/40 rounded-xl border border-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-foreground">
            Explore Content Opportunities for {storyTitle}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluate sequel hypotheses, character spin-off arcs, or pacing adjustments in the Opportunities workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/story-lab/opportunities"
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            View Opportunities
          </Link>
          <Link
            to="/admin/story-lab/experiments"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors shadow-xs"
          >
            View Experiments
          </Link>
        </div>
      </div>
    </div>
  );
}
