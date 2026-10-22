import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clapperboard,
  Clock,
  Coins,
  CreditCard,
  Crown,
  Eye,
  FileCheck2,
  FileText,
  Film,
  FlaskConical,
  Gamepad2,
  GitBranch,
  Globe,
  Heart,
  Layers,
  ListVideo,
  MessageSquare,
  Percent,
  PieChart,
  Scissors,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Tags,
  TrendingUp,
  Trophy,
  Tv,
  Users,
  Video,
  Vote,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPage, ConsumerReturnLink } from "@/components/admin-layout";
import {
  KPICard,
  SectionCard,
  StatusBadge,
  MiniBarChart,
  AdminButton,
} from "@/components/admin-components";
import {
  platformKPIs,
  contentSummary,
  engagementSummary,
  topPerformingSeries,
  analyticsCharts,
  adminSeries,
  adminPlans,
  auditLog,
  adminRoles,
  type AdminRole,
} from "@/lib/admin-data";
import { useAdmin } from "@/lib/admin-state";
import { useAdminCreators } from "@/lib/admin-creators-state";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ShortReel Admin" },
      { name: "description", content: "ShortReel platform overview and role-specific command center." },
    ],
  }),
  component: AdminDashboardPage,
});

/* ==========================================================================
   ROLE META CONFIGURATION
   ========================================================================== */
const roleConfig: Record<
  AdminRole,
  {
    title: string;
    subtitle: string;
    badgeClass: string;
    icon: typeof Shield;
    description: string;
  }
> = {
  "Super Admin": {
    title: "Executive Command Center",
    subtitle: "Complete platform telemetry, revenue, content operations and system governance",
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: Crown,
    description: "Platform Executive Command & Cross-Domain Oversight",
  },
  "Content Admin": {
    title: "Content Operations & Catalog Command",
    subtitle: "Series release pipeline, encoding health, audio/video encoding and programming schedule",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: Film,
    description: "Catalog Operations, Series Publishing & Encoding Pipeline",
  },
  Editor: {
    title: "Story Studio & Interactive Narrative",
    subtitle: "Branching story trees, choice decisions, episode cuts and interactive voter engagement",
    badgeClass: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
    icon: GitBranch,
    description: "Narrative Branching, Story Node Graphs & Post-Production",
  },
  "Creator Manager": {
    title: "Creator Talent & Submission Hub",
    subtitle: "Creator onboarding pipeline, applications review queue, revenue sharing and story pitches",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Clapperboard,
    description: "Talent Roster, Onboarding Funnel & Application Approvals",
  },
  Analyst: {
    title: "Audience Telemetry & Intelligence",
    subtitle: "Retention cohorts, branch choice heuristics, viral sharing and prediction leaderboards",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: BarChart3,
    description: "Viewer Telemetry, Retention Cohorts & Choice Drop-off Intelligence",
  },
  Finance: {
    title: "Monetisation & Financial Intelligence",
    subtitle: "Subscription tiers, MRR/ARR run-rate, gateway settlements and creator payout reserves",
    badgeClass: "bg-amber-500/15 text-yellow-600 dark:text-amber-400 border-amber-500/30",
    icon: Coins,
    description: "Subscriptions, Gross Revenue, ARPU & Gateway Settlement",
  },
};

