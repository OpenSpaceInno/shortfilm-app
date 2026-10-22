import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  Film,
  GitBranch,
  Layers,
  Play,
  Plus,
  Radio,
  Sparkles,
  Trophy,
  Tv,
  Vote,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin-layout";
import {
  ActionMenu,
  AdminButton,
  type Column,
  DataTable,
  KPICard,
  SearchFilterBar,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import {
  mockInteractiveStories,
  type InteractiveStory,
} from "@/lib/story-engine-data";
import { adminSeries } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/interactive")({
  head: () => ({
    meta: [
      { title: "Interactive Series — ShortReel Admin" },
      {
        name: "description",
        content: "Management and configuration for interactive branching series.",
      },
    ],
  }),
  component: AdminInteractivePage,
});

function AdminInteractivePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stories, setStories] = useState<InteractiveStory[]>(mockInteractiveStories);

  const filtered = stories.filter((s) => {
    const matchSearch =
      !search ||
      s.seriesTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleToggleInteractive = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? {
              ...s,
              status: s.status === "Published" ? ("Draft" as const) : ("Published" as const),
            }
          : s
      )
    );
    toast.success("Interactive story status updated!");
  };

  const columns: Column<InteractiveStory>[] = [
    {
      key: "seriesTitle",
      label: "Series",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
            <Tv className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{s.seriesTitle}</p>
            <p className="text-[11px] text-muted-foreground truncate">{s.title}</p>
          </div>
        </div>
      ),
    },
    {
      key: "episodes",
      label: "Episodes",
      render: (s) => {
        const sr = adminSeries.find((x) => x.id === s.seriesId);
        return <span className="font-medium text-foreground">{sr?.episodes ?? 10}</span>;
      },
    },
    {
      key: "nodes",
      label: "Story Nodes",
      sortable: true,
      render: (s) => (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-foreground">
          <GitBranch className="size-3 text-primary" /> {s.nodes.length || 6}
        </span>
      ),
    },
    {
      key: "choices",
      label: "Choices",
      render: (s) => {
        const choiceCount = s.nodes.filter((n) => n.type === "Choice").length || 1;
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs">
            <Vote className="size-3" /> {choiceCount}
          </span>
        );
      },
    },
    {
      key: "activeVotes",
      label: "Active Votes",
      render: (s) =>
        s.activeVotesCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold text-[11px]">
            <Radio className="size-3 animate-pulse" /> {s.activeVotesCount} Live
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">None</span>
        ),
    },
    {
      key: "completionRate",
      label: "Completion",
      sortable: true,
      render: (s) => <span className="text-foreground font-medium">{s.completionRate}</span>,
    },
    {
      key: "engagementScore",
      label: "Engagement",
      sortable: true,
      render: (s) => (
        <span className="text-primary font-bold text-xs">{s.engagementScore}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (s) => (
        <ActionMenu
          actions={[
            {
              label: "Open Story Builder",
              onClick: () => {
                navigate({ to: "/admin/builder" });
              },
            },
            {
              label: "Manage Live Votes",
              onClick: () => {
                navigate({ to: "/admin/votes" });
              },
            },
            {
              label: "Story Predictions",
              onClick: () => {
                navigate({ to: "/admin/predictions" });
              },
            },
            {
              label: s.status === "Published" ? "Disable Interactive" : "Enable Interactive",
              onClick: () => handleToggleInteractive(s.id),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminPage
      title="Interactive Series"
      subtitle="Configure branching narratives, decision points, and audience voting"
      actions={
        <Link to="/admin/builder">
          <AdminButton variant="primary" size="md">
            <GitBranch className="size-4" /> LAUNCH STORY BUILDER
          </AdminButton>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="Interactive Series"
            value={stories.length.toString()}
            icon={<Tv className="size-4" />}
          />
          <KPICard
            label="Total Story Nodes"
            value="34 Nodes"
            icon={<GitBranch className="size-4" />}
          />
          <KPICard
            label="Live Active Votes"
            value="2 Polls"
            sublabel="88.4% avg turnout"
            icon={<Vote className="size-4" />}
          />
          <KPICard
            label="Avg Branch Engagement"
            value="89.2%"
            trend="+14.6%"
            icon={<Sparkles className="size-4" />}
          />
        </div>

        {/* Quick Launch Banner to Story Builder */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-card via-primary/10 to-card p-5 shadow-lg flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-bold shadow-lg shadow-primary/20">
              <GitBranch className="size-6" />
            </div>
            <div>
              <h3 className="font-display text-lg tracking-wide text-foreground">
                Story Builder Canvas
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visual node graph editor with live path testing, choice configuration, and consumer simulation.
              </p>
            </div>
          </div>
          <Link to="/admin/builder">
            <AdminButton variant="primary" size="md">
              Open Story Builder <ChevronRight className="size-4" />
            </AdminButton>
          </Link>
        </div>

        {/* Interactive Series Table */}
        <SectionCard
          title="Interactive Story Catalogs"
          subtitle="All platform short-form series enabled for audience choices"
        >
          <div className="space-y-4">
            <SearchFilterBar
              searchValue={search}
              onSearchChange={setSearch}
              placeholder="Search interactive series by title..."
              statusOptions={["Draft", "Editorial Review", "Ready", "Published", "Archived"]}
              selectedStatus={statusFilter}
              onStatusChange={setStatusFilter}
            />

            <DataTable data={filtered} columns={columns} getRowKey={(s) => s.id} />
          </div>
        </SectionCard>
      </div>
    </AdminPage>
  );
}
