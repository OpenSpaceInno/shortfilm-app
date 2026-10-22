import { createFileRoute, Link } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { CharacterCard } from "@/components/engagement";
import { ContinueCard, PosterCard } from "@/components/series-card";
import { continueWatching, getSeries, series } from "@/lib/catalog";
import { characters } from "@/lib/engagement";
import { useEngagement } from "@/lib/engagement-state";
import { useStoryState } from "@/lib/story-state";

const tabs = [
  "Continue",
  "Favorites",
  "Following",
  "My Choices",
  "Characters",
  "Creators",
  "Completed",
] as const;

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — ShortReel" },
      {
        name: "description",
        content:
          "Your continue watching list, favorites, story choices, followed characters and completed stories on ShortReel.",
      },
      { property: "og:title", content: "My Library — ShortReel" },
      {
        property: "og:description",
        content: "Pick up where you left off across every series and story path you follow.",
      },
    ],
  }),
  component: Library,
});

const creators = [
  { name: "Nine Frames Studio", note: "Floor Nine · Glass Tower" },
  { name: "Monsoon Pictures", note: "Rooftop Monsoon" },
  { name: "Late Local Films", note: "The Missing Phone" },
];

function Library() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Continue");
  const favorites = series.slice(1, 4);
  const following = series.slice(2, 6);
  const { choices } = useStoryState();
  const { followedCharacters } = useEngagement();
  const followedCast = characters.filter((c) => followedCharacters.includes(c.id));
  const completed = series.slice(3, 6);

  return (
    <AppShell>
      <PageHeader title="My Library" />
      <div className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Continue" && (
        <div className="mt-5 flex flex-wrap gap-3 px-5">
          {continueWatching.map(({ series: s, episode }) => (
            <ContinueCard
              key={episode.id}
              item={s}
              episodeNumber={episode.number}
              progress={episode.progress ?? 0}
            />
          ))}
        </div>
      )}

      {(tab === "Favorites" || tab === "Following" || tab === "Completed") && (
        <div className="mt-5 grid grid-cols-2 gap-3 px-5">
          {(tab === "Favorites" ? favorites : tab === "Following" ? following : completed).map(
            (s) => (
              <PosterCard key={s.slug} item={s} />
            ),
          )}
        </div>
      )}

      {tab === "My Choices" && (
        <div className="mt-5 px-5">
          {choices.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No choices yet. Play an interactive episode and your path shows up here.
            </p>
          ) : (
            <ul className="space-y-2">
              {choices
                .slice()
                .sort((a, b) => b.at - a.at)
                .map((c) => {
                  const item = getSeries(c.seriesSlug);
                  return (
                    <li key={c.choiceId}>
                      <Link
                        to="/series/$slug"
                        params={{ slug: c.seriesSlug }}
                        className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-3"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 font-display text-lg text-primary">
                          {c.option}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {item?.title ?? c.seriesSlug}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            EP {c.episodeNumber} — “{c.label}”
                          </span>
                        </span>
                        <GitBranch className="size-4 text-primary" />
                      </Link>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      )}

      {tab === "Characters" && (
        <div className="mt-5 space-y-2 px-5">
          {followedCast.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Follow a character from any series page to see them here.
            </p>
          ) : (
            followedCast.map((c) => <CharacterCard key={c.id} character={c} />)
          )}
        </div>
      )}

      {tab === "Creators" && (
        <ul className="mt-5 space-y-2 px-5">
          {creators.map((c) => (
            <li
              key={c.name}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <span className="grid size-10 place-items-center rounded-full bg-primary/15 font-display text-base text-primary">
                {c.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {c.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">{c.note}</span>
              </span>
              <span className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
                Following
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
