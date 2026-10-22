import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users2,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info,
  CheckCircle2,
  IndianRupee,
  Layers,
  FileText,
  Clock,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { useBusiness } from "@/lib/business-state";
import {
  BusinessFilterBar,
  DataFreshnessIndicator,
} from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — CREATOR ECONOMICS
   Route: /admin/business/creator-economics
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   ========================================================================== */

export const Route = createFileRoute("/admin/business/creator-economics")({
  component: BusinessCreatorEconomicsPage,
});

function BusinessCreatorEconomicsPage() {
  const { creatorList, creatorFunnel } = useBusiness();
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filteredCreators =
    statusFilter === "All"
      ? creatorList
      : creatorList.filter((c) => c.status === statusFilter);

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
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
              Creator Ecosystem Health
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Creator Economics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track creator acquisition velocity, production output, revenue distribution, and ecosystem retention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessIndicator />
          <Link
            to="/admin/creators"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Creator Operations</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <BusinessFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 3. PRIMARY CREATOR METRICS (Section 26) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Active Creators
          </span>
          <span className="text-xl font-black text-foreground">84</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
            +14 newly publishing
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Stories Submitted
          </span>
          <span className="text-xl font-black text-foreground">112</span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Complete series drafts
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Catalog Stories
          </span>
          <span className="text-xl font-black text-foreground">214</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
            186 actively streaming
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Creator Earnings Pool
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ₹17.6L
          </span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Gross pool payout
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Creator Retention
          </span>
          <span className="text-xl font-black text-primary">84.2%</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
            90-day active author hold
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Avg Payout / Creator
          </span>
          <span className="text-xl font-black text-foreground font-mono">
            ₹28.4K
          </span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            Across earning creators
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. CREATOR ECOSYSTEM FUNNEL (Section 27) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="size-4 text-teal-500" />
            Creator Pipeline & Publishing Funnel
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Progression from initial creator application through to active revenue generation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {creatorFunnel.map((step, idx) => (
            <div
              key={step.label}
              className="relative p-4 rounded-xl bg-muted/20 border border-border/80 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                  Step {idx + 1}
                </span>
                {idx > 0 && (
                  <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-900/40">
                    {step.conversionFromPrevious}%
                  </span>
                )}
              </div>

              <div>
                <div className="text-lg font-black text-foreground font-mono">
                  {step.formattedUsers}
                </div>
                <div className="text-xs font-semibold text-foreground mt-0.5">
                  {step.label}
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                {step.note}
              </div>

              {idx < creatorFunnel.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-background border border-border shadow-xs">
                  <ArrowRight className="size-3 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. CREATOR REVENUE TABLE (Section 28) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users2 className="size-4 text-primary" />
              Creator Revenue & Output Distribution
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Production volume, audience views, watch time, and earnings distribution across creator partners.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter status:</span>
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs">
              {(["All", "Active", "Verified"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === filter
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Creator
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-center uppercase tracking-wider text-[10px]">
                  Published Stories
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-right uppercase tracking-wider text-[10px]">
                  Total Views
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-right uppercase tracking-wider text-[10px]">
                  Watch Time
                </th>
                <th className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 text-right uppercase tracking-wider text-[10px]">
                  Period Earnings
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-center uppercase tracking-wider text-[10px]">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-center uppercase tracking-wider text-[10px]">
                  Payout State
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCreators.map((creator) => (
                <tr key={creator.creatorId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <img
                        src={creator.avatar}
                        alt={creator.creatorName}
                        className="size-8 rounded-full object-cover border border-border"
                      />
                      <div>
                        <div className="font-bold text-foreground">
                          {creator.creatorName}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {creator.handle} • {creator.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-foreground">
                    {creator.storiesCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-foreground font-mono">
                    {creator.views}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-muted-foreground font-mono">
                    {creator.watchTime}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {creator.earnings}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        creator.status === "Verified"
                          ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                      }`}
                    >
                      {creator.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        creator.payoutStatus === "Paid"
                          ? "text-muted-foreground bg-muted/60"
                          : "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60"
                      }`}
                    >
                      {creator.payoutStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
          <p>
            <strong className="font-semibold text-foreground">Governance Guideline:</strong> Per Product Principles, Creator Economics displays aggregated output and verified earnings pools. In order to promote healthy ecosystem dynamics, competitive creator scorecards and public leaderboard winner badges are intentionally omitted.
          </p>
        </div>
      </div>
    </div>
  );
}
