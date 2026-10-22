import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FlaskConical,
  ChevronRight,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Archive,
  Info,
  GitBranch,
  TrendingUp,
  Tv,
  ArrowRight,
  Filter,
  Search,
} from "lucide-react";
import { useStoryLab } from "@/lib/story-lab-state";
import type { StoryExperiment, ExperimentStatus } from "@/lib/story-lab-data";

/* ==========================================================================
   STORY LAB — STORY EXPERIMENTS
   Route: /admin/story-lab/experiments
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/experiments")({
  component: StoryExperimentsPage,
});

function StoryExperimentsPage() {
  const {
    filteredExperiments,
    openCreateExperiment,
    updateExperimentStatus,
    filters,
    setSearchQuery,
  } = useStoryLab();

  const [statusFilter, setStatusFilter] = useState<string>("All");

  const experimentsList = filteredExperiments.filter((exp) => {
    if (statusFilter !== "All" && exp.status !== statusFilter) return false;
    return true;
  });

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
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Controlled Testing
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Story Experiments
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Formulate story hypotheses, test branch timing and cold opens with A/B viewer cohorts, and measure empirical continuation differences.
          </p>
        </div>

        <button
          onClick={openCreateExperiment}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm self-start md:self-auto"
        >
          <Plus className="size-3.5" />
          Create Controlled Experiment
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INFORMATIONAL BANNER (Section 29) */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3 text-xs leading-relaxed text-foreground">
        <Info className="size-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold block mb-0.5 text-rose-700 dark:text-rose-400">
            Statistical Interpretation Note
          </span>
          Experiment results should be interpreted only after sufficient sample size and appropriate editorial analysis. Story Lab surfaces observed differences without making automatic claims of statistical significance or prescribing mandatory creative changes.
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FILTERS & SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search experiments by name or story..."
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg bg-background border border-border px-3 py-1.5"
          >
            <option value="All">All Statuses</option>
            <option value="Running">Running</option>
            <option value="Completed">Completed</option>
            <option value="Paused">Paused</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. EXPERIMENTS LIST (Section 27, 28, 29) */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-6">
        {experimentsList.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            <FlaskConical className="size-8 mx-auto mb-2 opacity-40" />
            <h4 className="font-bold text-sm text-foreground">No experiments found</h4>
            <p className="text-xs mt-1">Create an experiment to test a story hypothesis.</p>
          </div>
        ) : (
          experimentsList.map((exp) => (
            <div
              key={exp.id}
              className="bg-card rounded-2xl border border-border p-6 shadow-xs space-y-5"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${
                        exp.status === "Running"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : exp.status === "Completed"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                          : exp.status === "Paused"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {exp.status}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      Sample: {exp.sampleSize}
                    </span>
                    <span className="text-xs text-muted-foreground">• Owner: {exp.owner}</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{exp.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Story:{" "}
                    <span className="font-semibold text-foreground">{exp.storyTitle}</span> •{" "}
                    {exp.episode} • Window: {exp.startDate} – {exp.endDate}
                  </p>
                </div>

                {/* Status Switcher Action */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-muted-foreground font-medium">Status:</span>
                  <select
                    value={exp.status}
                    onChange={(e) =>
                      updateExperimentStatus(exp.id, e.target.value as ExperimentStatus)
                    }
                    className="text-xs rounded-lg bg-background border border-border px-2.5 py-1 font-semibold text-foreground"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Running">Running</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Hypothesis & Variable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Hypothesis
                  </span>
                  <p className="text-foreground leading-relaxed font-medium">
                    "{exp.hypothesis}"
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Variable Under Test
                  </span>
                  <p className="text-foreground leading-relaxed">{exp.variable}</p>
                </div>
              </div>

              {/* Control vs Variant Condition Cards (Section 28 & 29) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Control Box */}
                <div className="p-4 rounded-xl bg-card border border-border shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      CONTROL (A)
                    </span>
                    <span className="text-[11px] text-muted-foreground">Current Baseline</span>
                  </div>
                  <p className="text-xs text-foreground mb-4 leading-relaxed font-medium">
                    {exp.controlCondition}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-border">
                    {exp.metrics.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/30"
                      >
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="font-bold text-foreground">{m.controlValue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variant Box */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      VARIANT (B)
                    </span>
                    <span className="text-[11px] font-semibold text-primary">Test Cohort</span>
                  </div>
                  <p className="text-xs text-foreground mb-4 leading-relaxed font-medium">
                    {exp.variantCondition}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-primary/15">
                    {exp.metrics.map((m, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded bg-primary/10"
                      >
                        <span className="text-muted-foreground">{m.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{m.variantValue}</span>
                          <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                            ({m.difference})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary note & platform action */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-muted-foreground flex-1">
                  <strong className="text-foreground">Cohort Summary: </strong>
                  {exp.summaryNote}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/admin/builder"
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <GitBranch className="size-3" />
                    Story Builder
                  </Link>
                  <Link
                    to="/admin/series"
                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <Tv className="size-3" />
                    Series CMS
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
