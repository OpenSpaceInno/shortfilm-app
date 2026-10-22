import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  Crown,
  Eye,
  Film,
  Heart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { KPICard, SectionCard, StatusBadge } from "@/components/admin-components";
import { useAdminCreators } from "@/lib/admin-creators-state";
import { adminCharacters } from "@/lib/admin-data";

export const Route = createFileRoute("/admin/creators/$creatorId/")({
  component: CreatorOverviewTab,
});

function CreatorOverviewTab() {
  const { creatorId } = Route.useParams();
  const { getCreator, getCreatorStories, getCreatorActivity } = useAdminCreators();

  const creator = getCreator(creatorId);
  if (!creator) return null;

  const stories = getCreatorStories(creator.id);
  const activities = getCreatorActivity(creator.id);

  // Associated characters from adminCharacters matching creator's stories
  const storyTitles = stories.map((s) => s.title.toLowerCase());
  const associatedCharacters = adminCharacters.filter(
    (c) =>
      storyTitles.includes(c.seriesTitle.toLowerCase()) ||
      c.name.toLowerCase().includes(creator.name.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Creator Summary & Performance Snapshot (Section 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Summary Card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <h3 className="font-display text-lg tracking-wide text-foreground">
              Creator Summary
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Core platform credentials and narrative positioning
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                Bio / Vision
              </span>
              <p className="text-foreground mt-1 leading-relaxed">
                {creator.bio || "No biography provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                  Category
                </span>
                <p className="font-semibold text-foreground mt-0.5">{creator.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                  Joined Platform
                </span>
                <p className="font-semibold text-foreground mt-0.5">{creator.joinedAt}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                Genres Produced
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {creator.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                Languages
              </span>
              <p className="font-semibold text-foreground mt-0.5">
                {creator.languages.join(", ")}
              </p>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-muted-foreground text-[11px]">Verification</span>
              <StatusBadge status={creator.verificationStatus} />
            </div>
          </div>
        </div>

        {/* Performance Snapshot Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-display text-lg tracking-wide text-foreground">
              Performance Snapshot
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aggregated viewership, retention, and audience conversion
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KPICard
              label="Total Stories"
              value={creator.stories.toString()}
              icon={<Film className="size-4" />}
            />
            <KPICard
              label="Published Stories"
              value={creator.published.toString()}
              icon={<Sparkles className="size-4" />}
              trend="Catalog ready"
            />
            <KPICard
              label="Total Views"
              value={creator.views}
              icon={<Eye className="size-4" />}
            />
            <KPICard
              label="Avg Completion"
              value={creator.completion}
              icon={<TrendingUp className="size-4" />}
              trend="Above benchmark"
            />
            <KPICard
              label="Followers"
              value={creator.followers}
              icon={<Crown className="size-4" />}
            />
            <KPICard
              label="Engagement Rate"
              value={creator.engagement}
              icon={<Heart className="size-4" />}
            />
          </div>

          {/* Internal Notes Preview (Section 32) */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                  Internal Administrative Notes ({creator.internalNotes?.length || 0})
                </span>
              </div>
            </div>

            {creator.internalNotes && creator.internalNotes.length > 0 ? (
              <div className="space-y-2">
                {creator.internalNotes.map((n) => (
                  <div key={n.id} className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
                    <p className="text-foreground leading-relaxed">"{n.note}"</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                      By {n.author} · {n.date}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                No internal notes added yet. Click "Add Note" in the header to document review findings.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Creator ↔ Character Relationship (Section 26) */}
      <SectionCard
        title="Associated Characters"
        subtitle="Characters created or featured in this creator's vertical interactive stories"
      >
        {associatedCharacters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {associatedCharacters.map((char) => (
              <div
                key={char.id}
                className="flex items-center justify-between rounded-xl border border-border bg-muted/10 p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    {char.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{char.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{char.seriesTitle}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-semibold text-primary block">{char.role}</span>
                  <span className="text-[10px] text-muted-foreground">{char.followers} fans</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No linked character profiles recorded in the database. Characters can be linked from{" "}
            <Link to="/admin/characters" className="text-primary hover:underline">
              Character Management
            </Link>
            .
          </div>
        )}
      </SectionCard>

      {/* 3. Recent Activity (Section 13) */}
      <SectionCard
        title="Recent Creator Activity"
        subtitle="Chronological feed of content submissions, editorial approvals, and account updates"
      >
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/10 p-3"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{act.action}</p>
                  <p className="text-xs text-muted-foreground">{act.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-muted-foreground">{act.date}</span>
                  <p className="text-[10px] text-muted-foreground/80">{act.time} · {act.actor}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">No recent activity recorded.</p>
        )}
      </SectionCard>
    </div>
  );
}
