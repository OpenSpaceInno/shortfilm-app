import { createFileRoute, Link } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { genres as defaultGenres, series as defaultSeries } from "@/lib/catalog";
import { useSearch, useGenres } from "@/hooks/use-catalog";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Series — ShortReel" },
      {
        name: "description",
        content: "Search short-series by title, genre or language on ShortReel.",
      },
      { property: "og:title", content: "Search Series — ShortReel" },
      {
        property: "og:description",
        content: "Find any short-series in seconds.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const term = q.trim();
  const { data: genres = defaultGenres } = useGenres();
  const { data: searchResult, isLoading } = useSearch(term);

  const results = term ? (searchResult?.stories ?? []) : [];

  return (
    <AppShell>
      <PageHeader title="Search" />
      <div className="px-5">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3">
          <SearchIcon className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Series, genre or language"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {!term ? (
        <div className="mt-7 px-5">
          <h2 className="font-display text-lg tracking-wide text-foreground">
            Trending searches
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setQ(g)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="mt-5 space-y-3 px-5">
          {results.map((s) => (
            <li key={s.slug}>
              <Link
                to="/series/$slug"
                params={{ slug: s.slug }}
                className="flex gap-3 rounded-xl border border-border bg-card p-2"
              >
                <img
                  src={s.poster}
                  alt={`${s.title} poster`}
                  loading="lazy"
                  width={576}
                  height={1024}
                  className="h-24 w-16 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 py-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {s.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {s.genres.join(" · ")} · {s.language}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {s.episodeCount} episodes · {s.views} views
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {results.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No matches for “{q}”.
            </p>
          )}
        </ul>
      )}
    </AppShell>
  );
}
