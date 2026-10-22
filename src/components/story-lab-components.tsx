import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Search,
  Filter,
  RefreshCw,
  GitBranch,
  Eye,
  Clock,
  Users,
  Compass,
  CheckCircle2,
  X,
  HelpCircle,
  FileEdit,
  ExternalLink,
  ChevronRight,
  FlaskConical,
  Target,
  BarChart2,
  Calendar,
  Layers,
  Activity,
  Maximize2,
  Info,
  Tv,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import {
  type StorySignal,
  type SignalType,
  type SignalStrength,
  type ContentOpportunity,
  type StoryExperiment,
  type EpisodeFunnelNode,
  type InteractiveSignalItem,
} from "@/lib/story-lab-data";
import { useStoryLab, type TimeRangeOption, type InvestigationTarget } from "@/lib/story-lab-state";

/* ==========================================================================
   STORY LAB — REUSABLE INTELLIGENCE COMPONENTS
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. SIGNAL BADGE & SIGNAL STRENGTH BADGE
// --------------------------------------------------------------------------

export function SignalBadge({ type }: { type: SignalType }) {
  const getStyle = (t: SignalType) => {
    switch (t) {
      case "Breakout Signal":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "Momentum Signal":
        return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20";
      case "Engagement Signal":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "Retention Signal":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20";
      case "Completion Signal":
        return "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20";
      case "Interactive Signal":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "Character Signal":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "Creator Signal":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20";
      case "Discovery Signal":
        return "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20";
      case "Opportunity Signal":
        return "bg-primary/10 text-primary border-primary/20";
      case "Review Signal":
      case "Drop-off Signal":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${getStyle(
        type
      )}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {type}
    </span>
  );
}

export function SignalStrengthBadge({
  strength,
  tooltip,
}: {
  strength: SignalStrength;
  tooltip?: string;
}) {
  const getStyle = (s: SignalStrength) => {
    switch (s) {
      case "Strong":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "Moderate":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "Emerging":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="relative group inline-block">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border cursor-help ${getStyle(
          strength
        )}`}
        title={
          tooltip ||
          `${strength} Signal: Reflects consistency & sample size of data, not a quality or ranking score.`
        }
      >
        <span className="size-1.5 rounded-full bg-current" />
        {strength} Signal
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded shadow-md border border-border z-30 pointer-events-none leading-relaxed">
        {tooltip ||
          "Signal strength reflects data volume, sample size & consistency across periods. It is NOT a quality score."}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. STORY INSIGHT CARD (Section 30 of spec)
// --------------------------------------------------------------------------

export function StoryInsightCard({
  signal,
  onInvestigate,
  onViewStory,
}: {
  signal: StorySignal;
  onInvestigate?: (signal: StorySignal) => void;
  onViewStory?: (signal: StorySignal) => void;
}) {
  const { openInvestigation } = useStoryLab();

  const handleInvestigate = () => {
    if (onInvestigate) {
      onInvestigate(signal);
    } else {
      openInvestigation({
        title: signal.title,
        storyTitle: signal.storyTitle,
        signal: signal.type,
        observation: signal.observation,
        suggestedInvestigation: signal.suggestedInvestigation,
        storyId: signal.storyId,
        relatedCreator: signal.creatorName,
        supportingData: `${signal.supportingMetrics.viewersCount} viewers • ${signal.supportingMetrics.sampleDescription}`,
        timestamp: signal.timestamp,
      });
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top meta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <SignalBadge type={signal.type} />
            <SignalStrengthBadge strength={signal.strength} />
          </div>
          <span className="text-[11px] text-muted-foreground">{signal.timePeriod}</span>
        </div>

        {/* Story details */}
        <div className="flex items-center gap-3 mb-3.5">
          <img
            src={signal.poster}
            alt={signal.storyTitle}
            className="w-10 h-14 object-cover rounded-md shadow-xs border border-border"
          />
          <div>
            <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              {signal.storyTitle}
            </h4>
            <p className="text-xs text-muted-foreground">
              By <span className="font-medium text-foreground">{signal.creatorName}</span> •{" "}
              {signal.genre}
            </p>
          </div>
        </div>

        {/* Title */}
        <h5 className="font-medium text-sm text-foreground mb-2 leading-snug">
          {signal.title}
        </h5>

        {/* Observation */}
        <div className="mb-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs">
          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1">
            Observation
          </span>
          <p className="text-foreground/90 leading-relaxed">{signal.observation}</p>
        </div>

        {/* Supporting Metrics */}
        <div className="mb-3 flex items-center justify-between text-xs py-1.5 px-2 bg-primary/5 rounded border border-primary/10">
          <span className="text-muted-foreground font-medium">{signal.metricLabel}:</span>
          <div className="flex items-center gap-1 font-bold text-foreground">
            {signal.direction === "up" ? (
              <TrendingUp className="size-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="size-3 text-rose-600 dark:text-rose-400" />
            )}
            <span>{signal.keyMetric}</span>
            <span
              className={`text-[11px] ${
                signal.direction === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              ({signal.changeValue})
            </span>
          </div>
        </div>

        {/* Possible Interpretation */}
        <div className="mb-3 text-xs">
          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-0.5">
            Possible Interpretation
          </span>
          <p className="text-muted-foreground leading-relaxed italic">
            "{signal.possibleInterpretation}"
          </p>
        </div>

        {/* Suggested Investigation */}
        <div className="mb-4 text-xs p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 text-[11px] mb-1">
            <Lightbulb className="size-3" />
            <span>Suggested Investigation</span>
          </div>
          <p className="text-xs leading-relaxed">{signal.suggestedInvestigation}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
        <Link
          to="/admin/story-lab/stories/$storyId"
          params={{ storyId: signal.storyId }}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          View Story Intelligence
          <ChevronRight className="size-3" />
        </Link>
        <button
          onClick={handleInvestigate}
          className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors inline-flex items-center gap-1.5 shadow-xs"
        >
          <Search className="size-3" />
          Investigate
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. EPISODE FUNNEL COMPONENT (Section 14 & 15 of spec)
// --------------------------------------------------------------------------

export function EpisodeFunnel({
  nodes,
  largestDrop,
  onInvestigateDrop,
}: {
  nodes: EpisodeFunnelNode[];
  largestDrop?: {
    fromEpisode: string;
    toEpisode: string;
    dropPercentage: number;
    observation: string;
    suggestedInvestigation: string;
  };
  onInvestigateDrop?: () => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            Episode Completion & Continuation Funnel
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Measured progression from story start through interactive branching nodes.
          </p>
        </div>
        <span className="text-[11px] bg-muted px-2.5 py-1 rounded text-muted-foreground font-medium self-start sm:self-auto">
          Sample: 1.8M unique viewers
        </span>
      </div>

      {/* Visual Funnel Nodes */}
      <div className="space-y-3">
        {nodes.map((node, idx) => {
          const isDropPoint =
            largestDrop &&
            (node.episode === largestDrop.fromEpisode || node.episode === largestDrop.toEpisode);

          return (
            <div key={node.episode} className="relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{node.episode}:</span>
                  <span className="text-muted-foreground">{node.title}</span>
                  {node.isChoice && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold border border-purple-500/20">
                      Choice Node
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-[11px]">
                    {node.viewerCount}
                  </span>
                  <span className="font-bold text-sm text-foreground w-12 text-right">
                    {node.completionPercentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    node.isChoice
                      ? "bg-purple-600 dark:bg-purple-500"
                      : isDropPoint
                      ? "bg-gradient-to-r from-primary to-rose-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${node.completionPercentage}%` }}
                />
              </div>

              {/* Transition arrow & delta */}
              {idx < nodes.length - 1 && (
                <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    ↓ Continuation
                  </span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    -{Math.max(
                      0,
                      (node.completionPercentage ?? 0) - (nodes[idx + 1]?.completionPercentage ?? 0)
                    )}
                    % drop
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Largest Observed Drop Alert Box (Section 15) */}
      {largestDrop && (
        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wide">
                    Largest Observed Drop
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
                    {largestDrop.fromEpisode} → {largestDrop.toEpisode} (-
                    {largestDrop.dropPercentage}%)
                  </span>
                </div>
                <p className="text-xs text-foreground mt-1.5 leading-relaxed font-medium">
                  {largestDrop.observation}
                </p>
                <div className="mt-2 text-xs text-muted-foreground bg-card/80 p-2.5 rounded-lg border border-border">
                  <span className="font-semibold text-foreground block mb-0.5">
                    Suggested Investigation:
                  </span>
                  {largestDrop.suggestedInvestigation}
                </div>
              </div>
            </div>

            <button
              onClick={onInvestigateDrop}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-xs"
            >
              Investigate Pacing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. CHOICE PERFORMANCE & PATH COMPARISON (Section 16 & 17 of spec)
// --------------------------------------------------------------------------

export function ChoicePathComparisonCard({ item }: { item: InteractiveSignalItem }) {
  const { openInvestigation } = useStoryLab();

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-500/20">
              Interactive Choice Point
            </span>
            <SignalStrengthBadge strength={item.signalStrength} />
          </div>
          <span className="text-xs text-muted-foreground">{item.storyTitle}</span>
        </div>

        <h4 className="font-bold text-sm text-foreground mb-1">
          {item.episodeTitle}
        </h4>
        <p className="text-xs text-muted-foreground italic mb-4">
          Question: "{item.choiceQuestion}"
        </p>

        {/* Choice Key Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4 p-2.5 bg-muted/40 rounded-lg border border-border text-center">
          <div>
            <span className="text-[10px] text-muted-foreground block">Participation</span>
            <span className="font-bold text-xs text-foreground">{item.participationRate}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Total Votes</span>
            <span className="font-bold text-xs text-foreground">{item.totalVotes}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Post-Choice Comp.</span>
            <span className="font-bold text-xs text-foreground">{item.completionAfterChoice}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Return Rate</span>
            <span className="font-bold text-xs text-foreground">{item.returnRate}</span>
          </div>
        </div>

        {/* Visual Path Diagram */}
        <div className="mb-4 p-3 rounded-lg bg-card border border-border/80 text-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2 tracking-wider">
            Observed Path Difference
          </span>

          <div className="grid grid-cols-2 gap-3">
            {/* Path A */}
            <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-700 dark:text-blue-400 text-xs">
                  Option A: {item.optionA.label}
                </span>
                <span className="font-bold text-xs">{item.optionA.percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${item.optionA.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Votes: {item.optionA.votes}</span>
                <span className="font-medium text-foreground">
                  Post-comp: {item.optionA.postChoiceCompletion}
                </span>
              </div>
            </div>

            {/* Path B */}
            <div className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-purple-700 dark:text-purple-400 text-xs">
                  Option B: {item.optionB.label}
                </span>
                <span className="font-bold text-xs">{item.optionB.percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${item.optionB.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Votes: {item.optionB.votes}</span>
                <span className="font-medium text-foreground">
                  Post-comp: {item.optionB.postChoiceCompletion}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Observation: {item.observedPathDifference}
          </p>
        </div>
      </div>

      {/* Footer & Investigation */}
      <div className="pt-3 border-t border-border flex items-center justify-between">
        <Link
          to="/admin/builder"
          className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
        >
          <GitBranch className="size-3" />
          Open Story Builder
        </Link>
        <button
          onClick={() =>
            openInvestigation({
              title: `${item.storyTitle} Choice Observation`,
              storyTitle: item.storyTitle,
              signal: item.signalType,
              observation: item.observedPathDifference,
              suggestedInvestigation: item.suggestedInvestigation,
              episode: item.episodeTitle,
              supportingData: `Total Votes: ${item.totalVotes} • Participation: ${item.participationRate}`,
            })
          }
          className="px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
        >
          Investigate Divergence
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. GLOBAL FILTER BAR (Section 33 & 34 of spec)
// --------------------------------------------------------------------------

export function StoryLabFilterBar() {
  const {
    filters,
    setTimeRange,
    setGenre,
    setLanguage,
    setCreator,
    setStory,
    setInteractiveOnly,
    setSignalType,
    setSignalStrength,
    setSearchQuery,
    resetFilters,
  } = useStoryLab();

  const [expanded, setExpanded] = useState(false);

  const timeOptions: TimeRangeOption[] = [
    "Last 7 Days",
    "Last 30 Days",
    "Last 90 Days",
    "Since Release",
    "Custom",
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-xs mb-6">
      {/* Primary Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Time Filter Pills (Section 33) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Calendar className="size-3.5" />
            Window:
          </span>
          {timeOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setTimeRange(opt)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filters.timeRange === opt
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Search & Toggle More Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search signals, stories, creators..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-background border border-border focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              expanded
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Filter className="size-3.5" />
            <span>Filters</span>
          </button>

          {(filters.genre !== "All" ||
            filters.language !== "All" ||
            filters.creator !== "All" ||
            filters.story !== "All" ||
            filters.signalType !== "All" ||
            filters.signalStrength !== "All" ||
            filters.interactiveOnly ||
            filters.searchQuery) && (
            <button
              onClick={resetFilters}
              title="Reset All Filters"
              className="px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50 transition-colors"
            >
              <RefreshCw className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Multi-Dimension Filters (Section 34) */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Genre */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Genre
            </label>
            <select
              value={filters.genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Genres</option>
              <option value="Thriller">Thriller</option>
              <option value="Mystery">Mystery</option>
              <option value="Drama">Drama</option>
              <option value="Romance">Romance</option>
              <option value="Sci-Fi">Sci-Fi</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Language
            </label>
            <select
              value={filters.language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Languages</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
              <option value="Kannada">Kannada</option>
            </select>
          </div>

          {/* Creator */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Creator
            </label>
            <select
              value={filters.creator}
              onChange={(e) => setCreator(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Creators</option>
              <option value="Arjun Mehta">Arjun Mehta</option>
              <option value="Priya Nair">Priya Nair</option>
              <option value="Kabir Rao">Kabir Rao</option>
              <option value="Meera Sharma">Meera Sharma</option>
            </select>
          </div>

          {/* Signal Type */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Signal Type
            </label>
            <select
              value={filters.signalType}
              onChange={(e) => setSignalType(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Signals</option>
              <option value="Breakout Signal">Breakout Signal</option>
              <option value="Momentum Signal">Momentum Signal</option>
              <option value="Engagement Signal">Engagement Signal</option>
              <option value="Retention Signal">Retention Signal</option>
              <option value="Completion Signal">Completion Signal</option>
              <option value="Interactive Signal">Interactive Signal</option>
              <option value="Character Signal">Character Signal</option>
              <option value="Creator Signal">Creator Signal</option>
              <option value="Review Signal">Review Signal</option>
            </select>
          </div>

          {/* Signal Strength */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Signal Strength
            </label>
            <select
              value={filters.signalStrength}
              onChange={(e) => setSignalStrength(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Strengths</option>
              <option value="Strong">Strong Signal</option>
              <option value="Moderate">Moderate Signal</option>
              <option value="Emerging">Emerging Signal</option>
            </select>
          </div>

          {/* Interactive Checkbox */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={filters.interactiveOnly}
                onChange={(e) => setInteractiveOnly(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs font-medium text-foreground">
                Interactive Only
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// 6. AI STORY ANALYST PLACEHOLDER (Section 35 of spec)
// --------------------------------------------------------------------------

export function AIStoryAnalystPlaceholder() {
  return (
    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-xl border border-primary/20 p-5 shadow-xs mb-8">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              AI Story Analyst
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                Future Module Preview
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">
              AI-generated observations will appear here after the ShortReel Story
              Intelligence Engine is connected.
            </p>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-card/80 border border-border text-xs">
        <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1.5">
          <span className="font-bold uppercase tracking-wide text-primary">
            Observed Pattern (Mock Preview)
          </span>
          <span>Sample: 8,421 monitored sessions</span>
        </div>
        <h5 className="font-semibold text-foreground text-sm mb-1">
          Observed Choice Continuation Divergence
        </h5>
        <p className="text-muted-foreground leading-relaxed mb-2">
          Viewers who choose Option A ("Unlock Gallery") in Episode 3 show an 18% higher
          Episode 5 return rate compared to Option B.
        </p>
        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-foreground text-[11px]">
          <strong className="text-amber-700 dark:text-amber-400">Suggested Investigation: </strong>
          Review whether the Option A narrative path creates stronger forward continuation
          hooks or clearer mystery payoffs.
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 7. HUMAN INVESTIGATION & ACTION MODAL (Section 37 & 38)
// --------------------------------------------------------------------------

export function InvestigationModal() {
  const { investigationModalTarget, closeInvestigation, addStoryLabNote } = useStoryLab();
  const [note, setNote] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!investigationModalTarget) return null;

  const handleSaveNote = () => {
    if (!note.trim()) return;
    addStoryLabNote(investigationModalTarget.storyTitle, note);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setNote("");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-2xl w-full p-6 relative">
        <button
          onClick={closeInvestigation}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <SignalBadge type={investigationModalTarget.signal as SignalType} />
          <span className="text-xs text-muted-foreground">
            {investigationModalTarget.timestamp || "Today, 09:30"}
          </span>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1">
          {investigationModalTarget.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Story:{" "}
          <span className="font-semibold text-foreground">
            {investigationModalTarget.storyTitle}
          </span>
          {investigationModalTarget.episode && ` • ${investigationModalTarget.episode}`}
          {investigationModalTarget.relatedCreator &&
            ` • Creator: ${investigationModalTarget.relatedCreator}`}
        </p>

        {/* Human Review Loop Visual (Section 37) */}
        <div className="mb-4 p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-[11px] text-muted-foreground font-medium">
          <span>DATA</span>
          <ArrowRight className="size-3" />
          <span className="text-primary font-bold">SIGNAL</span>
          <ArrowRight className="size-3" />
          <span>OBSERVATION</span>
          <ArrowRight className="size-3" />
          <span className="text-amber-600 dark:text-amber-400 font-bold">INVESTIGATION</span>
          <ArrowRight className="size-3" />
          <span>HUMAN REVIEW</span>
          <ArrowRight className="size-3" />
          <span>ACTION</span>
        </div>

        {/* Observation & Supporting Data */}
        <div className="space-y-3 mb-5 text-xs">
          <div className="p-3 rounded-lg bg-card border border-border">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-1">
              Observation
            </span>
            <p className="text-foreground leading-relaxed font-medium">
              {investigationModalTarget.observation}
            </p>
          </div>

          {investigationModalTarget.supportingData && (
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-0.5">
                Supporting Evidence
              </span>
              <p className="text-muted-foreground">
                {investigationModalTarget.supportingData}
              </p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider block mb-1 flex items-center gap-1">
              <Lightbulb className="size-3" />
              Suggested Investigation
            </span>
            <p className="text-foreground leading-relaxed">
              {investigationModalTarget.suggestedInvestigation}
            </p>
          </div>
        </div>

        {/* Internal Editorial Note Input */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-foreground block mb-1.5 flex items-center justify-between">
            <span>Add Internal Editorial Note</span>
            {savedSuccess && (
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Saved to Audit Log
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Discussed with Arjun: adjusting opening sound hook for Episode 4..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 text-xs rounded-lg bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
            <button
              onClick={handleSaveNote}
              disabled={!note.trim()}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Log Note
            </button>
          </div>
        </div>

        {/* Platform Integration Actions (Section 36 & 38) */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">Platform Actions:</span>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/series"
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Tv className="size-3.5" />
              Series Management
            </Link>
            <Link
              to="/admin/builder"
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <GitBranch className="size-3.5" />
              Story Builder
            </Link>
            <Link
              to="/admin/creators"
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Users className="size-3.5" />
              Creator Management
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 8. CREATE EXPERIMENT MODAL (Section 28 of spec)
// --------------------------------------------------------------------------

export function CreateExperimentModal() {
  const { isCreateExperimentOpen, closeCreateExperiment, createExperiment } = useStoryLab();

  const [name, setName] = useState("");
  const [storyTitle, setStoryTitle] = useState("The Missing Phone");
  const [episode, setEpisode] = useState("Episode 3");
  const [hypothesis, setHypothesis] = useState(
    "Moving the interactive choice closer to the episode cliffhanger may increase participation."
  );
  const [variable, setVariable] = useState("Choice timestamp placement");
  const [controlCondition, setControlCondition] = useState("Choice at 80% episode progress");
  const [variantCondition, setVariantCondition] = useState("Choice at 92% cliffhanger peak");
  const [owner, setOwner] = useState("Editorial Intelligence Team");

  if (!isCreateExperimentOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createExperiment({
      name,
      storyTitle,
      storyId: "st-phone",
      episode,
      hypothesis,
      variable,
      controlCondition,
      variantCondition,
      startDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      endDate: "14 days from launch",
      owner,
      status: "Running",
      summaryNote: "Newly launched test. Accumulating early viewer cohort telemetry.",
      metrics: [
        {
          label: "Choice Participation",
          controlValue: "64.0%",
          variantValue: "Pending data",
          difference: "Collecting",
        },
        {
          label: "Series Continuation",
          controlValue: "71.0%",
          variantValue: "Pending data",
          difference: "Collecting",
        },
      ],
    });

    closeCreateExperiment();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeCreateExperiment}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="size-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">
            Create Controlled Story Experiment
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Test storytelling hypotheses with A/B cohorts before applying full editorial changes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">
              Experiment Name
            </label>
            <input
              type="text"
              placeholder="e.g. Cliffhanger Choice Timing Test"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs rounded-lg bg-background border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Story</label>
              <select
                value={storyTitle}
                onChange={(e) => setStoryTitle(e.target.value)}
                className="w-full text-xs rounded-lg bg-background border border-border p-2"
              >
                <option value="The Missing Phone">The Missing Phone</option>
                <option value="Messages From Tomorrow">Messages From Tomorrow</option>
                <option value="Last Train Home">Last Train Home</option>
                <option value="One More Message">One More Message</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Episode Node</label>
              <input
                type="text"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                className="w-full text-xs rounded-lg bg-background border border-border p-2"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Hypothesis (What are you testing?)
            </label>
            <textarea
              rows={2}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="w-full text-xs rounded-lg bg-background border border-border p-2 focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Variable Under Test
            </label>
            <input
              type="text"
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              className="w-full text-xs rounded-lg bg-background border border-border p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <label className="font-bold text-foreground block mb-1 text-[11px]">
                Control Condition (A)
              </label>
              <textarea
                rows={2}
                value={controlCondition}
                onChange={(e) => setControlCondition(e.target.value)}
                className="w-full text-xs rounded-md bg-background border border-border p-1.5"
              />
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <label className="font-bold text-primary block mb-1 text-[11px]">
                Variant Condition (B)
              </label>
              <textarea
                rows={2}
                value={variantCondition}
                onChange={(e) => setVariantCondition(e.target.value)}
                className="w-full text-xs rounded-md bg-background border border-border p-1.5"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Owner</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full text-xs rounded-lg bg-background border border-border p-2"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeCreateExperiment}
              className="px-3 py-2 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs"
            >
              Launch Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
