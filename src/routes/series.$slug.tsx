import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Bookmark, ChevronLeft, Crown, GitBranch, Lock, Play, Share2, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { InteractiveBadge, StatusBadge } from "@/components/interactive";
import {
  CharacterCard,
  PredictionCard,
  ShareSheet,
  StoryBattleCard,
} from "@/components/engagement";
import { StoryMap } from "@/components/story-map";
import { formatDuration, getSeries } from "@/lib/catalog";
import { choicesForSeries, isInteractive, splitEpisode } from "@/lib/interactive";
import {
  charactersForSeries,
  predictionsForSeries,
  storyBattles,
} from "@/lib/engagement";
import { useStoryState } from "@/lib/story-state";
import { creatorForSeries } from "@/lib/creators";
import { getEpisodeScene } from "@/lib/episode-scenes";

export const Route = createFileRoute("/series/$slug")({
  loader: ({ params }) => {
    const item = getSeries(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Series unavailable — ShortReel" }, { name: "robots", content: "noindex" }],
      };
    }
    const { item } = loaderData;
    return {
      meta: [
        { title: `${item.title} — Watch on ShortReel` },
        { name: "description", content: item.synopsis },
        { property: "og:title", content: `${item.title} — ShortReel` },
        { property: "og:description", content: item.synopsis },
      ],
    };
  },
  component: SeriesDetail,
});

