import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Bell, ChevronLeft, Flame, Play, Share2, Users } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  CharacterFollowButton,
  PredictionCard,
  ShareSheet,
} from "@/components/engagement";
import { getSeries } from "@/lib/catalog";
import {
  characterNotifications,
  getCharacter,
  getPrediction,
} from "@/lib/engagement";
import { useEngagement } from "@/lib/engagement-state";

export const Route = createFileRoute("/character/$id")({
  loader: ({ params }) => {
    const character = getCharacter(params.id);
    if (!character) throw notFound();
    return { character };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Character unavailable — ShortReel" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { character } = loaderData;
    const desc = `${character.name} — ${character.role}. ${character.about}`;
    return {
      meta: [
        { title: `${character.name} — Character on ShortReel` },
        { name: "description", content: desc },
        { property: "og:title", content: `${character.name} — ShortReel` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: CharacterProfile,
});

function CharacterProfile() {
  const { character } = Route.useLoaderData();
  const series = getSeries(character.seriesSlug);
  const { isFollowing } = useEngagement();
  const following = isFollowing(character.id);
  const [share, setShare] = useState(false);

  return (
    <AppShell>
      <div className="relative">
        {series ? (
          <img
            src={series.poster}
            alt={`${character.name} in ${series.title}`}
            width={608}
            height={800}
            className="h-[38vh] w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        <Link
          to="/series/$slug"
          params={{ slug: character.seriesSlug }}
          aria-label="Back to series"
          className="absolute top-5 left-4 rounded-full bg-card/70 p-2 text-foreground backdrop-blur"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="absolute bottom-0 w-full px-5 pb-4">
          <h1 className="font-display text-4xl tracking-wide text-foreground">
            {character.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {character.role} · {character.genres.join(" · ")}
          </p>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-primary">
              <Flame className="size-3.5" /> {character.favouritePct}% audience favourite
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" /> {character.followers} followers
            </span>
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="mt-4 flex items-center gap-2">
          <CharacterFollowButton characterId={character.id} className="flex-1 py-3 text-sm" />
          <button
            aria-label="Share character"
            onClick={() => setShare(true)}
            className="rounded-full border border-border bg-card p-3 text-muted-foreground"
          >
            <Share2 className="size-4" />
          </button>
        </div>

        {following ? (
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
              <Bell className="size-3.5" /> Alerts on
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {characterNotifications(character.name).map((n) => (
                <li key={n}>· {n}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <section className="mt-6">
          <h2 className="font-display text-xl tracking-wide text-foreground">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {character.about}
          </p>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-xl tracking-wide text-foreground">Key moments</h2>
          <ul className="mt-3 space-y-2">
            {character.keyMoments.map((m) => (
              <li
                key={m.title}
                className="rounded-2xl border border-border bg-card p-3.5"
              >
                <p className="text-[11px] text-primary">EP {m.episode}</p>
                <p className="text-sm font-semibold text-foreground">{m.title}</p>
                <p className="text-[11px] text-muted-foreground">{m.note}</p>
              </li>
            ))}
          </ul>
        </section>

        {series ? (
          <section className="mt-6">
            <h2 className="font-display text-xl tracking-wide text-foreground">Episodes</h2>
            <ul className="mt-3 space-y-2">
              {(series.seasons[0]?.episodes ?? []).slice(0, 6).map((ep) => (
                <li key={ep.id}>
                  <Link
                    to="/watch/$slug"
                    params={{ slug: series.slug }}
                    search={{ ep: ep.number }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-muted font-display text-base text-foreground">
                      {ep.number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {ep.title}
                    </span>
                    <Play className="size-4 fill-current text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="font-display text-xl tracking-wide text-foreground">
            Popular choices
          </h2>
          <ul className="mt-3 space-y-3">
            {character.popularChoices.map((c) => (
              <li key={c.label}>
                <div className="flex items-center justify-between text-xs text-foreground">
                  <span>{c.label}</span>
                  <span className="text-muted-foreground">{c.sharePct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${c.sharePct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {character.predictionIds.length > 0 ? (
          <section className="mt-6">
            <h2 className="font-display text-xl tracking-wide text-foreground">Predictions</h2>
            <div className="mt-3 space-y-3">
              {character.predictionIds.map((pid) => {
                const p = getPrediction(pid);
                return p ? <PredictionCard key={pid} prediction={p} /> : null;
              })}
            </div>
          </section>
        ) : null}
      </div>

      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title={character.name}
        message={`${character.name} is ${character.favouritePct}% audience favourite on ShortReel. Follow her story.`}
        kinds={["Character", "Story outcome"]}
      />
    </AppShell>
  );
}
