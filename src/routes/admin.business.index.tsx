import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  Users,
  Activity,
  Coins,
  Tv,
  Clapperboard,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileText,
  Flame,
  ShieldAlert,
  ArrowRight,
  Crown,
  Share2,
} from "lucide-react";
import { useBusiness } from "@/lib/business-state";
import {
  executiveViewSummary,
} from "@/lib/business-data";
import {
  ExecutiveKpiCard,
  BusinessSnapshotCard,
  AudienceFunnelVisual,
  BusinessSignalCard,
  AttentionCard,
  ExecutiveViewPanel,
  BusinessFilterBar,
  DataFreshnessIndicator,
} from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — OVERVIEW
   Route: /admin/business
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   "How is ShortReel performing as a platform and business?"
   ========================================================================== */

export const Route = createFileRoute("/admin/business/")({
  component: BusinessOverviewPage,
});

function BusinessOverviewPage() {
  const { kpis, snapshot, funnelData, signals, attentionItems, filters } = useBusiness();

  const [activeKpiCategory, setActiveKpiCategory] = useState<
    "All" | "Audience" | "Engagement" | "Monetisation" | "Content"
  >("All");

  const filteredKpis =
    activeKpiCategory === "All"
      ? kpis
      : kpis.filter((k) => k.category === activeKpiCategory);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER & EXECUTIVE HERO (Section 5) */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-primary/20">
              <Briefcase className="size-3.5" />
              Executive Intelligence Layer
            </span>
            <span className="text-xs text-muted-foreground">• Iteration 4E</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Business Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Understand audience growth, engagement, monetisation and platform health.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <DataFreshnessIndicator />
          <Link
            to="/admin/business/reports"
            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="size-3.5" />
            Executive Reports
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. GLOBAL BUSINESS FILTER BAR (Section 5 & 38) */}
      {/* ------------------------------------------------------------------ */}
      <BusinessFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 3. EXECUTIVE VIEW SUMMARY PANEL (Section 35) */}
      {/* ------------------------------------------------------------------ */}
      <ExecutiveViewPanel summary={executiveViewSummary} />

      {/* ------------------------------------------------------------------ */}
      {/* 4. EXECUTIVE KPIS SECTION (Section 6) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Executive Performance Indicators
            </h2>
            <p className="text-xs text-muted-foreground">
              Core platform metrics for {filters.period}.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs overflow-x-auto">
            {(["All", "Audience", "Engagement", "Monetisation", "Content"] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveKpiCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeKpiCategory === cat
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredKpis.map((kpi) => (
            <ExecutiveKpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. PLATFORM SNAPSHOT (Section 7) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Platform Snapshot
            </h2>
            <p className="text-xs text-muted-foreground">
              Directional observations across key operating pillars.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {snapshot.map((item) => (
            <BusinessSnapshotCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. AUDIENCE FUNNEL & CONVERSION (Section 9) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AudienceFunnelVisual steps={funnelData} />
        </div>

        {/* Funnel Insights & Health */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Conversion Architecture
            </span>
            <h3 className="font-bold text-base text-foreground mb-2">
              Organic Audience Multiplication
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              68% of registered accounts stream their first episode within 24 hours. The
              transition from Episode 1 to interactive choice participation drives the highest
              downstream subscriber conversion rate (41.4%).
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border flex justify-between items-center">
                <span className="text-muted-foreground">Visitor to Registered</span>
                <span className="font-bold text-foreground">42.0%</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border flex justify-between items-center">
                <span className="text-muted-foreground">First Watch to Returning</span>
                <span className="font-bold text-foreground">51.0%</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex justify-between items-center font-semibold">
                <span>Engaged to Paid Subscriber</span>
                <span className="font-bold">41.4%</span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/business/audience"
            className="text-xs font-semibold text-primary hover:underline flex items-center justify-between pt-3 border-t border-border"
          >
            <span>Deep Dive into Audience Segments & Retention</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 7. BUSINESS SIGNALS (Section 33 & 34) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              Business Signals & Story Lab Connection
            </h2>
            <p className="text-xs text-muted-foreground">
              Directional signals bridging platform business performance with Story Lab editorial intelligence.
            </p>
          </div>
          <Link
            to="/admin/story-lab"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            Open Story Lab Overview
            <ChevronRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {signals.map((sig) => (
            <BusinessSignalCard key={sig.id} signal={sig} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 8. REQUIRES ATTENTION (Section 36) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" />
              Requires Attention
            </h2>
            <p className="text-xs text-muted-foreground">
              Operational observations and data reconciliation items identified for human review.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {attentionItems.map((item) => (
            <AttentionCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 9. SUB-WORKSPACES DIRECTORY (Section 4) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Business Intelligence Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/business/audience"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Audience & Retention
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              User segments, cohort retention curves (D1–D90), and regional language distribution.
            </p>
          </Link>

          <Link
            to="/admin/business/engagement"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Activity className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Engagement & Interaction
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Watch time trends, engagement journey steps, and interactive vs standard consumption.
            </p>
          </Link>

          <Link
            to="/admin/business/subscriptions"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Crown className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Subscriptions & Funnel
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              VIP plan renewal rates, trial conversion velocity, and subscriber retention.
            </p>
          </Link>

          <Link
            to="/admin/business/revenue"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Coins className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Revenue & ARPU
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              MRR trends, revenue mix breakdown, blended ARPU, and monthly churn telemetry.
            </p>
          </Link>

          <Link
            to="/admin/business/content-economics"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Tv className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Content Economics
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Watch time vs completion performance matrix, catalog monetisation, and premium tiers.
            </p>
          </Link>

          <Link
            to="/admin/business/creator-economics"
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Clapperboard className="size-4" />
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Creator Economics
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Creator onboarding funnel, publishing health, earnings share, and ecosystem retention.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
