import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Info,
  ChevronRight,
  ExternalLink,
  Users,
  Clock,
  Coins,
  Tv,
  Layers,
  FileText,
  Download,
  X,
  ShieldAlert,
  GitBranch,
  Crown,
  Eye,
  Activity,
} from "lucide-react";
import {
  type ExecutiveKPI,
  type PlatformSnapshotItem,
  type FunnelStep,
  type RetentionCohort,
  type ContentMatrixItem,
  type BusinessSignal,
  type AttentionItem,
  type BusinessReport,
  type BusinessPeriod,
  type EngagementJourneyStep,
  engagementJourneyData,
} from "@/lib/business-data";
import { useBusiness } from "@/lib/business-state";

/* ==========================================================================
   BUSINESS DASHBOARD — REUSABLE EXECUTIVE COMPONENTS
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. DATA FRESHNESS INDICATOR (Section 49)
// --------------------------------------------------------------------------
export function DataFreshnessIndicator() {
  const { dataFreshness } = useBusiness();
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground text-[11px] font-medium border border-border">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span>{dataFreshness}</span>
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. EXECUTIVE KPI CARD (Section 6)
// --------------------------------------------------------------------------
export function ExecutiveKpiCard({ kpi }: { kpi: ExecutiveKPI }) {
  const isUp = kpi.direction === "up";
  const isNeutral = kpi.direction === "neutral";

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="font-semibold uppercase text-[10px] tracking-wider text-muted-foreground">
            {kpi.label}
          </span>
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
              kpi.isPositiveChange
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
            }`}
          >
            {isUp && <TrendingUp className="size-3" />}
            {!isUp && !isNeutral && <TrendingDown className="size-3" />}
            {kpi.changePercentage}
          </span>
        </div>

        <div className="text-2xl font-black text-foreground tracking-tight my-1.5">
          {kpi.currentValue}
        </div>
      </div>

      <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="truncate pr-1">{kpi.description}</span>
        <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
          vs {kpi.previousValue}
        </span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. PLATFORM SNAPSHOT CARD (Section 7)
// --------------------------------------------------------------------------
export function BusinessSnapshotCard({ item }: { item: PlatformSnapshotItem }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {item.category}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
            {item.change}
          </span>
        </div>

        <div className="text-2xl font-black text-foreground mb-0.5">
          {item.stat}
        </div>
        <p className="text-xs text-muted-foreground mb-3">{item.label}</p>

        <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground block text-[11px] mb-0.5">
            Observation:
          </strong>
          {item.observation}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. AUDIENCE FUNNEL VISUAL (Section 9)
// --------------------------------------------------------------------------
export function AudienceFunnelVisual({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Audience Conversion Funnel
          </h3>
          <p className="text-xs text-muted-foreground">
            Top-of-funnel visitor acquisition through engaged paid subscribers.
          </p>
        </div>
        <span className="text-xs bg-muted px-2.5 py-1 rounded text-muted-foreground">
          Overall Conversion: {steps[steps.length - 1]?.conversionFromTop}%
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          return (
            <div key={step.label} className="relative">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-foreground">{step.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{step.formattedUsers}</span>
                  <span className="font-bold text-foreground w-12 text-right">
                    {step.conversionFromPrevious}%
                  </span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="h-3 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-500"
                  style={{ width: `${Math.max(5, step.conversionFromTop)}%` }}
                />
              </div>

              {idx < steps.length - 1 && (
                <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    ↓ Step Conversion
                  </span>
                  <span className="font-medium text-foreground">
                    {steps[idx + 1]?.conversionFromPrevious}% continue
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. RETENTION MATRIX (Section 10)
// --------------------------------------------------------------------------
export function RetentionMatrix({ cohorts }: { cohorts: RetentionCohort[] }) {
  const getCellBg = (rate: number) => {
    if (rate >= 40) return "bg-primary/20 text-primary font-bold";
    if (rate >= 25) return "bg-primary/15 text-foreground font-semibold";
    if (rate >= 15) return "bg-primary/10 text-foreground";
    return "bg-muted/40 text-muted-foreground";
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-foreground">Audience Retention Cohorts</h3>
          <p className="text-xs text-muted-foreground">
            Retention percentage over Day 1 to Day 90 intervals.
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground italic">
          Directional mock telemetry
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">Cohort</th>
              <th className="py-2.5 px-3">Users</th>
              <th className="py-2.5 px-3 text-center">Day 1</th>
              <th className="py-2.5 px-3 text-center">Day 7</th>
              <th className="py-2.5 px-3 text-center">Day 14</th>
              <th className="py-2.5 px-3 text-center">Day 30</th>
              <th className="py-2.5 px-3 text-center">Day 60</th>
              <th className="py-2.5 px-3 text-center">Day 90</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {cohorts.map((c) => (
              <tr key={c.cohort} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground">{c.cohort}</td>
                <td className="py-3 px-3 text-muted-foreground">{c.users}</td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${getCellBg(c.d1)}`}>
                    {c.d1}%
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${getCellBg(c.d7)}`}>
                    {c.d7}%
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${getCellBg(c.d14)}`}>
                    {c.d14}%
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${getCellBg(c.d30)}`}>
                    {c.d30}%
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${getCellBg(c.d60)}`}>
                    {c.d60}%
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${getCellBg(c.d90)}`}>
                    {c.d90}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 6. ENGAGEMENT JOURNEY VISUAL (Section 13)
// --------------------------------------------------------------------------
export function EngagementJourneyVisual({
  steps,
}: {
  steps?: EngagementJourneyStep[];
} = {}) {
  const displaySteps = steps && steps.length > 0 ? steps : engagementJourneyData;

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Activity className="size-4 text-purple-600 dark:text-purple-400" />
            ShortReel Differentiated Engagement Journey
          </h3>
          <p className="text-xs text-muted-foreground">
            End-to-end user micro-conversions from app open through character follows and session recurrence.
          </p>
        </div>
      </div>

      {/* Horizontal journey trail */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {displaySteps.map((st, idx) => {
          const isHighlight = st.isInteractivePeak || (st as any).highlight;
          const label = st.name || (st as any).label || `Step ${idx + 1}`;
          const rate = st.conversionRate !== undefined ? `${st.conversionRate}%` : (st as any).rate || "—";
          const desc = st.description || (st as any).desc || "";

          return (
            <div
              key={st.name || idx}
              className={`p-3 rounded-xl border text-center flex flex-col justify-between ${
                isHighlight
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300"
                  : "bg-muted/30 border-border text-foreground"
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-muted-foreground block mb-1">
                  Step 0{st.stepNumber || idx + 1}
                </span>
                <span className="font-bold text-xs block leading-tight mb-2 uppercase">
                  {label}
                </span>
              </div>
              <div>
                <span className="text-base font-black block text-foreground font-mono">
                  {rate}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5 leading-tight">
                  {desc}
                </span>
                {st.users && (
                  <span className="text-[9px] text-muted-foreground/80 block mt-1 font-mono">
                    {st.users}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 7. CONTENT PERFORMANCE MATRIX (Section 24)
// --------------------------------------------------------------------------
export function ContentPerformanceMatrixChart({
  items,
}: {
  items: ContentMatrixItem[];
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Tv className="size-4 text-primary" />
            Content Performance Matrix
          </h3>
          <p className="text-xs text-muted-foreground">
            Explore the relationship between aggregate watch time (X) and completion rate (Y).
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-purple-600" /> Interactive
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-600" /> Standard
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-600" /> Premium
          </span>
        </div>
      </div>

      {/* Visual Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    item.category === "Interactive"
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                      : item.category === "Premium"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  }`}
                >
                  {item.category}
                </span>
                <span className="text-[11px] text-muted-foreground">{item.genre}</span>
              </div>

              <h4 className="font-bold text-xs text-foreground mb-0.5">{item.title}</h4>
              <p className="text-[11px] text-muted-foreground mb-3">By {item.creatorName}</p>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-border/60">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-[11px]">Watch Time:</span>
                <span className="font-bold text-foreground">
                  {item.watchTimeHours.toLocaleString()} hrs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-[11px]">Completion Rate:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {item.completionPercentage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-[11px]">Audience Reach:</span>
                <span className="font-medium text-foreground">
                  {(item.audienceReach / 1000).toFixed(1)}M viewers
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground">
        <strong>Matrix Note: </strong>
        This matrix helps teams explore relationships between audience consumption volume and completion behaviour. It is an analytical tool, not a winner/loser ranking.
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 8. BUSINESS SIGNAL CARD (Section 33 & 34)
// --------------------------------------------------------------------------
export function BusinessSignalCard({ signal }: { signal: BusinessSignal }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            {signal.category} Signal
          </span>
          <span className="text-[11px] text-muted-foreground">{signal.period}</span>
        </div>

        <h4 className="font-bold text-sm text-foreground mb-1.5">{signal.title}</h4>

        <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs mb-3">
          <strong className="text-foreground block text-[10px] uppercase tracking-wider mb-0.5">
            Observation:
          </strong>
          <p className="text-muted-foreground leading-relaxed font-medium">
            {signal.observation}
          </p>
        </div>

        <div className="p-2 rounded bg-card border border-border text-xs text-muted-foreground mb-4">
          <span className="text-[10px] uppercase font-bold text-foreground block mb-0.5">
            Supporting Telemetry:
          </span>
          {signal.supportingData}
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <Link
          to={signal.moduleLinkUrl}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
        >
          <span>{signal.moduleLinkText}</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 9. ATTENTION CARD (Section 36)
// --------------------------------------------------------------------------
export function AttentionCard({ item }: { item: AttentionItem }) {
  const { dismissAttentionItem } = useBusiness();

  const getStyle = (s: string) => {
    switch (s) {
      case "Attention":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "Data Quality":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStyle(
              item.severity
            )}`}
          >
            {item.severity}
          </span>
          <span className="text-[10px] text-muted-foreground">{item.detectedAt}</span>
        </div>

        <h4 className="font-bold text-xs text-foreground mb-1">{item.title}</h4>
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
          {item.description}
        </p>

        <div className="p-2 rounded bg-muted/40 border border-border text-[11px] text-foreground mb-3">
          <strong className="text-muted-foreground block text-[10px] uppercase">
            Observed Impact:
          </strong>
          {item.observedImpact}
        </div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
        <Link
          to={item.actionUrl}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          {item.actionLabel}
          <ChevronRight className="size-3" />
        </Link>
        <button
          onClick={() => dismissAttentionItem(item.id)}
          className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-[11px] font-medium hover:bg-secondary/80 transition-colors"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 10. EXECUTIVE VIEW SUMMARY PANEL (Section 35)
// --------------------------------------------------------------------------
export function ExecutiveViewPanel({
  summary,
}: {
  summary: Record<string, { headline: string; change: string; text: string }>;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Executive Briefing Summary
          </h3>
          <p className="text-xs text-muted-foreground">
            Neutral observational synthesis across core platform business pillars.
          </p>
        </div>
        <DataFreshnessIndicator />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
        {Object.entries(summary).map(([key, val]) => (
          <div
            key={key}
            className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {key}
                </span>
                <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  {val.change}
                </span>
              </div>
              <h4 className="font-semibold text-foreground text-xs mb-1">
                {val.headline}
              </h4>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                {val.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// 11. GLOBAL BUSINESS FILTER BAR (Section 38)
// --------------------------------------------------------------------------
export function BusinessFilterBar() {
  const {
    filters,
    setPeriod,
    setLanguage,
    setPlatform,
    setSubscriptionPlan,
    setContentType,
    setSearchQuery,
    resetFilters,
  } = useBusiness();

  const [expanded, setExpanded] = useState(false);

  const periods: BusinessPeriod[] = [
    "Today",
    "Last 7 Days",
    "Last 30 Days",
    "Last 90 Days",
    "This Year",
    "Custom",
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Period Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Calendar className="size-3.5" />
            Period:
          </span>
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filters.period === p
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Search & Toggle More Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search business metrics & stories..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-hidden"
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

          {(filters.language !== "All" ||
            filters.platform !== "All" ||
            filters.subscriptionPlan !== "All" ||
            filters.contentType !== "All" ||
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

      {expanded && (
        <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Language Market
            </label>
            <select
              value={filters.language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Languages</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English / Hinglish</option>
              <option value="Telugu">Telugu</option>
              <option value="Tamil">Tamil</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Platform Channel
            </label>
            <select
              value={filters.platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Platforms</option>
              <option value="Mobile App (iOS/Android)">Mobile App</option>
              <option value="Mobile Web">Mobile Web</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Subscription Plan
            </label>
            <select
              value={filters.subscriptionPlan}
              onChange={(e) => setSubscriptionPlan(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Users</option>
              <option value="Monthly VIP">Monthly VIP</option>
              <option value="Quarterly VIP">Quarterly VIP</option>
              <option value="Annual VIP">Annual VIP</option>
              <option value="Free">Free Users</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
              Content Type
            </label>
            <select
              value={filters.contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full text-xs rounded-md bg-background border border-border p-1.5"
            >
              <option value="All">All Formats</option>
              <option value="Interactive">Interactive Stories</option>
              <option value="Standard">Standard Stories</option>
              <option value="Premium">Premium VIP Stories</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// 12. BUSINESS REPORT MODAL (Section 37)
// --------------------------------------------------------------------------
export function BusinessReportModal() {
  const { selectedReport, closeReportModal, exportReport } = useBusiness();
  const [downloaded, setDownloaded] = useState(false);

  if (!selectedReport) return null;

  const handleExport = () => {
    exportReport(selectedReport);
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      closeReportModal();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-lg w-full p-6 relative">
        <button
          onClick={closeReportModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <FileText className="size-5 text-primary" />
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
            {selectedReport.cadence} Executive Brief
          </span>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1">
          {selectedReport.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Reporting Window: {selectedReport.period} • Generated: {selectedReport.generatedDate}
        </p>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2 mb-4">
          <p className="text-foreground leading-relaxed">{selectedReport.description}</p>
          <div className="pt-2 border-t border-border/60 flex justify-between font-medium">
            <span className="text-muted-foreground">Highlight Stat:</span>
            <span className="text-foreground font-bold">{selectedReport.keyStat}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground font-mono">
            {selectedReport.fileSize}
          </span>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {downloaded ? (
              <>
                <CheckCircle2 className="size-3.5" />
                <span>Exported (Logged to Audit)</span>
              </>
            ) : (
              <>
                <Download className="size-3.5" />
                <span>Export PDF Briefing</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
