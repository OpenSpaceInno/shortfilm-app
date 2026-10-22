import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Coins,
  Crown,
  Eye,
  GitBranch,
  Heart,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { KPICard, MiniBarChart, SectionCard } from "@/components/admin-components";
import { useAdminCreators } from "@/lib/admin-creators-state";

export const Route = createFileRoute("/admin/creators/$creatorId/analytics")({
  component: CreatorAnalyticsTab,
});

function CreatorAnalyticsTab() {
  const { creatorId } = Route.useParams();
  const { getCreator, getCreatorStories } = useAdminCreators();

  const [sortField, setSortField] = useState<"views" | "completion" | "engagement" | "revenue">("views");

  const creator = getCreator(creatorId);
  if (!creator) return null;

  const stories = getCreatorStories(creator.id);

  // Top stories for Content Performance (Section 19)
  const topStories = [...stories].sort((a, b) => {
    if (sortField === "views") return b.views.localeCompare(a.views);
    if (sortField === "completion") return parseInt(b.completion) - parseInt(a.completion);
    if (sortField === "revenue") return b.revenue.localeCompare(a.revenue);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* 11 KPI Cards (Section 18) */}
      <div className="space-y-3">
        <div>
          <h3 className="font-display text-lg tracking-wide text-foreground">
            Audience & Engagement Telemetry
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time aggregate performance indicators across interactive and linear episodes
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <KPICard label="Total Views" value={creator.views} icon={<Eye className="size-4" />} />
          <KPICard label="Unique Viewers" value="1.4M" icon={<Users className="size-4" />} sublabel="Last 30 days" />
          <KPICard label="Watch Time" value="4.8M min" icon={<BarChart3 className="size-4" />} trend="+14% MoM" />
          <KPICard label="Completion Rate" value={creator.completion} icon={<Sparkles className="size-4" />} trend="High retention" />
          <KPICard label="Avg Episode Completion" value="82%" icon={<BarChart3 className="size-4" />} />
          <KPICard label="Total Followers" value={creator.followers} icon={<Crown className="size-4" />} trend="+4.2K this month" />
          <KPICard label="Engagement Rate" value={creator.engagement} icon={<Heart className="size-4 text-rose-600 dark:text-red-400" />} />
          <KPICard label="Choice Participation" value="88.4%" icon={<GitBranch className="size-4 text-purple-600 dark:text-purple-400" />} sublabel="Branch decisions made" />
          <KPICard label="Prediction Votes" value="142K" icon={<Trophy className="size-4 text-amber-600 dark:text-amber-400" />} sublabel="Live episode outcomes" />
          <KPICard label="Story Shares" value="54.2K" icon={<Share2 className="size-4" />} trend="+22% social shares" />
          <KPICard label="Returning Viewers" value="68.5%" icon={<Users className="size-4" />} trend="High repeat loyalty" />
          <KPICard label="Creator Revenue" value={creator.revenue} icon={<Coins className="size-4 text-emerald-600 dark:text-emerald-400" />} trend="Verified tier" />
        </div>
      </div>

      {/* Visual Analytics Charts (Section 18) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SectionCard title="Views Over Time" subtitle="Monthly views (thousands)">
          <MiniBarChart
            data={[
              { label: "Apr", value: 340 },
              { label: "May", value: 520 },
              { label: "Jun", value: 780 },
              { label: "Jul", value: 1100 },
              { label: "Aug", value: 1450 },
              { label: "Sep", value: 1820 },
            ]}
          />
        </SectionCard>

        <SectionCard title="Watch Time" subtitle="Total hours consumed monthly">
          <MiniBarChart
            data={[
              { label: "Apr", value: 120 },
              { label: "May", value: 210 },
              { label: "Jun", value: 390 },
              { label: "Jul", value: 580 },
              { label: "Aug", value: 720 },
              { label: "Sep", value: 940 },
            ]}
          />
        </SectionCard>

        <SectionCard title="Follower Growth" subtitle="New platform followers per month">
          <MiniBarChart
            data={[
              { label: "Apr", value: 12 },
              { label: "May", value: 24 },
              { label: "Jun", value: 42 },
              { label: "Jul", value: 68 },
              { label: "Aug", value: 92 },
              { label: "Sep", value: 128 },
            ]}
          />
        </SectionCard>
      </div>

      {/* Content Performance Table (Section 19) */}
      <SectionCard
        title="Content Performance"
        subtitle="Catalog ranking by viewership, audience completion, choices voted and creator earnings"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="views">Most Views</option>
              <option value="completion">Completion Rate</option>
              <option value="revenue">Gross Revenue</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">Story</th>
                <th className="px-4 py-3 text-left">Views</th>
                <th className="px-4 py-3 text-left">Completion</th>
                <th className="px-4 py-3 text-left">Shares</th>
                <th className="px-4 py-3 text-left">Audience Votes</th>
                <th className="px-4 py-3 text-left">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topStories.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors text-xs">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    <div>
                      <p>{s.title}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">{s.genre} · {s.episodes} eps</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">{s.views}</td>
                  <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{s.completion}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.shares}</td>
                  <td className="px-4 py-3 text-purple-700 dark:text-purple-400 font-medium">{s.votes}</td>
                  <td className="px-4 py-3 text-foreground font-semibold">{s.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
