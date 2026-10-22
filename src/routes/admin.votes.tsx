import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Radio,
  Sparkles,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import { AdminPage } from "@/components/admin-layout";
import {
  type Column,
  DataTable,
  KPICard,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import { mockLiveVotes, type LiveVote } from "@/lib/story-engine-data";

export const Route = createFileRoute("/admin/votes")({
  head: () => ({
    meta: [
      { title: "Votes & Live Results — ShortReel Admin" },
      {
        name: "description",
        content: "Audience voting telemetry, live polls, and decision point analytics.",
      },
    ],
  }),
  component: AdminVotesPage,
});

function AdminVotesPage() {
  const [selectedVote, setSelectedVote] = useState<LiveVote>(mockLiveVotes[0]!);

  const columns: Column<LiveVote>[] = [
    {
      key: "storyTitle",
      label: "Story & Episode",
      sortable: true,
      render: (v) => (
        <div>
          <p className="font-semibold text-foreground text-sm">{v.storyTitle}</p>
          <p className="text-[11px] text-muted-foreground">{v.episodeTitle}</p>
        </div>
      ),
    },
    {
      key: "choiceQuestion",
      label: "Audience Choice Question",
      render: (v) => <span className="font-medium text-foreground text-xs">{v.choiceQuestion}</span>,
    },
    {
      key: "optionA",
      label: "Option A",
      render: (v) => (
        <div>
          <p className="text-xs text-primary font-bold">{v.optionA.percentage}%</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{v.optionA.text}</p>
        </div>
      ),
    },
    {
      key: "optionB",
      label: "Option B",
      render: (v) => (
        <div>
          <p className="text-xs text-amber-400 font-bold">{v.optionB.percentage}%</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{v.optionB.text}</p>
        </div>
      ),
    },
    {
      key: "totalVotes",
      label: "Total Votes",
      sortable: true,
      render: (v) => <span className="font-semibold font-mono text-foreground text-xs">{v.totalVotes}</span>,
    },
    {
      key: "participationRate",
      label: "Turnout",
      render: (v) => <span className="text-emerald-400 font-medium text-xs">{v.participationRate}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (v) =>
        v.status === "Active" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold text-[10px]">
            <Radio className="size-3 animate-pulse" /> Live Now
          </span>
        ) : (
          <StatusBadge status="Archived" />
        ),
    },
    {
      key: "actions",
      label: "Analytics",
      render: (v) => (
        <button
          onClick={() => setSelectedVote(v)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
            selectedVote.id === v.id
              ? "bg-primary text-primary-foreground shadow"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          View Telemetry
        </button>
      ),
    },
  ];

  return (
    <AdminPage
      title="Voting Management"
      subtitle="Real-time audience decision telemetry and episode branch elections"
    >
      <div className="space-y-6">
        {/* Section 17: Live Vote Hero Spotlight Card */}
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-[#121624] via-[#0E111B] to-[#161324] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Vote className="size-48 text-primary" />
          </div>

          <div className="relative z-10 space-y-5 max-w-4xl">
            {/* Header pill */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold tracking-wider uppercase border border-red-500/30">
                <Radio className="size-3.5 animate-pulse" /> LIVE BROADCAST VOTE
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/40 px-3 py-1.5 rounded-xl border border-border">
                <Clock className="size-3.5 text-amber-400" />
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-amber-300">{selectedVote.timeRemaining}</span>
              </div>
            </div>

            {/* Title & Question */}
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                {selectedVote.storyTitle} · {selectedVote.episodeTitle}
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-wide mt-1">
                {selectedVote.choiceQuestion}
              </h2>
            </div>

            {/* Voting Distribution Dual Progress Bars */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A Box */}
                <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary uppercase">Option A</span>
                    <span className="font-display text-2xl font-bold text-primary">
                      {selectedVote.optionA.percentage}%
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-foreground">{selectedVote.optionA.text}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedVote.optionA.count.toLocaleString()} votes cast
                  </p>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${selectedVote.optionA.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Option B Box */}
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Option B</span>
                    <span className="font-display text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {selectedVote.optionB.percentage}%
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-foreground">{selectedVote.optionB.text}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedVote.optionB.count.toLocaleString()} votes cast
                  </p>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${selectedVote.optionB.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Stats Row */}
            <div className="pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Total Turnout</p>
                <p className="font-display text-lg font-bold text-foreground mt-0.5">{selectedVote.totalVotes}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Participation Rate</p>
                <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedVote.participationRate}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Completion Pre-Vote</p>
                <p className="font-display text-lg font-bold text-foreground mt-0.5">
                  {selectedVote.completionBeforeVote}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Completion Post-Vote</p>
                <p className="font-display text-lg font-bold text-foreground mt-0.5">
                  {selectedVote.completionAfterVote}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 18: Vote Analytics & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Voting Velocity Timeline</h3>
                <p className="text-xs text-muted-foreground">Cumulative votes over broadcast window</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="size-2 rounded-full bg-primary" /> Option A
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="size-2 rounded-full bg-amber-400" /> Option B
                </span>
              </div>
            </div>

            {/* Timeline Bars */}
            <div className="pt-4 flex items-end gap-3 h-40 border-b border-border pb-2">
              {selectedVote.timelineData.map((pt, idx) => {
                const total = pt.votesA + pt.votesB;
                const max = 130000;
                const hA = Math.round((pt.votesA / max) * 120);
                const hB = Math.round((pt.votesB / max) * 120);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full flex items-end gap-1 justify-center">
                      <div
                        className="w-1/2 bg-primary rounded-t transition-all duration-300"
                        style={{ height: `${Math.max(10, hA)}px` }}
                        title={`A: ${pt.votesA}`}
                      />
                      <div
                        className="w-1/2 bg-amber-500 rounded-t transition-all duration-300"
                        style={{ height: `${Math.max(10, hB)}px` }}
                        title={`B: ${pt.votesB}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{pt.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="font-semibold text-sm text-foreground">Voter Retention Impact</h3>
            <p className="text-xs text-muted-foreground">
              Interactive voting increases next-episode return rates by <strong>+34.2%</strong> compared to linear streaming.
            </p>
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Unique Voters</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedVote.totalVotersNumeric.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Audience Conversion</span>
                <span className="font-mono font-bold text-emerald-400">92.4%</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Decision Confidence</span>
                <span className="font-mono font-bold text-primary">High (σ=0.14)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 16: Voting Management Table */}
        <SectionCard
          title="All Audience Decision Points"
          subtitle="Directory of active, closed, and upcoming story choices across all series"
        >
          <DataTable data={mockLiveVotes} columns={columns} getRowKey={(v) => v.id} />
        </SectionCard>
      </div>
    </AdminPage>
  );
}
