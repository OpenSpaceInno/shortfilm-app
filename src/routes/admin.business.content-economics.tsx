import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Film,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Layers,
  Lock,
  Unlock,
  Clock,
  PlaySquare,
  CheckCircle2,
  ExternalLink,
  Info,
  IndianRupee,
  BarChart2,
} from "lucide-react";
import { useBusiness } from "@/lib/business-state";
import {
  ContentPerformanceMatrixChart,
  BusinessFilterBar,
  DataFreshnessIndicator,
} from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — CONTENT ECONOMICS
   Route: /admin/business/content-economics
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   ========================================================================== */

export const Route = createFileRoute("/admin/business/content-economics")({
  component: BusinessContentEconomicsPage,
});

function BusinessContentEconomicsPage() {
  const { contentMatrix } = useBusiness();

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
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Content Portfolio Economics
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Content Economics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Analyze the relationship between catalog expansion, viewing consumption, completion rates, and monetisation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessIndicator />
          <Link
            to="/admin/story-lab/stories"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Story Lab Story Intelligence</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <BusinessFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 3. CONTENT PORTFOLIO OVERVIEW (Section 23) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Total Stories
          </span>
          <span className="text-xl font-black text-foreground">214</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
            +18 releases (30d)
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Active Catalog
          </span>
          <span className="text-xl font-black text-foreground">186</span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Actively streaming
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Published Episodes
          </span>
          <span className="text-xl font-black text-foreground">1,280</span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Avg 6 ep / series
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block mb-1">
            Interactive Stories
          </span>
          <span className="text-xl font-black text-purple-700 dark:text-purple-300">42</span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-1 font-medium">
            19.6% of portfolio
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Total Watch Time
          </span>
          <span className="text-xl font-black text-foreground">42.8M m</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
            +16.2% catalog hold
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-1">
            Premium Stories
          </span>
          <span className="text-xl font-black text-amber-700 dark:text-amber-300">64</span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Requires VIP or unlock
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
            Free Stories
          </span>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">150</span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Acquisition drivers
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. CONTENT PERFORMANCE MATRIX (Section 24) */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="size-4 text-purple-500" />
            Content Performance Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualise stories across consumption volume (X: Watch Time) and engagement depth (Y: Completion Rate), sized by audience reach.
          </p>
        </div>

        <ContentPerformanceMatrixChart items={contentMatrix} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. CONTENT MONETISATION & PREMIUM TELEMETRY (Section 25) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Lock className="size-4 text-amber-500" />
              Content Monetisation Telemetry
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aggregated engagement metrics around paywalled and early-access episodes.
            </p>
          </div>

          <div className="px-3 py-1 rounded-full bg-muted/60 border border-border text-[11px] text-muted-foreground">
            No 1:1 attribution claimed — observed correlations only
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Premium Episode Views
            </span>
            <span className="text-2xl font-black text-foreground">1.42M</span>
            <span className="text-[10px] text-muted-foreground block">
              22.9% of all episode streams
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Premium Completion Rate
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              76.4%
            </span>
            <span className="text-[10px] text-muted-foreground block">
              +8.0 pp vs free episodes
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Sub Starts After Premium Hook
            </span>
            <span className="text-2xl font-black text-foreground">18,400</span>
            <span className="text-[10px] text-muted-foreground block">
              First episode cliffhanger conversions
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Associated Premium Revenue
            </span>
            <span className="text-2xl font-black text-foreground font-mono">
              ₹10.6L
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Direct unlocks and early passes
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-foreground">Methodology Notice:</strong> Per Iteration 4E principles, subscription conversions following a premium episode view represent temporal association rather than guaranteed causal attribution. Deeper attribution models will be enabled in future telemetry iterations.
          </p>
        </div>
      </div>
    </div>
  );
}
