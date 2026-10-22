import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Tv,
  ArrowUpDown,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Eye,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Share2,
  Users,
} from "lucide-react";
import { useStoryLab } from "@/lib/story-lab-state";
import { SignalBadge } from "@/components/story-lab-components";
import type { StoryIntelligenceDetail } from "@/lib/story-lab-data";

/* ==========================================================================
   STORY LAB — STORY INTELLIGENCE
   Route: /admin/story-lab/stories
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/stories/")({
  component: StoryIntelligencePage,
});

type SortField =
  | "recent"
  | "views"
  | "completion"
  | "watchTime"
  | "engagement"
  | "followers";

function StoryIntelligencePage() {
  const { filteredStoryIntelligence, filters, setGenre, setCreator, setInteractiveOnly, setSearchQuery } =
    useStoryLab();

  const [sortField, setSortField] = useState<SortField>("recent");
  const [sortAsc, setSortAsc] = useState(false);

  // Sorting handler
  const sortedStories = useMemo(() => {
    const list = [...filteredStoryIntelligence];

    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "views":
          comparison = a.viewsNumber - b.viewsNumber;
          break;
        case "completion":
          comparison = a.completionNumber - b.completionNumber;
          break;
        case "watchTime":
          comparison = a.watchTime.localeCompare(b.watchTime);
          break;
        case "engagement":
          comparison = a.engagement.localeCompare(b.engagement);
          break;
        case "followers": {
          const parseFollowers = (val: string | number) => {
            if (typeof val === "number") return val;
            return parseInt(String(val).replace(/[^0-9]/g, ""), 10) || 0;
          };
          comparison = parseFollowers(a.followersGenerated) - parseFollowers(b.followersGenerated);
          break;
        }
        case "recent":
        default:
          comparison = 0;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return list;
  }, [filteredStoryIntelligence, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
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
            <span className="text-xs font-semibold text-primary">Catalog Intelligence</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Story Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Examine audience retention, completion funnels, and narrative signals across all
            published stories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/series"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Tv className="size-3.5" />
            Open Series Management
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search story by title, creator, genre..."
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filters.genre}
            onChange={(e) => setGenre(e.target.value)}
            className="text-xs rounded-lg bg-background border border-border px-2.5 py-1.5"
          >
            <option value="All">All Genres</option>
            <option value="Thriller">Thriller</option>
            <option value="Mystery">Mystery</option>
            <option value="Drama">Drama</option>
            <option value="Romance">Romance</option>
          </select>

          <select
            value={filters.creator}
            onChange={(e) => setCreator(e.target.value)}
            className="text-xs rounded-lg bg-background border border-border px-2.5 py-1.5"
          >
            <option value="All">All Creators</option>
            <option value="Arjun Mehta">Arjun Mehta</option>
            <option value="Priya Nair">Priya Nair</option>
            <option value="Kabir Rao">Kabir Rao</option>
            <option value="Meera Sharma">Meera Sharma</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer px-2.5 py-1.5 rounded-lg border border-border bg-background">
            <input
              type="checkbox"
              checked={filters.interactiveOnly}
              onChange={(e) => setInteractiveOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span>Interactive</span>
          </label>
        </div>
      </div>

      {/* Story Intelligence Table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Story</th>
                <th className="py-3 px-3">Creator</th>
                <th className="py-3 px-3">Genre</th>
                <th className="py-3 px-3">Episodes</th>
                <th
                  onClick={() => handleSort("views")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-1">
                    <span>Views</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("completion")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-1">
                    <span>Completion</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("watchTime")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-1">
                    <span>Watch Time</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("engagement")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-1">
                    <span>Engagement</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Interactive</th>
                <th
                  onClick={() => handleSort("followers")}
                  className="py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-1">
                    <span>Followers</span>
                    <ArrowUpDown className="size-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Signals</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedStories.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-muted-foreground">
                    <p className="font-semibold text-sm">No stories match your current filters.</p>
                    <p className="text-xs mt-1">Try resetting the filters or clearing the search query.</p>
                  </td>
                </tr>
              ) : (
                sortedStories.map((story) => (
                  <tr
                    key={story.id}
                    className="hover:bg-muted/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        to="/admin/story-lab/stories/$storyId"
                        params={{ storyId: story.id }}
                        className="flex items-center gap-3"
                      >
                        <img
                          src={story.poster}
                          alt={story.storyTitle}
                          className="w-9 h-12 rounded object-cover border border-border shadow-xs shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors block text-xs">
                            {story.storyTitle}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {story.releasePeriod}
                          </span>
                        </div>
                      </Link>
                    </td>

                    <td className="py-3.5 px-3">
                      <Link
                        to="/admin/creators"
                        className="text-foreground hover:text-primary transition-colors font-medium text-xs"
                      >
                        {story.creatorName}
                      </Link>
                    </td>

                    <td className="py-3.5 px-3 text-muted-foreground">{story.genre}</td>

                    <td className="py-3.5 px-3 font-medium text-foreground">
                      {story.episodesCount} eps
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-foreground">
                      {story.totalViews}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {story.completionRate}
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${story.completionNumber}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-muted-foreground">{story.watchTime}</td>

                    <td className="py-3.5 px-3">
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {story.engagement}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {story.interactive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                          <GitBranch className="size-2.5" />
                          {story.interactiveParticipation}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-muted-foreground">
                      +{story.followersGenerated.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {story.signals.map((sig) => (
                          <SignalBadge key={sig.id} type={sig.type} />
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="size-2.5" />
                        {story.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/admin/story-lab/stories/$storyId"
                        params={{ storyId: story.id }}
                        className="px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors inline-flex items-center gap-1 shadow-xs"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info notice: Decision support workspace, not a leaderboard (Section 11 & 40) */}
        <div className="p-3.5 bg-muted/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Showing {sortedStories.length} of {filteredStoryIntelligence.length} monitored stories.
          </span>
          <span className="italic">
            Story Lab presents audience signals to guide investigation — this is not a ranking or leaderboard.
          </span>
        </div>
      </div>
    </div>
  );
}
