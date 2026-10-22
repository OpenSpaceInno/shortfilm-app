import { Link } from "@tanstack/react-router";
import {
  Award,
  Bell,
  Check,
  Flame,
  Heart,
  Share2,
  Sparkles,
  Swords,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Series } from "@/lib/catalog";
import {
  levelProgress,
  levelTitle,
  type BadgeDef,
  type Character,
  type NotificationItem,
  type Prediction,
  type StoryBattle,
} from "@/lib/engagement";
import { useEngagement } from "@/lib/engagement-state";

/* ------------------------------- XP badge ------------------------------- */

export function XPBadge({ compact = false }: { compact?: boolean }) {
  const { totalXp, level } = useEngagement();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
      <Sparkles className="size-3" />
      {totalXp.toLocaleString()} XP
      {compact ? null : <span className="text-muted-foreground">· Lv {level}</span>}
    </span>
  );
}

/* ----------------------------- Prediction ------------------------------- */

export function PredictionCard({ prediction }: { prediction: Prediction }) {
  const { predictionFor, makePrediction } = useEngagement();
  const saved = predictionFor(prediction.id);
  const picked = prediction.options.find((o) => o.id === saved?.optionId);

  return (
    <div className="rounded-2xl border border-primary/25 bg-card p-4">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
        <TrendingUp className="size-3.5" /> Prediction
      </p>
      <h3 className="mt-1.5 font-display text-xl tracking-wide text-foreground">
        {prediction.question}
      </h3>
      {saved && picked ? (
        <div className="mt-4 animate-in fade-in duration-500">
          <p className="text-sm font-semibold text-foreground">
            Prediction saved — {picked.label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You'll find out in Episode {prediction.revealEpisode}.
          </p>
          <ul className="mt-4 space-y-2">
            {prediction.options.map((o) => (
              <li key={o.id}>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className={o.id === picked.id ? "text-foreground" : ""}>{o.label}</span>
                  <span>{o.sharePct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-[width] duration-1000 ${
                      o.id === picked.id ? "bg-primary" : "bg-muted-foreground/40"
                    }`}
                    style={{ width: `${o.sharePct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {prediction.options.map((o) => (
            <button
              key={o.id}
              onClick={() => makePrediction(prediction.id, o.id)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card/70 px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-primary/60 active:scale-[0.99]"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        {prediction.participants} viewers predicted · for fun only, no prizes
      </p>
    </div>
  );
}

/* -------------------------------- Badges -------------------------------- */

export function BadgeCard({ badge, earned }: { badge: BadgeDef; earned: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        earned ? "border-primary/40 bg-primary/5" : "border-border bg-card/60 opacity-55"
      }`}
    >
      <span
        className={`grid size-9 place-items-center rounded-xl ${
          earned ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Award className="size-4" />
      </span>
      <p className="mt-2.5 text-sm font-semibold text-foreground">{badge.name}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
        {badge.description}
      </p>
    </div>
  );
}

/* ------------------------------ Characters ------------------------------ */

export function CharacterFollowButton({
  characterId,
  className = "",
}: {
  characterId: string;
  className?: string;
}) {
  const { isFollowing, toggleFollow } = useEngagement();
  const following = isFollowing(characterId);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        toggleFollow(characterId);
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
        following
          ? "border border-primary/50 bg-primary/10 text-primary"
          : "bg-primary text-primary-foreground"
      } ${className}`}
    >
      {following ? <Check className="size-3.5" /> : <Heart className="size-3.5" />}
      {following ? "Following" : "Follow"}
    </button>
  );
}

export function CharacterCard({ character }: { character: Character }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <Link
        to="/character/$id"
        params={{ id: character.id }}
        className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-lg text-primary"
      >
        {character.name.slice(0, 1)}
      </Link>
      <Link to="/character/$id" params={{ id: character.id }} className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{character.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{character.role}</p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-primary">
          <Flame className="size-3" /> {character.favouritePct}% audience favourite
        </p>
      </Link>
      <CharacterFollowButton characterId={character.id} />
    </div>
  );
}

/* ----------------------------- Story battle ----------------------------- */

export function StoryBattleCard({ battle, title }: { battle: StoryBattle; title?: string }) {
  const { battleFor, voteBattle } = useEngagement();
  const voted = battleFor(battle.id);

  return (
    <div className="rounded-2xl border border-primary/25 bg-card p-4">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
        <Swords className="size-3.5" /> Story battle
      </p>
      <h3 className="mt-1.5 font-display text-xl tracking-wide text-foreground">
        {title ?? battle.title}
      </h3>
      <div className="mt-3 space-y-2">
        {battle.options.map((o) => (
          <button
            key={o.id}
            disabled={Boolean(voted)}
            onClick={() => voteBattle(battle.id, o.id)}
            className={`relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors ${
              voted?.option === o.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card/70 hover:border-primary/50"
            }`}
          >
            {voted ? (
              <span
                className="absolute inset-y-0 left-0 bg-primary/10"
                style={{ width: `${o.sharePct}%` }}
              />
            ) : null}
            <span className="relative flex items-center justify-between">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{o.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {o.detail}
                </span>
              </span>
              {voted ? (
                <span className="font-display text-lg text-foreground">{o.sharePct}%</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        {battle.votes} votes · closes in {battle.closesIn}
        {voted ? ` · you voted ${voted.option}` : ""}
      </p>
    </div>
  );
}

/* ---------------------------- Notifications ----------------------------- */

export function NotificationCard({ item }: { item: NotificationItem }) {
  const icon = {
    vote: Sparkles,
    closing: Bell,
    episode: Bell,
    prediction: TrendingUp,
    character: Heart,
  }[item.kind];
  const Icon = icon;
  const inner = (
    <span className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{item.body}</span>
      </span>
      <span className="text-[10px] text-muted-foreground">{item.time}</span>
    </span>
  );

  if (item.href.to === "/interactive")
    return (
      <Link to="/interactive" className="block">
        {inner}
      </Link>
    );
  if (item.href.to === "/watch/$slug")
    return (
      <Link to="/watch/$slug" params={item.href.params} search={item.href.search} className="block">
        {inner}
      </Link>
    );
  if (item.href.to === "/series/$slug")
    return (
      <Link to="/series/$slug" params={item.href.params} className="block">
        {inner}
      </Link>
    );
  return (
    <Link to="/character/$id" params={item.href.params} className="block">
      {inner}
    </Link>
  );
}

/* ---------------------------- Recommendation ---------------------------- */

export function PersonalizedRecommendation({
  item,
  reason,
}: {
  item: Series;
  reason: string;
}) {
  return (
    <Link
      to="/series/$slug"
      params={{ slug: item.slug }}
      className="flex gap-3 rounded-2xl border border-primary/25 bg-card p-3"
    >
      <img
        src={item.poster}
        alt={`${item.title} poster`}
        loading="lazy"
        className="h-28 w-20 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
          {reason}
        </p>
        <p className="mt-1 truncate font-display text-xl tracking-wide text-foreground">
          {item.title}
        </p>
        <p className="line-clamp-2 text-[11px] text-muted-foreground">{item.tagline}</p>
        <span className="mt-2 inline-flex rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold text-primary-foreground">
          Start watching
        </span>
      </div>
    </Link>
  );
}

/* --------------------------- Story journey ------------------------------ */

export function StoryJourneyCard() {
  const { stats, level } = useEngagement();
  const rows = [
    ["Episodes watched", stats.episodesWatched],
    ["Stories completed", stats.storiesCompleted],
    ["Choices made", stats.choicesMade],
    ["Predictions", stats.predictions],
    ["Characters followed", stats.charactersFollowed],
    ["Creators followed", stats.creatorsFollowed],
  ] as const;

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-4">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
        My story journey
      </p>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="font-display text-3xl tracking-wide text-foreground">
          {stats.xp.toLocaleString()} XP
        </span>
        <span className="text-sm text-muted-foreground">
          Level {level} · {levelTitle(level)}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${Math.round(levelProgress(stats.xp) * 100)}%` }}
        />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-background/40 p-2.5">
            <dt className="text-[10px] leading-tight text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-display text-xl tracking-wide text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* --------------------------------- Share -------------------------------- */

export type ShareKind = "Episode" | "Choice" | "Prediction" | "Character" | "Story outcome";

export function ShareSheet({
  open,
  onClose,
  title,
  message,
  kinds,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  kinds: ShareKind[];
}) {
  const { awardXp } = useEngagement();
  const [shared, setShared] = useState<ShareKind | null>(null);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-background/70 backdrop-blur-sm">
      <button aria-label="Close share" className="absolute inset-0" onClick={onClose} />
      <div className="relative mx-auto w-full max-w-md rounded-t-2xl border-t border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl tracking-wide text-foreground">Share {title}</p>
          <button aria-label="Close" onClick={onClose} className="text-muted-foreground">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-3 rounded-xl border border-border bg-background/50 p-3 text-sm text-foreground">
          {message}
        </p>
        <p className="mt-2 text-[11px] text-primary">[ WATCH &amp; CHOOSE ]</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {kinds.map((k) => (
            <button
              key={k}
              onClick={() => {
                setShared(k);
                awardXp("share", `Shared ${k.toLowerCase()}`);
              }}
              className={`rounded-xl border px-3 py-3 text-xs font-semibold ${
                shared === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background/40 text-foreground"
              }`}
            >
              <Share2 className="mx-auto mb-1.5 size-4" />
              Share {k.toLowerCase()}
            </button>
          ))}
        </div>
        {shared ? (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Link copied — {shared.toLowerCase()} ready to share.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ----------------------------- Mood picker ------------------------------ */

export function MoodPicker({
  value,
  onChange,
  options,
}: {
  value: string | null;
  onChange: (m: string | null) => void;
  options: readonly string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((m) => (
        <button
          key={m}
          onClick={() => onChange(value === m ? null : m)}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            value === m
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
