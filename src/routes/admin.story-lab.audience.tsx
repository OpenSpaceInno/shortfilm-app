import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  ChevronRight,
  TrendingUp,
  Compass,
  Layers,
  Globe,
  Smile,
  Info,
  Clock,
  Share2,
  CheckCircle2,
  GitBranch,
} from "lucide-react";
import {
  genreSignalsData,
  moodSignalsData,
  languageSignalsData,
  discoverySignalsData,
} from "@/lib/story-lab-data";

/* ==========================================================================
   STORY LAB — AUDIENCE SIGNALS
   Route: /admin/story-lab/audience
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/audience")({
  component: AudienceSignalsPage,
});

function AudienceSignalsPage() {
  const [activeTab, setActiveTab] = useState<"genre" | "mood" | "language" | "discovery">(
    "genre"
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin/story-lab"
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
            >
              Story Lab
              <ChevronRight className="size-3" />
            </Link>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Macro Behaviour
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Audience Signals
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Explore thematic genre trends, emotional viewing intents, regional languages, and organic discovery pathways.
          </p>
        </div>

        <span className="text-xs bg-muted px-3 py-1.5 rounded-lg text-muted-foreground self-start md:self-auto font-medium">
          Aggregated Telemetry (Last 30 Days)
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INFORMATIONAL BANNER */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3 text-xs leading-relaxed text-emerald-950 dark:text-emerald-200">
        <Info className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold block mb-0.5 text-emerald-900 dark:text-emerald-300">
            Cohort Privacy & Neutrality Principle
          </span>
          Audience signals analyse aggregate consumption patterns and viewing intent without inferring sensitive personal traits. Data is presented neutrally to support editorial commissioning rather than as a strict ranking.
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SUBSECTION TABS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("genre")}
          className={`px-4 py-2.5 text-xs font-bold transition-all rounded-t-lg flex items-center gap-2 ${
            activeTab === "genre"
              ? "bg-card border-t-2 border-x border-border border-t-primary text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <Layers className="size-3.5" />
          <span>Genre Signals</span>
        </button>

        <button
          onClick={() => setActiveTab("mood")}
          className={`px-4 py-2.5 text-xs font-bold transition-all rounded-t-lg flex items-center gap-2 ${
            activeTab === "mood"
              ? "bg-card border-t-2 border-x border-border border-t-primary text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <Smile className="size-3.5" />
          <span>Viewing Intent / Moods</span>
        </button>

        <button
          onClick={() => setActiveTab("language")}
          className={`px-4 py-2.5 text-xs font-bold transition-all rounded-t-lg flex items-center gap-2 ${
            activeTab === "language"
              ? "bg-card border-t-2 border-x border-border border-t-primary text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <Globe className="size-3.5" />
          <span>Regional Languages</span>
        </button>

        <button
          onClick={() => setActiveTab("discovery")}
          className={`px-4 py-2.5 text-xs font-bold transition-all rounded-t-lg flex items-center gap-2 ${
            activeTab === "discovery"
              ? "bg-card border-t-2 border-x border-border border-t-primary text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <Compass className="size-3.5" />
          <span>Content Discovery</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. GENRE SIGNALS (Section 21) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "genre" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Genre Telemetry & Audience Continuation
            </h3>
            <span className="text-[11px] text-muted-foreground italic">
              Comparative cohort metrics across catalog categories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {genreSignalsData.map((genre) => (
              <div
                key={genre.genre}
                className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-base text-foreground">
                      {genre.genre}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <TrendingUp className="size-3" />
                      {genre.viewGrowth}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs p-2 bg-muted/40 rounded-lg border border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Views</span>
                      <span className="font-bold text-foreground">{genre.views}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Completion</span>
                      <span className="font-bold text-foreground">{genre.completion}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Interactive</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {genre.interactiveParticipation}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground py-1 border-b border-border/60">
                    <span>Watch Time:</span>
                    <span className="font-medium text-foreground">{genre.watchTime}</span>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground py-1 mb-3">
                    <span>Story Shares:</span>
                    <span className="font-medium text-foreground">{genre.shares}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground block text-[11px] mb-0.5">
                      Editorial Observation:
                    </strong>
                    {genre.observation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. VIEWING INTENT / MOOD SIGNALS (Section 22) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "mood" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Mood Discovery & Viewing Intent
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Derived from consumer app mood selector sessions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moodSignalsData.map((mood) => (
              <div
                key={mood.mood}
                className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-base text-foreground flex items-center gap-2">
                      <Smile className="size-4 text-primary" />
                      {mood.mood}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {mood.views} starts
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs p-2 bg-muted/40 rounded-lg border border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Session Starts</span>
                      <span className="font-bold text-foreground">{mood.sessionStarts}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Completion</span>
                      <span className="font-bold text-foreground">{mood.completion}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Return Rate</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {mood.returningViewers}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground block text-[11px] mb-0.5">
                      Audience Signal:
                    </strong>
                    {mood.observation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. REGIONAL LANGUAGE SIGNALS (Section 23) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "language" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Regional Language Consumption
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Multi-market expansion preparation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languageSignalsData.map((lang) => (
              <div
                key={lang.language}
                className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-base text-foreground flex items-center gap-2">
                      <Globe className="size-4 text-blue-500" />
                      {lang.language}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                      {lang.audience}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs p-2 bg-muted/40 rounded-lg border border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Completion</span>
                      <span className="font-bold text-foreground">{lang.completion}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Watch Time</span>
                      <span className="font-bold text-foreground">{lang.watchTime}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Engagement</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {lang.engagement}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground block text-[11px] mb-0.5">
                      Market Signal:
                    </strong>
                    {lang.observation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 7. CONTENT DISCOVERY SIGNALS (Section 24) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "discovery" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Audience Discovery Ingestion Channels
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Conversion from discovery touchpoint to long-term story engagement
            </span>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Discovery Channel</th>
                    <th className="py-3 px-3">Session Starts</th>
                    <th className="py-3 px-3">Series Completion</th>
                    <th className="py-3 px-3">Follow Conversion</th>
                    <th className="py-3 px-3">Share Conversion</th>
                    <th className="py-3 px-4">Observed Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {discoverySignalsData.map((channel) => (
                    <tr key={channel.channel} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground flex items-center gap-2">
                        <Compass className="size-3.5 text-primary" />
                        {channel.channel}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-foreground">
                        {channel.starts}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-foreground">
                          {channel.completion}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {channel.followConversion}
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground font-medium">
                        {channel.shareConversion}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs">
                        {channel.observation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
