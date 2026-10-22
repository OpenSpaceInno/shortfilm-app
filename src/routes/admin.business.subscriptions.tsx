import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreditCard,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
  Repeat,
  UserX,
  Sparkles,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { useBusiness } from "@/lib/business-state";
import {
  fetchSubscriberCohorts,
  type SubscriberCohort,
} from "@/lib/business-api";
import {
  BusinessFilterBar,
  DataFreshnessIndicator,
} from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — SUBSCRIPTIONS DASHBOARD
   Route: /admin/business/subscriptions
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   ========================================================================== */

export const Route = createFileRoute("/admin/business/subscriptions")({
  component: BusinessSubscriptionsPage,
});

function BusinessSubscriptionsPage() {
  const { plans, subFunnel } = useBusiness();
  const [selectedPlanView, setSelectedPlanView] = useState<string>("All");
  const [cohorts, setCohorts] = useState<SubscriberCohort[]>([]);
  const [overallMoM, setOverallMoM] = useState<number[]>([100, 91.2, 85.2, 80.7, 77.2, 74.2]);
  const [avgLifetime, setAvgLifetime] = useState<number>(9.2);

  useEffect(() => {
    fetchSubscriberCohorts().then((res) => {
      if (res && res.cohorts && res.cohorts.length > 0) {
        setCohorts(res.cohorts);
        if (res.overallMoMRetention) setOverallMoM(res.overallMoMRetention);
        if (res.averageSubscriberLifetimeMonths) setAvgLifetime(res.averageSubscriberLifetimeMonths);
      }
    });
  }, []);

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
              Subscription Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Subscriptions
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor subscriber base growth, plan renewal dynamics, trial conversions, and cohort churn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessIndicator />
          <Link
            to="/admin/subscriptions"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Plan Configuration</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <BusinessFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 3. PRIMARY SUBSCRIPTION METRICS (Section 15) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Active Subscribers</span>
            <Users className="size-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black text-foreground">128,420</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            +8.4% vs previous 30d
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">New Subscribers</span>
            <TrendingUp className="size-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-foreground">14,800</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            First-time VIP converts
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Monthly Renewals</span>
            <Repeat className="size-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-black text-foreground">96,400</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            81.2% aggregate renewal
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Trial Conversion</span>
            <Sparkles className="size-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-foreground">43.7%</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            +2.1 pp trial completion
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-[10px] uppercase font-bold">Subscription Churn</span>
            <UserX className="size-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-foreground">6.4%</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            -0.8 pp churn reduction
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. SUBSCRIPTION FUNNEL (Section 16) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="size-4 text-blue-500" />
            Free to Paid Subscription Journey
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Step-by-step conversion progression from free vertical streamer to renewed VIP subscriber.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {subFunnel.map((step, idx) => (
            <div
              key={step.label}
              className="relative p-4 rounded-xl bg-muted/20 border border-border/80 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                  Stage {idx + 1}
                </span>
                {idx > 0 && (
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/40">
                    {step.conversionFromPrevious}% conv
                  </span>
                )}
              </div>

              <div>
                <div className="text-lg font-black text-foreground">
                  {step.formattedUsers}
                </div>
                <div className="text-xs font-semibold text-foreground mt-0.5">
                  {step.label}
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/50">
                {step.note}
              </div>

              {idx < subFunnel.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-background border border-border shadow-xs">
                  <ArrowRight className="size-3 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. SUBSCRIPTION PLAN PERFORMANCE TABLE (Section 17) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              Subscription Plan Performance
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active plan breakdown across subscriber count, revenue contribution, renewal tenacity, and churn.
            </p>
          </div>

          <div className="px-3 py-1 rounded-full bg-muted/60 border border-border text-[11px] text-muted-foreground">
            Mock Data — Evaluated across active billing periods
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Plan Name
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Cadence & Pricing
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-right uppercase tracking-wider text-[10px]">
                  Subscribers
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-right uppercase tracking-wider text-[10px]">
                  Gross Revenue
                </th>
                <th className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 text-center uppercase tracking-wider text-[10px]">
                  Renewal Rate
                </th>
                <th className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400 text-center uppercase tracking-wider text-[10px]">
                  Monthly Churn
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-right uppercase tracking-wider text-[10px]">
                  Avg Lifetime
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plans.map((p) => (
                <tr key={p.planId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    {p.name}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground font-mono">
                    {p.price}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-foreground font-mono">
                    {p.subscribers}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-foreground font-mono">
                    {p.revenue}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold font-mono">
                      {p.renewalRate}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bold font-mono">
                      {p.churnRate}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-muted-foreground font-semibold">
                    {p.avgLifetimeMonths} mos
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5.5 SUBSCRIBER RETENTION COHORT MATRIX (M26) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-blue-500" />
              Subscriber Acquisition Cohorts & MoM Retention
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tracking subscriber longevity, retained MRR, and cumulative churn curves across monthly acquisition groups.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold border border-blue-500/20">
              Avg Lifetime: {avgLifetime} mos
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold border border-emerald-500/20">
              Blended M1 Hold: {overallMoM[1] || 91.2}%
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                  Cohort Month
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-right uppercase tracking-wider text-[10px]">
                  Acquired Subs
                </th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-right uppercase tracking-wider text-[10px]">
                  Initial MRR
                </th>
                {["M0", "M1", "M2", "M3", "M4", "M5", "M6"].map((m) => (
                  <th key={m} className="py-3 px-3 font-semibold text-muted-foreground text-center uppercase tracking-wider text-[10px]">
                    {m}
                  </th>
                ))}
                <th className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400 text-right uppercase tracking-wider text-[10px]">
                  Cumulative Churn
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {(cohorts.length > 0 ? cohorts : [
                {
                  cohortMonth: '2026-05',
                  initialSubscribers: 1420,
                  initialMrr: 211580,
                  retentionByMonth: [
                    { monthIndex: 0, retentionRate: 100 },
                    { monthIndex: 1, retentionRate: 89.2 },
                    { monthIndex: 2, retentionRate: 83.4 },
                    { monthIndex: 3, retentionRate: 79.1 },
                    { monthIndex: 4, retentionRate: 76.5 },
                    { monthIndex: 5, retentionRate: 74.2 },
                  ],
                  cumulativeChurnRate: 25.8,
                },
                {
                  cohortMonth: '2026-06',
                  initialSubscribers: 1680,
                  initialMrr: 250320,
                  retentionByMonth: [
                    { monthIndex: 0, retentionRate: 100 },
                    { monthIndex: 1, retentionRate: 90.1 },
                    { monthIndex: 2, retentionRate: 84.6 },
                    { monthIndex: 3, retentionRate: 80.8 },
                    { monthIndex: 4, retentionRate: 77.9 },
                  ],
                  cumulativeChurnRate: 22.1,
                },
                {
                  cohortMonth: '2026-07',
                  initialSubscribers: 1950,
                  initialMrr: 290550,
                  retentionByMonth: [
                    { monthIndex: 0, retentionRate: 100 },
                    { monthIndex: 1, retentionRate: 91.4 },
                    { monthIndex: 2, retentionRate: 85.9 },
                    { monthIndex: 3, retentionRate: 82.3 },
                  ],
                  cumulativeChurnRate: 17.7,
                },
                {
                  cohortMonth: '2026-08',
                  initialSubscribers: 2240,
                  initialMrr: 333760,
                  retentionByMonth: [
                    { monthIndex: 0, retentionRate: 100 },
                    { monthIndex: 1, retentionRate: 92.5 },
                    { monthIndex: 2, retentionRate: 87.1 },
                  ],
                  cumulativeChurnRate: 12.9,
                },
                {
                  cohortMonth: '2026-09',
                  initialSubscribers: 2580,
                  initialMrr: 384420,
                  retentionByMonth: [
                    { monthIndex: 0, retentionRate: 100 },
                    { monthIndex: 1, retentionRate: 93.8 },
                  ],
                  cumulativeChurnRate: 6.2,
                },
                {
                  cohortMonth: '2026-10',
                  initialSubscribers: 2840,
                  initialMrr: 423160,
                  retentionByMonth: [
                    { monthIndex: 0, retentionRate: 100 },
                  ],
                  cumulativeChurnRate: 0.0,
                },
              ]).map((c) => (
                <tr key={c.cohortMonth} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground font-sans">
                    {c.cohortMonth}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-foreground">
                    {c.initialSubscribers.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-foreground">
                    ₹{c.initialMrr.toLocaleString('en-IN')}
                  </td>
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                    const step = c.retentionByMonth.find((s) => s.monthIndex === idx);
                    if (!step) {
                      return (
                        <td key={idx} className="py-3 px-3 text-center text-muted-foreground/40 text-[11px]">
                          —
                        </td>
                      );
                    }
                    const rate = step.retentionRate;
                    const getBg = (r: number) => {
                      if (r >= 90) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold";
                      if (r >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                      if (r >= 70) return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
                      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
                    };
                    return (
                      <td key={idx} className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${getBg(rate)}`}>
                          {rate}%
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                    {c.cumulativeChurnRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. CHURN & CANCELLATIONS ANALYSIS (Section 22) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <UserX className="size-4 text-rose-500" />
              Subscription Churn Composition
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              Overall Churn: 6.4%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-foreground font-medium">Voluntary Cancellations</span>
                <span className="font-semibold text-foreground">68%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: "68%" }} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                User initiated cancellation via account settings.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-foreground font-medium">Involuntary / Payment Failure</span>
                <span className="font-semibold text-foreground">32%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "32%" }} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Card expiry or UPI recurring mandate failure.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
            <strong className="font-semibold">Observation:</strong> Subscription cancellations increased during the selected period, coinciding with mid-series gaps between season releases.
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Percent className="size-4 text-primary" />
            Renewal Tenure Dynamics
          </h3>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Month 1
              </span>
              <span className="text-lg font-black text-foreground">78.4%</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                First renewal
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Month 3
              </span>
              <span className="text-lg font-black text-foreground">84.2%</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Cohort stabilization
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/80 text-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Month 6+
              </span>
              <span className="text-lg font-black text-foreground">91.1%</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Core subscriber hold
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Subscribers who remain active past month 3 show significantly heightened retention and higher average completion across both linear and interactive story releases.
          </p>
        </div>
      </div>
    </div>
  );
}
