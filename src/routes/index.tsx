import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Crown, Heart, Play, Smartphone, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InteractiveSeriesCard } from "@/components/interactive";
import {
  CharacterCard,
  MoodPicker,
  PersonalizedRecommendation,
  StoryBattleCard,
} from "@/components/engagement";
import { ContinueCard, PosterCard, Row } from "@/components/series-card";
import { continueWatching, freeToWatch, getSeries, series, trending } from "@/lib/catalog";
import { useStories, useFeaturedStories } from "@/hooks/use-catalog";
import { choicesForSeries, interactiveSeries } from "@/lib/interactive";
import {
  becauseYouLove,
  characters,
  moods,
  nextObsession,
  seriesForMood,
  storyBattles,
  tasteGenres,
  type Mood,
} from "@/lib/engagement";
import { useEngagement } from "@/lib/engagement-state";
import { useStoryState } from "@/lib/story-state";
import { featuredCreators } from "@/lib/creators";
import { CreatorCard } from "@/components/creator-ecosystem";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShortReel — Vertical Short-Series Streaming" },
      {
        name: "description",
        content:
          "Binge vertical short-series dramas, thrillers and romance. New episodes daily, free and premium.",
      },
      { property: "og:title", content: "ShortReel — Vertical Short-Series Streaming" },
      {
        property: "og:description",
        content: "Binge vertical short-series in under two minutes an episode.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: allStories = series } = useStories();
  const { data: featuredStories = trending } = useFeaturedStories();
  const hero = featuredStories[0] || allStories[0] || series[0]!;
  const trendingList = allStories.filter((s) => s.trending);
  const freeList = allStories.filter((s) => !s.premium);

  const { mood, setMood, followedCharacters, unreadCount } = useEngagement();
  const { choices } = useStoryState();

  const moodPicks = mood ? seriesForMood(mood) : [];
  const yourCharacters = characters.filter((c) => followedCharacters.includes(c.id));
  const unfinished = Array.from(new Set(choices.map((c) => c.seriesSlug)))
    .map((slug) => allStories.find((s) => s.slug === slug) || getSeries(slug))
    .filter((s) => Boolean(s));

  return (
    <AppShell>
      <section className="relative">
        <img
          src={hero.poster}
          alt={`${hero.title} key art`}
          width={608}
          height={1088}
          className="h-[68vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        <div className="absolute top-0 flex w-full items-center justify-between px-5 pt-6">
          <span className="font-display text-xl tracking-[0.2em] text-primary">
            SHORTREEL
          </span>
          <div className="flex items-center gap-2">
            <Link
              to="/pwa"
              aria-label="ShortReel App"
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-card/70 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur hover:bg-card/90 transition-colors"
            >
              <Smartphone className="size-3 text-primary" /> App
            </Link>
            <Link
              to="/creator/studio"
              className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-card/70 px-2.5 py-1 text-xs font-semibold text-primary backdrop-blur hover:bg-primary/20 transition-colors"
            >
              <Sparkles className="size-3" /> Studio
            </Link>
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative rounded-full border border-border bg-card/70 p-1.5 text-foreground backdrop-blur"
            >
              <Bell className="size-4" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
              ) : null}
            </Link>
            <Link
              to="/plans"
              className="inline-flex items-center gap-1 rounded-full border border-primary/50 px-3 py-1 text-xs font-semibold text-primary"
            >
              <Crown className="size-3" /> Go VIP
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 w-full px-5 pb-6">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {hero.genres.join(" · ")} · {hero.language}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight tracking-wide text-foreground">
            {hero.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{hero.tagline}</p>
          <div className="mt-4 flex gap-3">
            <Link
              to="/watch/$slug"
              params={{ slug: hero.slug }}
              search={{ ep: 1 }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              <Play className="size-4 fill-current" /> Play EP 1
            </Link>
            <Link
              to="/series/$slug"
              params={{ slug: hero.slug }}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-card/70 py-3 text-sm font-semibold text-foreground"
            >
              Details
            </Link>
          </div>
        </div>
      </section>

      {continueWatching.length > 0 && (
        <Row title="Continue watching">
          {continueWatching.map(({ series: s, episode }) => (
            <ContinueCard
              key={episode.id}
              item={s}
              episodeNumber={episode.number}
              progress={episode.progress ?? 0}
            />
          ))}
        </Row>
      )}

      <section className="mt-7">
        <div className="flex items-baseline justify-between px-5">
          <div>
            <h2 className="inline-flex items-center gap-2 font-display text-xl tracking-wide text-foreground">
              <Sparkles className="size-4 text-primary" /> You decide what happens next
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Watch it. Choose it. Shape it.
            </p>
          </div>
          <Link to="/interactive" className="text-xs text-primary">
            See all
          </Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {interactiveSeries().map((s) => (
            <InteractiveSeriesCard
              key={s.slug}
              item={s}
              choice={choicesForSeries(s.slug).find((c) => c.status === "live")}
              className="w-52"
            />
          ))}
        </div>
      </section>

      <section className="mt-7 px-5">
        <h2 className="font-display text-xl tracking-wide text-foreground">
          What are you in the mood for?
        </h2>
        <div className="mt-3">
          <MoodPicker
            value={mood}
            onChange={(m) => setMood((m as Mood) ?? null)}
            options={moods}
          />
        </div>
        {mood ? (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {moodPicks.map((s) => (
              <PosterCard key={s.slug} item={s} className="w-32" />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-7 px-5">
        <h2 className="font-display text-xl tracking-wide text-foreground">
          Your next obsession
        </h2>
        <div className="mt-3">
          <PersonalizedRecommendation
            item={nextObsession()}
            reason={`Because you love ${tasteGenres.join(" + ")}`}
          />
        </div>
      </section>

      <Row title={`Because you love ${tasteGenres.join(" + ")}`}>
        {becauseYouLove().map((s) => (
          <PosterCard key={s.slug} item={s} className="w-32" />
        ))}
      </Row>

      {unfinished.length > 0 && (
        <Row title="Continue your story">
          {unfinished.map((s) => (
            <InteractiveSeriesCard
              key={s!.slug}
              item={s!}
              choice={choicesForSeries(s!.slug).find((c) => c.status === "live")}
              className="w-52"
            />
          ))}
        </Row>
      )}

      {yourCharacters.length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="inline-flex items-center gap-2 font-display text-xl tracking-wide text-foreground">
            <Heart className="size-4 text-primary" /> Your characters
          </h2>
          <div className="mt-3 space-y-2">
            {yourCharacters.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 px-5">
        <h2 className="font-display text-xl tracking-wide text-foreground">Story battles</h2>
        <div className="mt-3 space-y-3">
          {storyBattles.map((b) => (
            <StoryBattleCard key={b.id} battle={b} />
          ))}
        </div>
      </section>

      {/* Creator Spotlight */}
      <section className="mt-8 px-5">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-display text-xs tracking-widest text-primary uppercase">
              Creator Spotlight
            </span>
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              Stories Start With Creators
            </h2>
          </div>
          <Link
            to="/creators"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Explore all →
          </Link>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Discover the indie studios making interactive vertical series.
        </p>
        <div className="mt-3.5 space-y-3">
          {featuredCreators.slice(0, 2).map((c) => (
            <CreatorCard key={c.id} creator={c} compact />
          ))}
        </div>
      </section>

      <Row title="Trending now" action="See all">
        {trendingList.map((s) => (
          <PosterCard key={s.slug} item={s} className="w-32" />
        ))}
      </Row>

      <Row title="Free to watch" action="See all">
        {freeList.map((s) => (
          <PosterCard key={s.slug} item={s} className="w-32" />
        ))}
      </Row>

      <Row title="New drops">
        {[...allStories].reverse().map((s) => (
          <PosterCard key={s.slug} item={s} className="w-32" />
        ))}
      </Row>

      <section className="mx-5 mt-8 rounded-2xl border border-primary/30 bg-card p-5">
        <p className="font-display text-xl tracking-wide text-foreground">
          Unlock every episode
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ad-free, 1080p portrait streaming, early access to new drops.
        </p>
        <Link
          to="/plans"
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          View plans
        </Link>
      </section>
    </AppShell>
  );
}
