import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  ChevronRight,
  Download,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useBusiness } from "@/lib/business-state";
import {
  BusinessFilterBar,
  DataFreshnessIndicator,
} from "@/components/business-components";

/* ==========================================================================
   BUSINESS DASHBOARD — EXECUTIVE REPORTS
   Route: /admin/business/reports
   Iteration 4E — Business Perspective: Acquire -> Engage -> Retain -> Monetise -> Grow
   ========================================================================== */

export const Route = createFileRoute("/admin/business/reports")({
  component: BusinessReportsPage,
});

function BusinessReportsPage() {
  const { reports, openReportModal, exportReport } = useBusiness();

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
              Executive Briefings
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Executive Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Download and inspect compiled executive briefing packages across audience cohorts, engagement, subscriptions, and catalog economics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessIndicator />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <BusinessFilterBar />

      {/* ------------------------------------------------------------------ */}
      {/* 3. REPORTS GRID (Section 37) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-card rounded-2xl border border-border p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-primary/40 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  {report.cadence} Briefing
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {report.fileSize}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  {report.title}
                </h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                  <Calendar className="size-3" />
                  Period: {report.period}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {report.description}
              </p>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">
                  Executive Highlight
                </span>
                <span className="text-xs font-bold text-foreground font-mono">
                  {report.keyStat}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
              <span className="text-[10px] text-muted-foreground">
                Compiled: {report.generatedDate}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openReportModal(report)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Eye className="size-3.5" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => exportReport(report)}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="size-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border/80 flex items-start gap-3 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-muted-foreground mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-foreground">Executive Briefings Notice:</strong> All metrics contained in these reports consume standardized snapshot telemetry. Export downloads generate lightweight mock PDF packages formatted for executive leadership and board presentations.
        </p>
      </div>
    </div>
  );
}