function SeriesDetail() {
  const { item } = Route.useLoaderData();
  const season = item.seasons[0]!;
  const { pathFor } = useStoryState();
  const interactive = isInteractive(item.slug);
  const path = interactive ? pathFor(item.slug) : null;
  const liveChoice = choicesForSeries(item.slug).find((c) => c.status === "live");
  const split = interactive ? splitEpisode(item.slug) : 0;
  const cast = charactersForSeries(item.slug);
  const seriesPredictions = predictionsForSeries(item.slug);
  const battle = storyBattles.find((b) => b.seriesSlug === item.slug);
  const creator = creatorForSeries(item.slug);
  const [share, setShare] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <AppShell>
      <div className="relative">
        {/* Floating Back Button */}
        <div className="absolute top-5 left-4 z-20">
          <button
            onClick={handleBack}
            className="flex items-center justify-center size-9 rounded-full bg-black/60 text-white backdrop-blur border border-white/20 shadow-md active:scale-90 transition-transform"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>

        <img
          src={item.poster}
          alt={`${item.title} key art`}
          width={608}
          height={1088}
          className="h-[52vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 w-full px-5 pb-4">
          {interactive ? (
            <div className="mb-2 flex gap-1.5">
              <InteractiveBadge />
              {liveChoice ? <StatusBadge tone="live">CHOICE LIVE</StatusBadge> : null}
              {path ? <StatusBadge tone="yours">{`PATH ${path}`}</StatusBadge> : null}
            </div>
          ) : null}
          <h1 className="font-display text-3xl tracking-wide text-foreground">
            {item.title}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {item.genres.join(" · ")} · {item.language} · {item.ageRating} ·{" "}
            {item.episodeCount} eps
          </p>
        </div>
      </div>

      <div className="px-5">
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {item.synopsis}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Link
            to="/watch/$slug"
            params={{ slug: item.slug }}
            search={{ ep: 1 }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            <Play className="size-4 fill-current" /> Start watching
          </Link>
          <button
            aria-label="Add to library"
            className="rounded-full border border-border bg-card p-3 text-muted-foreground"
          >
            <Bookmark className="size-4" />
          </button>
          <button
            aria-label="Share series"
            onClick={() => setShare(true)}
            className="rounded-full border border-border bg-card p-3 text-muted-foreground"
          >
            <Share2 className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-foreground">
            <Star className="size-3.5 fill-primary text-primary" /> 4.7
          </span>
          <span>{item.views} views</span>
          <span>{item.premium ? "VIP series" : "Free series"}</span>
        </div>

        {creator && (
          <Link
            to="/creator/$id"
            params={{ id: creator.id }}
            className="mt-3 flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Created by {creator.name}</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-semibold">
                Studio
              </span>
            </div>
            <span className="text-primary font-semibold">Profile →</span>
          </Link>
        )}

        {interactive && (
          <section className="mt-7">
            <div className="flex items-baseline justify-between">
              <h2 className="inline-flex items-center gap-2 font-display text-xl tracking-wide text-foreground">
                <Sparkles className="size-4 text-primary" /> Your story
              </h2>
              <span className="text-xs text-muted-foreground">
                {path ? `Path ${path} unlocked` : `Branches at EP ${split}`}
              </span>
            </div>
            <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
                <GitBranch className="size-3.5" />
                {path ? "Story status" : "Choice waiting"}
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                {path
                  ? `You steered this season down path ${path}. Later episodes follow your decision.`
                  : liveChoice
                    ? `Episode ${liveChoice.episodeNumber} ends on a decision: “${liveChoice.prompt}”`
                    : "New interactive moments drop with the next episodes."}
              </p>
              {liveChoice ? (
                <Link
                  to="/watch/$slug"
                  params={{ slug: item.slug }}
                  search={{ ep: liveChoice.episodeNumber }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
                >
                  <Sparkles className="size-4" />
                  {path ? "Revisit the choice" : "Make your choice"}
                </Link>
              ) : null}
            </div>

            <h3 className="mt-5 font-display text-lg tracking-wide text-foreground">
              Story map
            </h3>
            <div className="mt-3">
              <StoryMap
                slug={item.slug}
                poster={item.poster}
                path={path}
                watchedUpTo={split + 1}
              />
            </div>
          </section>
        )}

        {cast.length > 0 && (
          <section className="mt-7">
            <h2 className="font-display text-xl tracking-wide text-foreground">Characters</h2>
            <div className="mt-3 space-y-2">
              {cast.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>
          </section>
        )}

        {seriesPredictions.length > 0 && (
          <section className="mt-7 space-y-3">
            {seriesPredictions.map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
          </section>
        )}

        {battle ? (
          <div className="mt-7">
            <StoryBattleCard battle={battle} title="Which ending should win?" />
          </div>
        ) : null}

        <h2 className="mt-7 font-display text-xl tracking-wide text-foreground">
          {season.title}
        </h2>
        <ul className="mt-3 space-y-2.5">
          {season.episodes.map((ep) => {
            const epScene = getEpisodeScene(item.slug, ep.number, item.genres);
            return (
              <li key={ep.id}>
                <Link
                  to="/watch/$slug"
                  params={{ slug: item.slug }}
                  search={{ ep: ep.number }}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 hover:border-primary/40 transition-colors"
                >
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-black">
                    <img
                      src={epScene.thumbnail}
                      alt={epScene.title}
                      width={88}
                      height={120}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[9px] font-bold text-white">
                      {ep.number}
                    </span>
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between">
                      <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {epScene.title || ep.title}
                      </span>
                      {ep.premium ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                          <Crown className="size-2.5" /> VIP
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-[11px] text-muted-foreground">
                      {epScene.synopsisSnippet}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted-foreground/80 font-mono">
                      {formatDuration(ep.durationSec)}
                    </span>
                    {ep.progress ? (
                      <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${Math.round(ep.progress * 100)}%` }}
                        />
                      </span>
                    ) : null}
                  </span>
                  <div className="rounded-full bg-muted/60 p-2 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <Play className="size-3.5 fill-current" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {item.premium && (
          <Link
            to="/plans"
            className="mt-6 flex items-center justify-center gap-2 rounded-full border border-primary/50 py-3 text-sm font-semibold text-primary"
          >
            <Crown className="size-4" /> Unlock all episodes
          </Link>
        )}
      </div>

      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title={item.title}
        message={
          path
            ? `I chose PATH ${path} in ${item.title}. What would you choose?`
            : `${item.title} on ShortReel — ${item.tagline}`
        }
        kinds={["Episode", "Choice", "Prediction", "Story outcome"]}
      />
    </AppShell>
  );
}
