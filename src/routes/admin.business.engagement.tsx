import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ChevronRight,
  TrendingUp,
  Clock,
  PlaySquare,
  Sparkles,
  Share2,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  Vote,
  Target,
  BarChart3,
} from "lucide-react";
import { useBusiness } from "@/lib/business-state";
import {
  EngagementJourneyVisual,
  BusinessFilterBar,
  DataFreshnessIndicator,
} from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — ENGAGEMENT DASHBOARD
   Route: /admin/business/engagement
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   ========================================================================== */

export const Route = createFileRoute("/admin/business/engagement")({
  component: BusinessEngagementPage,
});

function BusinessEngagementPage() {
  const { watchTrends, interactiveComparison, journeySteps } = useBusiness();
  const [trendCadence, setTrendCadence] = useState<"Daily" | "Weekly" | "Monthly">("Monthly");
  const [contentTypeFilter, setContentTypeFilter] = useState<"All" | "Standard" | "Interactive">("All");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin/business"
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
            >
              Business Dashboard
              <ChevronRight className="size-3" />
            </Link>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Engagement Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Engagement
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Understand how audiences consume, interact, make narrative choices, and return to ShortReel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessIndicator />
          <Link
            to="/admin/story-lab/interactive"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Story Lab Interactive Signals</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <BusinessFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 3. PRIMARY ENGAGEMENT METRICS (Section 11) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Total Watch Time</span>
            <Clock className="size-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black text-foreground">42.8M min</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            +16.2% vs previous 30d
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Avg Session Duration</span>
            <Activity className="size-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-black text-foreground">18.4 min</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            +5.4% time in vertical feed
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Episodes Streamed</span>
            <PlaySquare className="size-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-foreground">6.2M</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            +19.8% episode views
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Completion Rate</span>
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-foreground">68.4%</div>
          <div className="text-[10px] text-muted-foreground font-medium mt-1">
            Stable series retention
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Choice Participation</span>
            <Sparkles className="size-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-foreground">52.1%</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            +4.3 pp vote engagement
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Total Votes</span>
            <Vote className="size-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-foreground">482K</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Community decisions
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Branch Predictions</span>
            <Target className="size-3.5 text-teal-500" />
          </div>
          <div className="text-xl font-black text-foreground">214K</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Outcome predictions logged
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">External Shares</span>
            <Share2 className="size-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-black text-foreground">118K</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Deep-links & clip exports
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Character Follows</span>
            <UserCheck className="size-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-foreground">235K</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Direct character subscribers
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">48h Return Rate</span>
            <TrendingUp className="size-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-foreground">64.0%</div>
          <div className="text-[10px] text-muted-foreground font-medium mt-1">
            Recurring viewer loop
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. WATCH TIME TREND & BREAKDOWN (Section 12) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-blue-500" />
              Watch Time Trajectory
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aggregate watch hours split between standard linear narrative and interactive branching episodes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Standard / Interactive Filter */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs">
              {(["All", "Standard", "Interactive"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setContentTypeFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    contentTypeFilter === filter
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Cadence Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs">
              {(["Daily", "Weekly", "Monthly"] as const).map((cadence) => (
                <button
                  key={cadence}
                  onClick={() => setTrendCadence(cadence)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    trendCadence === cadence
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cadence}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Trend Bars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {watchTrends.map((trend) => {
            const displayHours =
              contentTypeFilter === "Standard"
                ? trend.standardHours
                : contentTypeFilter === "Interactive"
                  ? trend.interactiveHours
                  : trend.totalHours;

            return (
              <div
                key={trend.period}
                className="p-4 rounded-xl bg-muted/20 border border-border/70 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{trend.period}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {trend.avgMinutesPerViewer}m / viewer
                  </span>
                </div>

                <div className="text-2xl font-black text-foreground">
                  {(displayHours / 1000).toFixed(1)}k hrs
                </div>

                {/* Progress bar comparison */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Standard ({((trend.standardHours / trend.totalHours) * 100).toFixed(0)}%)</span>
                    <span>Interactive ({((trend.interactiveHours / trend.totalHours) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted flex overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${(trend.standardHours / trend.totalHours) * 100}%` }}
                    />
                    <div
                      className="bg-purple-500 h-full transition-all"
                      style={{ width: `${(trend.interactiveHours / trend.totalHours) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/50">
                  <span>Avg Session:</span>
                  <span className="font-semibold text-foreground">{trend.avgSessionDuration} min</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. ENGAGEMENT JOURNEY (Section 13) */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            ShortReel Interactive Engagement Journey
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualise audience flow across the nine-stage engagement model, highlighting the choice cliffhanger peak.
          </p>
        </div>

        <EngagementJourneyVisual steps={journeySteps} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. INTERACTIVE VS STANDARD CONSUMPTION (Section 14) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-purple-500" />
              Interactive vs Standard Consumption
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Empirical side-by-side comparison across narrative formats.
            </p>
          </div>

          <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
            Observed platform metrics
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Metric
                </th>
                <th className="py-3 px-4 font-semibold text-purple-600 dark:text-purple-400 text-center uppercase tracking-wider text-[10px]">
                  Interactive Content
                </th>
                <th className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400 text-center uppercase tracking-wider text-[10px]">
                  Standard Linear Content
                </th>
                <th className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 text-center uppercase tracking-wider text-[10px]">
                  Observed Difference
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Executive Observation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {interactiveComparison.map((row) => (
                <tr key={row.metric} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {row.metric}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-purple-700 dark:text-purple-300 font-mono">
                    {row.interactiveValue}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-blue-700 dark:text-blue-300 font-mono">
                    {row.standardValue}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-[11px] font-mono">
                      {row.difference}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs leading-relaxed max-w-md">
                    {row.observation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <p>
            <strong className="font-semibold text-foreground">Analytical Note:</strong> Metrics reflect aggregated viewing telemetry over the selected period. Differences reflect observed behavioral habits rather than intrinsic superiority of either medium.
          </p>
        </div>
      </div>
    </div>
  );
}
