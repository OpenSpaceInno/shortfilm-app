import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle,
  Clock,
  Filter,
  Search,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { SectionCard } from "@/components/admin-components";
import { useAdminCreators } from "@/lib/admin-creators-state";

export const Route = createFileRoute("/admin/creators/$creatorId/activity")({
  component: CreatorActivityTab,
});

function CreatorActivityTab() {
  const { creatorId } = Route.useParams();
  const { getCreator, getCreatorActivity } = useAdminCreators();

  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const creator = getCreator(creatorId);
  if (!creator) return null;

  const activities = getCreatorActivity(creator.id);

  const filtered = activities.filter((act) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      act.action.toLowerCase().includes(q) ||
      act.description.toLowerCase().includes(q) ||
      act.actor.toLowerCase().includes(q);
    const matchesAction = !filterAction || act.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const distinctActions = Array.from(new Set(activities.map((a) => a.action)));

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Audit & Activity Timeline (${activities.length})`}
        subtitle="Complete immutable log of creator lifecycle events, administrative reviews, and publication milestones"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search activity events..."
                className="w-full rounded-xl border border-border bg-background pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Filter by action */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">All Event Types</option>
              {distinctActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            No activity events found matching the filter.
          </p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:bottom-2 before:top-2 before:left-[11px] before:w-[2px] before:bg-border">
            {filtered.map((item) => (
              <div key={item.id} className="relative group">
                {/* Marker */}
                <div className="absolute -left-6 top-1.5 size-3 rounded-full border-2 border-background bg-primary ring-4 ring-primary/10 group-hover:scale-125 transition-transform" />

                <div className="rounded-xl border border-border bg-card p-4 space-y-1.5 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-xs">{item.action}</span>
                      <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5">
                        {item.actor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span>{item.date}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
