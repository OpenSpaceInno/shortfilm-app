import { createFileRoute, Link } from "@tanstack/react-router";
import { GitBranch, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { InteractiveBadge, InteractiveSeriesCard, StatusBadge } from "@/components/interactive";
import { getSeries } from "@/lib/catalog";
import {
  choicesForSeries,
  endingSoon,
  formatCountdown,
  interactiveSeries,
  liveChoices,
  upcomingChoices,
  type StoryChoice,
} from "@/lib/interactive";
import { useStoryState } from "@/lib/story-state";

export const Route = createFileRoute("/interactive")({
  head: () => ({
    meta: [
      { title: "Interactive Stories — ShortReel" },
      {
        name: "description",
        content:
          "Don't just watch the story. Shape it. Live audience choices, branching short-series and your own story path on ShortReel.",
      },
      { property: "og:title", content: "Interactive Stories — ShortReel" },
      {
        property: "og:description",
        content: "Vote on live story moments and unlock your own branch of the season.",
      },
    ],
  }),
  component: InteractiveHub,
});

function ChoiceRow({ choice, tone }: { choice: StoryChoice; tone?: "soon" }) {
  const item = getSeries(choice.seriesSlug);
  if (!item) return null;
  return (
    <Link
      to="/watch/$slug"
      params={{ slug: item.slug }}
      search={{ ep: choice.episodeNumber }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
    >
      <img
        src={item.poster}
        alt={`${item.title} poster`}
        loading="lazy"
        className="size-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {tone === "soon" ? (
            <StatusBadge tone="soon">ENDING SOON</StatusBadge>
          ) : (
            <StatusBadge tone="live">LIVE</StatusBadge>
          )}
          <span className="truncate text-[11px] text-muted-foreground">
            {item.title} · EP {choice.episodeNumber}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{choice.prompt}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {choice.totalVotes} voted
          {choice.closesInSec > 0 ? ` · closes in ${formatCountdown(choice.closesInSec)}` : ""}
        </p>
      </div>
      <span className="rounded-full bg-primary p-2.5 text-primary-foreground">
        <Play className="size-4 fill-current" />
      </span>
    </Link>
  );
}

function InteractiveHub() {
  const { choices } = useStoryState();
  const series = interactiveSeries();
  const journey = choices
    .slice()
    .sort((a, b) => b.at - a.at)
    .map((c) => ({ record: c, item: getSeries(c.seriesSlug) }))
    .filter((r) => r.item);

  return (
    <AppShell>
      <PageHeader
        title="Interactive Stories"
        subtitle="Don't just watch the story. Shape it."
      />

      <section className="mt-2 px-5">
        <h2 className="font-display text-xl tracking-wide text-foreground">Live choices</h2>
        <div className="mt-3 space-y-3">
          {liveChoices.map((c) => (
            <ChoiceRow key={c.id} choice={c} />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="px-5 font-display text-xl tracking-wide text-foreground">
          Choose your path
        </h2>
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {series.map((s) => (
            <InteractiveSeriesCard
              key={s.slug}
              item={s}
              choice={choicesForSeries(s.slug).find((c) => c.status === "live")}
              className="w-52"
            />
          ))}
        </div>
      </section>

      {endingSoon.length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="font-display text-xl tracking-wide text-foreground">Ending soon</h2>
          <div className="mt-3 space-y-3">
            {endingSoon.map((c) => (
              <ChoiceRow key={c.id} choice={c} tone="soon" />
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 px-5">
        <h2 className="font-display text-xl tracking-wide text-foreground">Your story journey</h2>
        {journey.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            You haven't made a choice yet. Start any live story and the season will branch around
            your decision.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {journey.map(({ record, item }) => (
              <li key={record.choiceId}>
                <Link
                  to="/series/$slug"
                  params={{ slug: record.seriesSlug }}
                  className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-3"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 font-display text-lg text-primary">
                    {record.option}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {item!.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      EP {record.episodeNumber} — you chose “{record.label}”
                    </span>
                  </span>
                  <GitBranch className="size-4 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {upcomingChoices.length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="font-display text-xl tracking-wide text-foreground">
            Upcoming interactive episodes
          </h2>
          <ul className="mt-3 space-y-2">
            {upcomingChoices.map((c) => {
              const item = getSeries(c.seriesSlug);
              if (!item) return null;
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3"
                >
                  <img
                    src={item.poster}
                    alt=""
                    loading="lazy"
                    className="size-12 rounded-lg object-cover opacity-70"
                  />
                  <div className="min-w-0 flex-1">
                    <InteractiveBadge label="COMING SOON" />
                    <p className="mt-1 truncate text-sm font-medium text-foreground">
                      {item.title} · EP {c.episodeNumber}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
