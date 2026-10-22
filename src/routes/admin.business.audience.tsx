import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  ChevronRight,
  TrendingUp,
  Globe,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useBusiness } from "@/lib/business-state";
import {
  RetentionMatrix,
  BusinessFilterBar,
  DataFreshnessIndicator,
} from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — AUDIENCE & RETENTION
   Route: /admin/business/audience
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   ========================================================================== */

export const Route = createFileRoute("/admin/business/audience")({
  component: BusinessAudiencePage,
});

function BusinessAudiencePage() {
  const { segments, retentionData, languageData, growthData, filters } = useBusiness();
  const [selectedCohortSegment, setSelectedCohortSegment] = useState<string>("All Users");

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
              Audience Dynamics
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Audience & Retention
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Examine user growth trajectory, behavioral cohort retention curves, and regional language market penetration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessIndicator />
          <Link
            to="/admin/story-lab/audience"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Story Lab Audience Signals</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <BusinessFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 3. AUDIENCE OVERVIEW SUMMARY CARDS (Section 8) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Total Registered
          </span>
          <span className="text-xl font-black text-foreground">1.42M</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
            +18.4% new registrations
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Monthly Active (MAU)
          </span>
          <span className="text-xl font-black text-foreground">842K</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
            +9.2% over previous 30d
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Daily Active (DAU)
          </span>
          <span className="text-xl font-black text-foreground">312.4K</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
            +14.1% daily active hold
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            DAU / MAU Ratio
          </span>
          <span className="text-xl font-black text-primary">37.1%</span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            High organic stickiness
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            New Viewers (14d)
          </span>
          <span className="text-xl font-black text-foreground">142.6K</span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            16.9% of active audience
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Returning Viewers
          </span>
          <span className="text-xl font-black text-foreground">698K</span>
          <span className="text-[10px] text-muted-foreground block mt-1">
            82.8% recurring sessions
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. AUDIENCE RETENTION COHORTS (Section 10) */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Audience Retention
            </h2>
            <p className="text-xs text-muted-foreground">
              Cohort survival rates from Day 1 to Day 90 across user acquisition months.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl text-xs overflow-x-auto">
            {["All Users", "Free Users", "VIP Users", "Interactive Viewers"].map((seg) => (
              <button
                key={seg}
                onClick={() => setSelectedCohortSegment(seg)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCohortSegment === seg
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {seg}
              </button>
            ))}
          </div>
        </div>

        <RetentionMatrix cohorts={retentionData} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. BEHAVIORAL AUDIENCE SEGMENTS (Section 30 & 31) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              Audience Behavioral Segments
            </h2>
            <p className="text-xs text-muted-foreground">
              Segments partitioned strictly by in-app streaming behaviour and subscription entitlement, without sensitive demographic profiling.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {segments.map((seg) => (
            <div
              key={seg.name}
              className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-foreground">{seg.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {seg.shareOfAudience}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  {seg.tagline}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-muted/40 rounded-lg border border-border text-center text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Users</span>
                    <span className="font-bold text-foreground">{seg.userCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Avg Watch Time</span>
                    <span className="font-bold text-foreground">{seg.avgWatchTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Completion</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {seg.completionRate}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs mb-3 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Choice Participation:</span>
                    <span className="font-medium text-foreground">
                      {seg.choiceParticipation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>VIP Conversion / Renewal:</span>
                    <span className="font-medium text-foreground">{seg.subConversion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>30-Day Retention:</span>
                    <span className="font-bold text-primary">{seg.d30Retention}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border text-xs text-muted-foreground">
                  <strong className="text-foreground block text-[10px] uppercase mb-0.5">
                    Consumption Pattern:
                  </strong>
                  {seg.keyBehavior}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. REGIONAL LANGUAGE / MARKET VIEW (Section 32) */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Globe className="size-5 text-blue-500" />
              Platform Distribution by Language Market
            </h2>
            <p className="text-xs text-muted-foreground">
              Market distribution by audio track and localization preference.
            </p>
          </div>
          <span className="text-xs text-muted-foreground italic">
            Neutral geographic telemetry
          </span>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-3">Audience Share</th>
                  <th className="py-3 px-3">Active Viewers</th>
                  <th className="py-3 px-3">Watch Time</th>
                  <th className="py-3 px-3">Completion Rate</th>
                  <th className="py-3 px-3">Paid Subscribers</th>
                  <th className="py-3 px-4">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {languageData.map((lang) => (
                  <tr key={lang.language} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                      <span>{lang.language}</span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        ({lang.nativeName})
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-foreground">
                      {lang.audienceShare}
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground">{lang.viewers}</td>
                    <td className="py-3.5 px-3 text-muted-foreground">{lang.watchTime}</td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {lang.completionRate}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-foreground">
                      {lang.subscribers}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">{lang.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
