import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  IndianRupee,
  ChevronRight,
  TrendingUp,
  CreditCard,
  PieChart,
  DollarSign,
  AlertTriangle,
  Info,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useBusiness } from "@/lib/business-state";
import {
  BusinessFilterBar,
  DataFreshnessIndicator,
} from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — REVENUE & MONETISATION
   Route: /admin/business/revenue
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   ========================================================================== */

export const Route = createFileRoute("/admin/business/revenue")({
  component: BusinessRevenuePage,
});

function BusinessRevenuePage() {
  const { revenueTrends } = useBusiness();
  const [revenueCadence, setRevenueCadence] = useState<"Monthly" | "Weekly">("Monthly");

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
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Financial Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Revenue
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor top-line gross receipts, subscription recurrence (MRR), ARPU distributions, and revenue mix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessIndicator />
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 shadow-xs">
            <AlertTriangle className="size-3.5" />
            <span>Mock Financial Data</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <BusinessFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 3. PRIMARY REVENUE METRICS (Section 18) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Gross Revenue</span>
            <IndianRupee className="size-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-foreground">₹59.2L</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            +11.2% over previous 30d
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Subscription Rev</span>
            <CreditCard className="size-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black text-foreground">₹42.6L</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            72.0% of total revenue
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Net Platform Revenue</span>
            <DollarSign className="size-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-black text-foreground">₹54.8L</div>
          <div className="text-[10px] text-muted-foreground font-medium mt-1">
            Post payment processing
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Monthly Recurring (MRR)</span>
            <TrendingUp className="size-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-foreground">₹36.8L</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            +8.6% normalized run-rate
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Refund Rate</span>
            <ShieldAlert className="size-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-foreground">₹42.8K</div>
          <div className="text-[10px] text-muted-foreground font-medium mt-1">
            0.7% refund dispute ratio
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. REVENUE TREND (Section 19) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Revenue Trajectory & Streams
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Historical gross revenue progression across Subscription, Premium Content, and Other streams.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/60 border border-border text-xs">
            {(["Monthly", "Weekly"] as const).map((cadence) => (
              <button
                key={cadence}
                onClick={() => setRevenueCadence(cadence)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  revenueCadence === cadence
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cadence}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Stacked Trend Bars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {revenueTrends.map((point) => (
            <div
              key={point.month}
              className="p-3.5 rounded-xl bg-muted/20 border border-border/80 flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  {point.month}
                </span>
                <span className="text-lg font-black text-foreground font-mono mt-1 block">
                  ₹{point.totalGrossRevenue.toFixed(1)}L
                </span>
              </div>

              {/* Stacked Stream Bars */}
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-muted flex overflow-hidden">
                  <div
                    className="bg-blue-500 h-full"
                    style={{
                      width: `${(point.subscriptionRevenue / point.totalGrossRevenue) * 100}%`,
                    }}
                    title={`Subscriptions: ₹${point.subscriptionRevenue}L`}
                  />
                  <div
                    className="bg-purple-500 h-full"
                    style={{
                      width: `${(point.premiumContentRevenue / point.totalGrossRevenue) * 100}%`,
                    }}
                    title={`Premium Content: ₹${point.premiumContentRevenue}L`}
                  />
                  <div
                    className="bg-amber-500 h-full"
                    style={{
                      width: `${(point.otherRevenue / point.totalGrossRevenue) * 100}%`,
                    }}
                    title={`Other: ₹${point.otherRevenue}L`}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground flex justify-between font-mono">
                  <span>Sub: ₹{point.subscriptionRevenue}L</span>
                  <span>Prem: ₹{point.premiumContentRevenue}L</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-blue-500" />
            <span>Subscription Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-purple-500" />
            <span>Premium Episode Unlocks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-amber-500" />
            <span>Interactive Events & Tips</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. REVENUE MIX & ARPU (Section 20 & 21) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* REVENUE MIX */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieChart className="size-4 text-primary" />
              Revenue Mix
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              Current Period Total: ₹59.2L
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-foreground">Subscriptions</span>
                <span className="font-bold text-foreground font-mono">72% (₹42.6L)</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "72%" }} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Recurring Monthly, Quarterly, and Annual VIP subscriptions.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-foreground">Premium Content Unlocks</span>
                <span className="font-bold text-foreground font-mono">18% (₹10.6L)</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: "18%" }} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Early access token purchases and single series passes.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-foreground">Other Revenue</span>
                <span className="font-bold text-foreground font-mono">10% (₹6.0L)</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "10%" }} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Creator tipping, interactive event passes, and digital collectibles.
              </span>
            </div>
          </div>
        </div>

        {/* ARPU SECTION */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <DollarSign className="size-4 text-emerald-500" />
              Average Revenue Per User (ARPU)
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              Evaluated across active cohorts
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Overall ARPU
              </span>
              <span className="text-lg font-black text-foreground font-mono">₹70.3</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Per monthly active user
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                VIP Subscriber ARPU
              </span>
              <span className="text-lg font-black text-primary font-mono">₹331.7</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Per active VIP account
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Free Viewer ARPU
              </span>
              <span className="text-lg font-black text-foreground font-mono">₹14.8</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Through token micro-buys
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            <p>
              <strong className="font-semibold text-foreground">Descriptive Metric Note:</strong> ARPU represents aggregated gross revenue normalized across active user cohorts. It provides comparative visibility across cohorts without prescribing strategic customer valuation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
