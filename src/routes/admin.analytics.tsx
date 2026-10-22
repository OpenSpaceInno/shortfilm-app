import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Clock,
  Film,
  Gamepad2,
  Globe,
  Heart,
  Percent,
  Share2,
  Smartphone,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Vote,
  Zap,
} from "lucide-react";
import { AdminPage, ConsumerReturnLink } from "@/components/admin-layout";
import {
  KPICard,
  MiniBarChart,
  SectionCard,
} from "@/components/admin-components";
import {
  platformKPIs,
  contentSummary,
  engagementSummary,
  analyticsCharts,
} from "@/lib/admin-data";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — ShortReel Admin" }] }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  return (
    <AdminPage
      title="Analytics"
      subtitle="Platform performance deep-dive"
      actions={<ConsumerReturnLink />}
    >
      <div className="space-y-6">
        {/* Top-Level KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="Total Users" value={platformKPIs.totalUsers} trend="+12.4%" icon={<Users className="size-4" />} />
          <KPICard label="DAU" value={platformKPIs.dau} trend="+8.2%" icon={<Activity className="size-4" />} />
          <KPICard label="Watch Time" value={platformKPIs.watchTime} trend="+18.6%" icon={<Clock className="size-4" />} />
          <KPICard label="Avg Session" value="8m 42s" trend="+2.1m" icon={<Timer className="size-4" />} />
          <KPICard label="Retention D7" value="62%" trend="+4.1pp" icon={<TrendingUp className="size-4" />} />
          <KPICard label="Retention D30" value={platformKPIs.retention} trend="+3.2pp" icon={<TrendingUp className="size-4" />} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Daily Active Users" subtitle="Last 7 days">
            <MiniBarChart data={analyticsCharts.dailyActiveUsers} height={140} />
          </SectionCard>
          <SectionCard title="Revenue Trend" subtitle="Monthly (₹ lakhs)">
            <MiniBarChart data={analyticsCharts.revenueByMonth} height={140} />
          </SectionCard>
        </div>

        {/* Content Analytics */}
        <SectionCard title="Content Analytics" subtitle="Content performance overview">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Film className="size-3" /> Published Series</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{contentSummary.publishedSeries}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Total Episodes</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{contentSummary.episodes.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Gamepad2 className="size-3" /> Interactive</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{contentSummary.interactiveSeries}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Creators</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{contentSummary.creators}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Avg Completion</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.avgCompletion}</p>
            </div>
          </div>
        </SectionCard>

        {/* Engagement */}
        <SectionCard title="Engagement Analytics" subtitle="Interactive feature metrics">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Vote className="size-3" /> Votes Today</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.votesToday}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="size-3" /> Predictions</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.predictions}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Share2 className="size-3" /> Shares</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.shares}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="size-3" /> Characters</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.charactersFollowed}</p>
            </div>
          </div>
        </SectionCard>

        {/* Genre + Platform Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Genre Distribution" subtitle="By published series">
            <div className="space-y-2.5">
              {analyticsCharts.genreDistribution.map((g) => (
                <div key={g.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{g.label}</span>
                  <div className="flex-1 h-5 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary/50 transition-all"
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-10 text-right">{g.pct}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Platform Mix" subtitle="Device & OS breakdown">
            <div className="space-y-3">
              {[
                { label: "Android", pct: 68, icon: <Smartphone className="size-3.5" /> },
                { label: "iOS", pct: 22, icon: <Smartphone className="size-3.5" /> },
                { label: "Web", pct: 10, icon: <Globe className="size-3.5" /> },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground w-24">
                    {p.icon} {p.label}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent/60 to-primary/60 transition-all"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-10 text-right">{p.pct}%</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminPage>
  );
}