function AdminDashboardPage() {
  const { currentUser, switchRole } = useAdmin();
  const currentRole: AdminRole = currentUser?.role ?? "Super Admin";
  const config = roleConfig[currentRole] ?? roleConfig["Super Admin"];
  const RoleIcon = config.icon;

  return (
    <AdminPage
      title={config.title}
      subtitle={config.subtitle}
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Role Switcher Pill Bar */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-border/80 bg-card/90 p-1 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
              Role:
            </span>
            {adminRoles.map((r) => {
              const isCurrent = currentRole === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => switchRole(r.role)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                  title={r.description}
                >
                  {r.role}
                </button>
              );
            })}
          </div>

          {/* Mobile Role Switcher Select */}
          <div className="sm:hidden">
            <select
              value={currentRole}
              onChange={(e) => switchRole(e.target.value as AdminRole)}
              className="rounded-xl border border-border/80 bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground"
            >
              {adminRoles.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.role}
                </option>
              ))}
            </select>
          </div>

          <ConsumerReturnLink />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Role Identity Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-primary/5 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs shrink-0">
                <RoleIcon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-xl font-bold tracking-wide text-foreground">
                    {currentUser?.name ?? "Administrator"}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${config.badgeClass}`}
                  >
                    <span className="size-1.5 rounded-full bg-current animate-pulse" />
                    {currentRole}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Logged in as <span className="font-mono text-foreground font-semibold">{currentUser?.email}</span> • {config.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Telemetry Active
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Role-Specific Dashboard Content */}
        {currentRole === "Super Admin" && <SuperAdminDashboard />}
        {currentRole === "Content Admin" && <ContentAdminDashboard />}
        {currentRole === "Editor" && <EditorDashboard />}
        {currentRole === "Creator Manager" && <CreatorManagerDashboard />}
        {currentRole === "Analyst" && <AnalystDashboard />}
        {currentRole === "Finance" && <FinanceDashboard />}
      </div>
    </AdminPage>
  );
}

/* ==========================================================================
   1. SUPER ADMIN DASHBOARD
   ========================================================================== */
function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Total Users"
          value={platformKPIs.totalUsers}
          trend="+12.4%"
          sublabel="vs last month"
          icon={<Users className="size-4" />}
        />
        <KPICard
          label="Active Users (DAU)"
          value={platformKPIs.dau}
          trend="+8.2%"
          sublabel="daily active"
          icon={<Activity className="size-4" />}
        />
        <KPICard
          label="Watch Time"
          value={platformKPIs.watchTime}
          trend="+18.6%"
          sublabel="total hours"
          icon={<Clock className="size-4" />}
        />
        <KPICard
          label="Subscribers"
          value={platformKPIs.subscribers}
          trend="+6.8%"
          sublabel="VIP active"
          icon={<Zap className="size-4" />}
        />
        <KPICard
          label="Net Revenue"
          value={platformKPIs.revenue}
          trend="+22.1%"
          sublabel="monthly net"
          icon={<Coins className="size-4" />}
        />
        <KPICard
          label="Retention (D30)"
          value={platformKPIs.retention}
          trend="+3.2pp"
          sublabel="30-day cohort"
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      {/* Quick Executive Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Link
          to="/admin/series"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group text-center"
        >
          <Tv className="size-5 text-primary group-hover:scale-110 transition-transform mb-1" />
          <span className="text-xs font-bold text-foreground">Catalog</span>
          <span className="text-[10px] text-muted-foreground">156 Series</span>
        </Link>
        <Link
          to="/admin/creators/applications"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group text-center"
        >
          <FileCheck2 className="size-5 text-amber-500 group-hover:scale-110 transition-transform mb-1" />
          <span className="text-xs font-bold text-foreground">Applications</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Review Queue</span>
        </Link>
        <Link
          to="/admin/builder"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all group text-center"
        >
          <GitBranch className="size-5 text-fuchsia-500 group-hover:scale-110 transition-transform mb-1" />
          <span className="text-xs font-bold text-foreground">Story Builder</span>
          <span className="text-[10px] text-muted-foreground">34 Interactive</span>
        </Link>
        <Link
          to="/admin/business/revenue"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group text-center"
        >
          <Coins className="size-5 text-emerald-500 group-hover:scale-110 transition-transform mb-1" />
          <span className="text-xs font-bold text-foreground">Revenue Run-rate</span>
          <span className="text-[10px] text-muted-foreground">₹1.24Cr Monthly</span>
        </Link>
        <Link
          to="/admin/story-lab"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group text-center"
        >
          <FlaskConical className="size-5 text-blue-500 group-hover:scale-110 transition-transform mb-1" />
          <span className="text-xs font-bold text-foreground">Story Lab</span>
          <span className="text-[10px] text-muted-foreground">Content Signals</span>
        </Link>
        <Link
          to="/admin/settings"
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card hover:border-zinc-500/50 hover:bg-zinc-500/5 transition-all group text-center"
        >
          <Shield className="size-5 text-zinc-400 group-hover:scale-110 transition-transform mb-1" />
          <span className="text-xs font-bold text-foreground">Governance</span>
          <span className="text-[10px] text-muted-foreground">Security &amp; Logs</span>
        </Link>
      </div>

      {/* Content & Engagement Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Content Inventory"
          subtitle="Platform video & narrative assets"
          actions={
            <Link to="/admin/series" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{contentSummary.publishedSeries}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Episodes</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{contentSummary.episodes.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Interactive</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{contentSummary.interactiveSeries}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Creators</p>
              <p className="font-display text-2xl text-foreground mt-0.5">{contentSummary.creators}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Submissions</p>
              <p className="font-display text-2xl text-amber-600 dark:text-amber-400 mt-0.5 font-bold">
                {contentSummary.pendingSubmissions}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Engagement Pulse"
          subtitle="Real-time interactive audience actions"
          actions={
            <Link to="/admin/votes" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Live Votes <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Vote className="size-3" /> Votes
              </p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.votesToday}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Trophy className="size-3" /> Predicts
              </p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.predictions}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Share2 className="size-3" /> Shares
              </p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.shares}</p>
            </div>
            <div className="rounded-xl bg-muted/20 border border-border/60 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Heart className="size-3" /> Follows
              </p>
              <p className="font-display text-2xl text-foreground mt-0.5">{engagementSummary.charactersFollowed}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Percent className="size-3" /> Completion
              </p>
              <p className="font-display text-2xl text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">
                {engagementSummary.avgCompletion}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Visual Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Daily Active Users" subtitle="Last 7 days (thousands)">
          <MiniBarChart data={analyticsCharts.dailyActiveUsers} height={140} />
        </SectionCard>
        <SectionCard title="Revenue Trend" subtitle="Monthly net run-rate (₹ lakhs)">
          <MiniBarChart data={analyticsCharts.revenueByMonth} height={140} />
        </SectionCard>
      </div>

      {/* Top Performing Series */}
      <SectionCard
        title="Top Performing Series"
        subtitle="Ranked by total engagement, views and completion rate"
        actions={
          <Link to="/admin/series" className="text-xs font-semibold text-primary hover:underline">
            Manage All
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Series</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Views</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Completion</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Watch Time</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Engagement</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {topPerformingSeries.map((s, i) => (
                <tr key={s.title} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-xs text-primary font-bold">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-foreground">{s.title}</span>
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground">{s.views}</td>
                  <td className="py-3 text-muted-foreground">{s.completion}</td>
                  <td className="py-3 text-muted-foreground">{s.watchTime}</td>
                  <td className="py-3 font-semibold text-primary">{s.engagement}</td>
                  <td className="py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Platform Audit Trail */}
      <SectionCard
        title="Recent System Audit Activity"
        subtitle="Security events, content publishing and moderation actions"
        actions={
          <Link to="/admin/settings" className="text-xs font-semibold text-primary hover:underline">
            Full Audit Logs
          </Link>
        }
      >
        <div className="space-y-2">
          {auditLog.slice(0, 4).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{entry.action}</span>
                <span className="text-muted-foreground font-mono">{entry.entity}</span>
                <span className="hidden sm:inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  by {entry.user} ({entry.role})
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-muted-foreground text-[11px]">{entry.timestamp}</span>
                <StatusBadge status={entry.status} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ==========================================================================
   2. CONTENT ADMIN DASHBOARD
   ========================================================================== */
function ContentAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Content KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard
          label="Published Series"
          value="156"
          trend="+8 this mo"
          sublabel="active catalog"
          icon={<Tv className="size-4" />}
        />
        <KPICard
          label="Total Episodes"
          value="1,842"
          trend="+46 this wk"
          sublabel="across 28 seasons"
          icon={<ListVideo className="size-4" />}
        />
        <KPICard
          label="Interactive Series"
          value="34"
          trend="21.7% catalog"
          sublabel="branching enabled"
          icon={<GitBranch className="size-4" />}
        />
        <KPICard
          label="Encoding Pipeline"
          value="98.6%"
          trend="Healthy"
          sublabel="3 jobs in queue"
          icon={<Video className="size-4" />}
        />
        <KPICard
          label="Avg Completion"
          value="74.2%"
          trend="+3.4pp"
          sublabel="viewer retention"
          icon={<Percent className="size-4" />}
        />
      </div>

      {/* Fast Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/series"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all"
        >
          <Tv className="size-4" /> Manage Series Catalog
        </Link>
        <Link
          to="/admin/episodes"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <ListVideo className="size-4" /> Episode Review Queue
        </Link>
        <Link
          to="/admin/videos"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <Video className="size-4" /> Video Transcoding Assets
        </Link>
        <Link
          to="/admin/story-lab/opportunities"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all ml-auto"
        >
          <Sparkles className="size-4 text-primary" /> Content Opportunities
        </Link>
      </div>

      {/* Transcoding & Publishing Pipeline Health */}
      <SectionCard
        title="Release & Transcoding Health"
        subtitle="Series status across content pipeline stages"
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Published</span>
            <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">156</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Live on player</p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">In QA / Review</span>
            <p className="font-display text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">12</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pending approval</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Processing</span>
            <p className="font-display text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">3</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">1080p transcode</p>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Scheduled</span>
            <p className="font-display text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">6</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Friday drops</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <span className="text-xs font-semibold text-muted-foreground">Drafting</span>
            <p className="font-display text-2xl font-bold text-foreground mt-1">9</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Metadata staging</p>
          </div>
        </div>
      </SectionCard>

      {/* Series Requiring Attention */}
      <SectionCard
        title="Series Catalog Pipeline"
        subtitle="Recent series with live view velocity and operational actions"
        actions={
          <Link to="/admin/series" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            Browse All 156 <ArrowRight className="size-3" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Series Title</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Language / Genre</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Episodes</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {adminSeries.slice(0, 6).map((s) => (
                <tr key={s.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-foreground block">{s.title}</span>
                    <span className="text-[11px] text-muted-foreground">by {s.creatorName}</span>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{s.language}</span> • {s.genre}
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">
                    {s.episodes} eps ({s.seasons} seasons)
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 rounded-md px-2 py-0.5">
                      {s.interactive ? "Interactive" : "Linear"}
                    </span>
                  </td>
                  <td className="py-3"><StatusBadge status={s.status} /></td>
                  <td className="py-3 text-right">
                    <Link
                      to="/admin/series"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Edit <ArrowRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Genre & Language Market Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Genre Distribution" subtitle="Active series across platform verticals">
          <div className="space-y-2.5">
            {analyticsCharts.genreDistribution.map((g) => (
              <div key={g.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-40 shrink-0 truncate">{g.label}</span>
                <div className="flex-1 h-4 rounded-full bg-muted/30 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/80 transition-all" style={{ width: `${g.pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-10 text-right">{g.pct}%</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Language Distribution" subtitle="Catalog programming by regional target">
          <div className="space-y-2.5">
            {[
              { lang: "Hindi", pct: 42, count: "65 Series" },
              { lang: "Tamil", pct: 24, count: "38 Series" },
              { lang: "Telugu", pct: 18, count: "28 Series" },
              { lang: "English", pct: 11, count: "17 Series" },
              { lang: "Kannada & Malayalam", pct: 5, count: "8 Series" },
            ].map((item) => (
              <div key={item.lang} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-40 shrink-0 truncate">{item.lang}</span>
                <div className="flex-1 h-4 rounded-full bg-muted/30 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500/80 transition-all" style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-10 text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. EDITOR DASHBOARD
   ========================================================================== */
function EditorDashboard() {
  return (
    <div className="space-y-6">
      {/* Editor KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard
          label="Story Trees"
          value="34"
          trend="Active"
          sublabel="interactive branching"
          icon={<GitBranch className="size-4" />}
        />
        <KPICard
          label="Branch Nodes"
          value="420"
          trend="+32 this mo"
          sublabel="narrative choice points"
          icon={<Sparkles className="size-4" />}
        />
        <KPICard
          label="Episodes in Cut"
          value="12"
          trend="In Review"
          sublabel="pending director lock"
          icon={<Scissors className="size-4" />}
        />
        <KPICard
          label="Votes Today"
          value="124K"
          trend="+18.4%"
          sublabel="cast on live branches"
          icon={<Vote className="size-4" />}
        />
        <KPICard
          label="Character Links"
          value="850+"
          trend="Lore Synced"
          sublabel="across 64 personas"
          icon={<Users className="size-4" />}
        />
      </div>

      {/* Fast Studio Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/builder"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all"
        >
          <GitBranch className="size-4" /> Open Story Builder
        </Link>
        <Link
          to="/admin/votes"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <Vote className="size-4 text-fuchsia-500" /> Live Branch Battles &amp; Votes
        </Link>
        <Link
          to="/admin/characters"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <Heart className="size-4 text-rose-500" /> Character Roster &amp; Lore
        </Link>
        <Link
          to="/admin/story-lab/interactive"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all ml-auto"
        >
          <Sparkles className="size-4 text-primary" /> Branching Analytics
        </Link>
      </div>

      {/* Live Narrative Branch Battles */}
      <SectionCard
        title="Live Audience Branching Pulse"
        subtitle="Real-time voter split on pivotal interactive choice moments"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">The Missing Phone • S2 Finale</span>
                <h4 className="font-display text-base font-bold text-foreground">Confront Kabir vs Leak the Audio</h4>
              </div>
              <StatusBadge status="Active" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">Confront Kabir Directly (Choice A)</span>
                <span className="font-bold text-primary">71% (88,040 votes)</span>
              </div>
              <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" style={{ width: "71%" }} />
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground pt-1">
                <span>Leak Audio to Press (Choice B)</span>
                <span>29% (35,960 votes)</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Shadow Campus • Episode 8</span>
                <h4 className="font-display text-base font-bold text-foreground">Join the Secret Society vs Expose the Dean</h4>
              </div>
              <StatusBadge status="Active" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">Join the Secret Society (Choice A)</span>
                <span className="font-bold text-primary">54% (66,960 votes)</span>
              </div>
              <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-primary/70" style={{ width: "54%" }} />
              </div>
              <div className="flex justify-between text-xs font-medium text-muted-foreground pt-1">
                <span>Expose the Dean (Choice B)</span>
                <span>46% (57,040 votes)</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Interactive Story Trees in Production */}
      <SectionCard
        title="Interactive Story Trees in Review"
        subtitle="Graph node counts, branching complexity and direct builder links"
        actions={
          <Link to="/admin/builder" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            Open Graph Editor <ArrowRight className="size-3" />
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Series &amp; Episode</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nodes</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Branching Topology</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Decision Rate</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { title: "The Missing Phone", ep: "S2E8 Climax", nodes: 28, topology: "3-Tier Multi-Ending", rate: "91%", status: "Published" },
                { title: "Shadow Campus", ep: "S1E6 Orientation Night", nodes: 18, topology: "Bifurcated Choice", rate: "84%", status: "Published" },
                { title: "Neon Karma 2099", ep: "S1E4 Neural Hack", nodes: 22, topology: "Timed Interactivity", rate: "88%", status: "In Review" },
                { title: "Monsoon Room 302", ep: "S1E3 The Hidden Diary", nodes: 14, topology: "Branch & Reconverge", rate: "76%", status: "Draft" },
              ].map((item) => (
                <tr key={item.title} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-foreground block">{item.title}</span>
                    <span className="text-[11px] text-muted-foreground">{item.ep}</span>
                  </td>
                  <td className="py-3 text-xs font-mono font-semibold text-foreground">{item.nodes} nodes</td>
                  <td className="py-3 text-xs text-muted-foreground">{item.topology}</td>
                  <td className="py-3 text-xs font-semibold text-primary">{item.rate}</td>
                  <td className="py-3"><StatusBadge status={item.status} /></td>
                  <td className="py-3 text-right">
                    <Link
                      to="/admin/builder"
                      className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors shadow-xs"
                    >
                      Builder <ArrowUpRight className="size-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

/* ==========================================================================
   4. CREATOR MANAGER DASHBOARD
   ========================================================================== */
function CreatorManagerDashboard() {
  const { applications, creators, reviewApplication } = useAdminCreators();
  const pendingApps = applications.filter((a) => a.status === "Pending" || a.status === "Under Review");

  const handleApprove = (appId: string, name: string) => {
    reviewApplication(appId, "Approved", "Fast-tracked from Creator Dashboard", "Creator Manager");
    toast.success(`Application for ${name} approved!`);
  };

  const handleReject = (appId: string, name: string) => {
    reviewApplication(appId, "Rejected", "Rejected from Creator Dashboard", "Creator Manager");
    toast.info(`Application for ${name} rejected.`);
  };

  return (
    <div className="space-y-6">
      {/* Creator KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard
          label="Active Creators"
          value={creators.length > 0 ? creators.length.toString() : "428"}
          trend="+14 this mo"
          sublabel="verified studios & indies"
          icon={<Clapperboard className="size-4" />}
        />
        <KPICard
          label="Pending Applications"
          value={pendingApps.length.toString()}
          trend="Fast-Track"
          sublabel="requiring vetting"
          icon={<FileCheck2 className="size-4" />}
        />
        <KPICard
          label="Story Pitches"
          value="27"
          trend="In Pipeline"
          sublabel="submissions under review"
          icon={<Film className="size-4" />}
        />
        <KPICard
          label="Creator Payouts"
          value="₹42.8L"
          trend="+19.2% MoM"
          sublabel="rev-share distributed"
          icon={<Wallet className="size-4" />}
        />
        <KPICard
          label="Elite Tier Creators"
          value="18"
          trend="Top 5%"
          sublabel=">1M monthly views"
          icon={<Crown className="size-4" />}
        />
      </div>

      {/* Fast Action Shortcuts */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/creators/applications"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all"
        >
          <FileCheck2 className="size-4" /> Full Application Dossier ({pendingApps.length})
        </Link>
        <Link
          to="/admin/creators"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <Users className="size-4" /> Creator Roster
        </Link>
        <Link
          to="/admin/business/creator-economics"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <Coins className="size-4 text-emerald-500" /> Creator Rev-Share Economics
        </Link>
        <Link
          to="/admin/notifications"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all ml-auto"
        >
          <MessageSquare className="size-4" /> Broadcast Notice
        </Link>
      </div>

      {/* Embedded Live Applications Review Queue */}
      <SectionCard
        title="Creator Application Fast-Track Queue"
        subtitle="Review and make immediate onboarding decisions directly from the command center"
        actions={
          <Link to="/admin/creators/applications" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View All ({applications.length}) <ArrowRight className="size-3" />
          </Link>
        }
      >
        {pendingApps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">All Creator Applications Processed</p>
            <p className="text-xs text-muted-foreground mt-0.5">No pending onboarding applications at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApps.slice(0, 4).map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 transition-all hover:border-primary/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">{app.applicantName}</span>
                    <span className="text-xs text-muted-foreground font-mono">({app.creatorName})</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{app.genres.join(", ")}</span> • {app.languages.join(", ")} •{" "}
                    {app.experience}
                  </p>
                  {app.portfolio && (
                    <a
                      href={app.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline font-mono inline-block"
                    >
                      {app.portfolio} ↗
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <AdminButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(app.id, app.applicantName)}
                  >
                    <CheckCircle2 className="size-3.5" /> Approve
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(app.id, app.applicantName)}
                  >
                    <XCircle className="size-3.5" /> Reject
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Top Earning & Trending Creators */}
      <SectionCard
        title="Top Performing Creator Studios"
        subtitle="Ranked by total catalog views, follower volume and revenue generation"
        actions={
          <Link to="/admin/creators" className="text-xs font-semibold text-primary hover:underline">
            All Creators
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Creator Studio</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Followers</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Views</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Series</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tier</th>
                <th className="pb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Ananya Studios", handle: "@ananya_creates", followers: "340K", views: "4.8M", series: 3, tier: "Elite Partner" },
                { name: "Streetlight Stories", handle: "@streetlight", followers: "210K", views: "3.2M", series: 2, tier: "Verified Studio" },
                { name: "Vikram Malhotra", handle: "@vikram_films", followers: "185K", views: "2.7M", series: 2, tier: "Verified Creator" },
                { name: "Kavitha R", handle: "@kavitha_directs", followers: "128K", views: "1.9M", series: 1, tier: "Rising Star" },
              ].map((c) => (
                <tr key={c.name} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-foreground block">{c.name}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{c.handle}</span>
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">{c.followers}</td>
                  <td className="py-3 text-xs font-semibold text-foreground">{c.views}</td>
                  <td className="py-3 text-xs text-muted-foreground">{c.series} series</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {c.tier}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to="/admin/creators"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Dossier →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

/* ==========================================================================
   5. ANALYST DASHBOARD
   ========================================================================== */
function AnalystDashboard() {
  return (
    <div className="space-y-6">
      {/* Analyst KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="DAU / MAU Ratio"
          value="19.4%"
          trend="+1.8pp"
          sublabel="stickiness index"
          icon={<Activity className="size-4" />}
        />
        <KPICard
          label="Day 1 Retention"
          value="62.4%"
          trend="+4.1%"
          sublabel="next-day return"
          icon={<TrendingUp className="size-4" />}
        />
        <KPICard
          label="Day 7 Retention"
          value="45.1%"
          trend="+2.8%"
          sublabel="weekly cohort"
          icon={<Clock className="size-4" />}
        />
        <KPICard
          label="Day 30 Retention"
          value="34.2%"
          trend="+3.2pp"
          sublabel="monthly cohort"
          icon={<Zap className="size-4" />}
        />
        <KPICard
          label="Avg Session"
          value="28.4 min"
          trend="+4.2m"
          sublabel="7.2 micro-eps"
          icon={<Clock className="size-4" />}
        />
        <KPICard
          label="Interactive Lift"
          value="+42.0%"
          trend="Branching"
          sublabel="vs linear series"
          icon={<Sparkles className="size-4" />}
        />
      </div>

      {/* Intelligence Shortcuts */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/story-lab/audience"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all"
        >
          <Users className="size-4" /> Audience Cohort Signals
        </Link>
        <Link
          to="/admin/story-lab/interactive"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <GitBranch className="size-4 text-primary" /> Branch Drop-off Heuristics
        </Link>
        <Link
          to="/admin/predictions"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <Trophy className="size-4 text-amber-500" /> Prediction Telemetry
        </Link>
        <Link
          to="/admin/business/reports"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all ml-auto"
        >
          <FileText className="size-4" /> Executive Telemetry Reports
        </Link>
      </div>

      {/* Cohort Retention Curves & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="7-Day Active User Telemetry" subtitle="Daily engagement volume across the week">
          <MiniBarChart data={analyticsCharts.dailyActiveUsers} height={140} />
        </SectionCard>

        <SectionCard title="Audience Retention Cohorts" subtitle="Viewer retention progression by weekly acquisition batch">
          <div className="space-y-3">
            {[
              { cohort: "Cohort Sep W1", d1: 64, d7: 48, d14: 41, d30: 36 },
              { cohort: "Cohort Aug W4", d1: 62, d7: 46, d14: 39, d30: 34 },
              { cohort: "Cohort Aug W3", d1: 61, d7: 44, d14: 38, d30: 33 },
              { cohort: "Cohort Aug W2", d1: 59, d7: 42, d14: 36, d30: 31 },
            ].map((c) => (
              <div key={c.cohort} className="flex items-center gap-3 text-xs">
                <span className="w-28 font-medium text-foreground truncate">{c.cohort}</span>
                <div className="flex-1 grid grid-cols-4 gap-1.5 text-center font-mono font-semibold">
                  <div className="rounded-lg bg-primary/20 text-primary py-1">{c.d1}% (D1)</div>
                  <div className="rounded-lg bg-primary/15 text-primary/90 py-1">{c.d7}% (D7)</div>
                  <div className="rounded-lg bg-primary/10 text-primary/80 py-1">{c.d14}% (D14)</div>
                  <div className="rounded-lg bg-primary/5 text-muted-foreground py-1">{c.d30}% (D30)</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Choice Drop-Off & Prediction Heuristics */}
      <SectionCard
        title="Interactive Decision Points & Prediction Volume"
        subtitle="Viewer participation, wager token liquidity and branch drop-off hotspots"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Prediction Wagers</span>
            <p className="font-display text-2xl font-bold text-foreground">48,200 Wagers</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">+24.8% vs last week</p>
            <p className="text-[11px] text-muted-foreground">High liquidity on Mystery episode cliffhangers.</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Decision Latency</span>
            <p className="font-display text-2xl font-bold text-foreground">4.2 Seconds</p>
            <p className="text-xs text-primary font-semibold">Rapid intuitive choices</p>
            <p className="text-[11px] text-muted-foreground">88% of users decide before the 10-second timer expires.</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Viral Clip Shares</span>
            <p className="font-display text-2xl font-bold text-foreground">82,400 Shares</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">K-factor: 1.34</p>
            <p className="text-[11px] text-muted-foreground">WhatsApp and Instagram Stories driving 62% of referrals.</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ==========================================================================
   6. FINANCE DASHBOARD
   ========================================================================== */
function FinanceDashboard() {
  return (
    <div className="space-y-6">
      {/* Finance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Gross Revenue"
          value="₹1.24 Cr"
          trend="+22.1%"
          sublabel="monthly net"
          icon={<Coins className="size-4" />}
        />
        <KPICard
          label="Monthly MRR"
          value="₹81.2 L"
          trend="+16.4%"
          sublabel="recurring run-rate"
          icon={<Zap className="size-4" />}
        />
        <KPICard
          label="Annual ARR"
          value="₹9.74 Cr"
          trend="+28.0%"
          sublabel="annualized run-rate"
          icon={<TrendingUp className="size-4" />}
        />
        <KPICard
          label="Paid VIP Users"
          value="82,400"
          trend="+6.8%"
          sublabel="paying members"
          icon={<Crown className="size-4" />}
        />
        <KPICard
          label="Blended ARPU"
          value="₹148"
          trend="+₹12"
          sublabel="per active subscriber"
          icon={<CreditCard className="size-4" />}
        />
        <KPICard
          label="Gateway Rate"
          value="99.2%"
          trend="Healthy"
          sublabel="Razorpay &amp; Stripe"
          icon={<ShieldCheck className="size-4" />}
        />
      </div>

      {/* Finance Action Shortcuts */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin/subscriptions"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all"
        >
          <Crown className="size-4" /> Manage VIP Subscription Plans
        </Link>
        <Link
          to="/admin/business/revenue"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <Coins className="size-4 text-emerald-500" /> Revenue Deep-Dive &amp; ARPU
        </Link>
        <Link
          to="/admin/business/content-economics"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all"
        >
          <Film className="size-4 text-blue-500" /> Content ROI &amp; Economics
        </Link>
        <Link
          to="/admin/business/reports"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card text-foreground px-4 py-2 text-xs font-semibold shadow-xs hover:bg-muted/60 transition-all ml-auto"
        >
          <FileText className="size-4" /> Export P&amp;L Statements
        </Link>
      </div>

      {/* Subscription Tier Performance */}
      <SectionCard
        title="Subscription Plans &amp; Revenue Breakdown"
        subtitle="Performance across VIP Monthly, Annual and Student tiers"
        actions={
          <Link to="/admin/subscriptions" className="text-xs font-semibold text-primary hover:underline">
            Manage Plans
          </Link>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {adminPlans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-lg font-bold text-foreground">{plan.name}</h4>
                  <p className="text-xs font-semibold text-primary">{plan.price}</p>
                </div>
                <StatusBadge status={plan.status} />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscribers:</span>
                  <span className="font-semibold text-foreground font-mono">{plan.subscribers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-semibold text-foreground font-mono">{plan.revenue}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <ul className="text-[11px] text-muted-foreground space-y-1">
                  {plan.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Revenue Trend & Gateway Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Monthly Revenue Growth" subtitle="Gross revenue progression (₹ lakhs)">
          <MiniBarChart data={analyticsCharts.revenueByMonth} height={140} />
        </SectionCard>

        <SectionCard title="Payment Gateway Rails &amp; Settlements" subtitle="Transaction settlement volume and health">
          <div className="space-y-3">
            {[
              { rail: "UPI (Razorpay)", share: "68%", volume: "₹84.3 Lakhs", status: "Instant (T+0)" },
              { rail: "Credit / Debit Cards", share: "24%", volume: "₹29.8 Lakhs", status: "Settled (T+1)" },
              { rail: "Netbanking & Wallets", share: "8%", volume: "₹9.9 Lakhs", status: "Settled (T+1)" },
            ].map((item) => (
              <div key={item.rail} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 text-xs">
                <div>
                  <span className="font-semibold text-foreground block">{item.rail}</span>
                  <span className="text-[11px] text-muted-foreground">Volume: {item.volume} ({item.share})</span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" /> {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Unit Economics & Reserves Pool */}
      <SectionCard title="Unit Economics &amp; Payout Allocations" subtitle="Monthly cost distribution and operating margin">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <p className="text-xs text-muted-foreground">Gross Margin</p>
            <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">74.2%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">₹92.0L operating pool</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <p className="text-xs text-muted-foreground">Creator Rev-Share</p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">₹42.8L</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">34.5% of gross</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <p className="text-xs text-muted-foreground">Content Licensing</p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">₹18.4L</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Exclusive originals</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <p className="text-xs text-muted-foreground">CDN &amp; Infrastructure</p>
            <p className="font-display text-2xl font-bold text-foreground mt-1">₹14.2L</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Transcoding &amp; egress</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
