import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ExternalLink,
  Eye,
  Film,
  GitBranch,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  ActionMenu,
  AdminButton,
  type Column,
  DataTable,
  SectionCard,
  StatusBadge,
} from "@/components/admin-components";
import { useAdminCreators } from "@/lib/admin-creators-state";
import { type CreatorStoryItem } from "@/lib/admin-creators-data";

export const Route = createFileRoute("/admin/creators/$creatorId/stories")({
  component: CreatorStoriesTab,
});

function CreatorStoriesTab() {
  const { creatorId } = Route.useParams();
  const navigate = useNavigate();
  const { getCreator, getCreatorStories } = useAdminCreators();

  const creator = getCreator(creatorId);
  if (!creator) return null;

  const stories = getCreatorStories(creator.id);

  const columns: Column<CreatorStoryItem>[] = [
    {
      key: "story",
      label: "Story Title",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
            <Film className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{s.title}</p>
            <p className="text-[11px] text-muted-foreground">Primary Creator: {creator.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "genre",
      label: "Genre",
      render: (s) => (
        <span className="text-xs text-muted-foreground">{s.genre}</span>
      ),
    },
    {
      key: "episodes",
      label: "Episodes",
      render: (s) => (
        <span className="text-xs font-semibold text-foreground">{s.episodes} eps</span>
      ),
    },
    {
      key: "views",
      label: "Views",
      render: (s) => (
        <span className="text-xs text-muted-foreground">{s.views}</span>
      ),
    },
    {
      key: "completion",
      label: "Completion",
      render: (s) => (
        <span className="text-xs font-medium text-foreground">{s.completion}</span>
      ),
    },
    {
      key: "interactive",
      label: "Interactive",
      render: (s) =>
        s.interactive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
            <Sparkles className="size-2.5" /> YES
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">NO</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "publishedDate",
      label: "Published",
      render: (s) => (
        <span className="text-[11px] text-muted-foreground">{s.publishedDate}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (s) => (
        <div className="flex items-center gap-2">
          {s.interactive && (
            <Link
              to="/admin/builder"
              className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
              title="Open Interactive Story Management Builder (Iteration 4B)"
            >
              <GitBranch className="size-3" />
              <span>Builder</span>
            </Link>
          )}

          <ActionMenu
            actions={[
              {
                label: "View in Admin Series",
                onClick: () => navigate({ to: "/admin/series" }),
              },
              {
                label: "Preview Public Series",
                onClick: () => {
                  if (s.slug) {
                    navigate({ to: "/series/$slug", params: { slug: s.slug } });
                  } else {
                    toast.info(`Previewing ${s.title}`);
                  }
                },
              },
              {
                label: "View Story Analytics",
                onClick: () => {
                  navigate({ to: "/admin/creators/$creatorId/analytics", params: { creatorId: creator.id } });
                },
              },
              ...(s.interactive
                ? [
                    {
                      label: "Open Story Builder",
                      onClick: () => navigate({ to: "/admin/builder" }),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Creator Stories (${stories.length})`}
        subtitle="Stories, series, and vertical narrative pilots produced under ShortReel publishing agreements"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/admin/series"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Layers className="size-3.5" />
              <span>Series Management</span>
            </Link>
            <Link
              to="/admin/builder"
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <GitBranch className="size-3.5" />
              <span>Interactive Story Builder</span>
            </Link>
          </div>
        }
      >
        <DataTable
          data={stories}
          columns={columns}
          getRowKey={(s) => s.id}
          emptyMessage="This creator has not published or submitted any stories yet."
        />
      </SectionCard>
    </div>
  );
}
