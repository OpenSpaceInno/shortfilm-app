import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { PosterCard } from "@/components/series-card";
import { genres as defaultGenres, series as defaultSeries } from "@/lib/catalog";
import { useStories, useGenres } from "@/hooks/use-catalog";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Genres — ShortReel" },
      {
        name: "description",
        content:
          "Browse vertical short-series by genre: romance, thriller, comedy, mystery and more.",
      },
      { property: "og:title", content: "Browse Genres — ShortReel" },
      {
        property: "og:description",
        content: "Find your next binge across every short-series genre.",
      },
    ],
  }),
  component: Browse,
});

function Browse() {
  const [active, setActive] = useState<string>("All");
  const { data: genres = defaultGenres } = useGenres();
  const { data: allSeries = defaultSeries, isLoading } = useStories(
    active === "All" ? undefined : { genre: active }
  );

  const list = allSeries;

  return (
    <AppShell>
      <PageHeader title="Browse" subtitle="Every series, sorted your way" />
      <div className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["All", ...genres].map((g) => (
          <button
            key={g}
            onClick={() => setActive(g)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              active === g
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        {list.map((s) => (
          <PosterCard key={s.slug} item={s} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="px-5 py-16 text-center text-sm text-muted-foreground">
          Nothing here yet — new drops every Friday.
        </p>
      )}
    </AppShell>
  );
}
