import { Link } from "@tanstack/react-router";
import { Check, GitBranch, Sparkles, Timer, Users } from "lucide-react";
import type { Series } from "@/lib/catalog";
import {
  formatCountdown,
  type ChoiceOption,
  type ChoiceOptionId,
  type StoryChoice,
} from "@/lib/interactive";

export function InteractiveBadge({
  label = "INTERACTIVE",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-primary/60 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-primary ${className}`}
    >
      <Sparkles className="size-3" />
      {label}
    </span>
  );
}

export function StatusBadge({ tone, children }: { tone: "live" | "soon" | "yours"; children: string }) {
  const styles = {
    live: "border-destructive/60 bg-destructive/15 text-destructive",
    soon: "border-primary/60 bg-primary/15 text-primary",
    yours: "border-accent/60 bg-accent/15 text-accent-foreground",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${styles}`}
    >
      {tone === "live" ? (
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  );
}

/** Home / hub card for an interactive series with a pending decision. */
export function InteractiveSeriesCard({
  item,
  choice,
  className = "",
}: {
  item: Series;
  choice?: StoryChoice | undefined;
  className?: string;
}) {
  return (
    <Link
      to="/series/$slug"
      params={{ slug: item.slug }}
      className={`group relative block shrink-0 overflow-hidden rounded-2xl border border-primary/25 bg-card ${className}`}
    >
      <img
        src={item.poster}
        alt={`${item.title} key art`}
        loading="lazy"
        width={576}
        height={1024}
        className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
        <InteractiveBadge />
        {choice?.status === "live" ? <StatusBadge tone="live">VOTE NOW</StatusBadge> : null}
      </div>
      <div className="absolute bottom-0 w-full p-3.5">
        <p className="truncate font-display text-lg tracking-wide text-foreground">
          {item.title}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {item.genres.join(" · ")} · {item.language}
        </p>
        {choice ? (
          <p className="mt-1.5 line-clamp-2 text-xs text-foreground/90">
            “Episode {choice.episodeNumber} is waiting for your decision.”
          </p>
        ) : null}
        <span className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground">
          <GitBranch className="size-3.5" /> Choose the story
        </span>
      </div>
    </Link>
  );
}

/** A single large, touch-friendly choice button. */
export function InteractiveChoice({
  option,
  selected,
  disabled,
  revealed,
  onSelect,
}: {
  option: ChoiceOption;
  selected: boolean;
  disabled: boolean;
  revealed: boolean;
  onSelect: (id: ChoiceOptionId) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      className={`relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300 active:scale-[0.98] ${
        selected
          ? "border-primary bg-primary/15 shadow-[0_0_30px_-8px_var(--color-primary)]"
          : disabled
            ? "border-border bg-card/60 opacity-45"
            : "border-border bg-card/80 hover:border-primary/60"
      }`}
    >
      {revealed ? (
        <span
          className="absolute inset-y-0 left-0 bg-primary/15 transition-[width] duration-700 ease-out"
          style={{ width: `${option.sharePct}%` }}
        />
      ) : null}
      <span className="relative flex items-center gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl font-display text-lg ${
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          {selected ? <Check className="size-4" /> : option.id}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {option.label}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {option.detail}
          </span>
        </span>
        {revealed ? (
          <span className="font-display text-xl tracking-wide text-foreground">
            {option.sharePct}%
          </span>
        ) : null}
      </span>
    </button>
  );
}

/** Confirmation + audience split shown after a vote. */
export function ChoiceResult({
  choice,
  option,
  onContinue,
}: {
  choice: StoryChoice;
  option: ChoiceOptionId;
  onContinue: () => void;
}) {
  const picked = choice.options.find((o) => o.id === option)!;
  return (
    <div className="animate-in fade-in text-center duration-500">
      <p className="text-[11px] font-semibold tracking-[0.25em] text-primary uppercase">
        Your choice has been recorded
      </p>
      <p className="mt-2 font-display text-2xl tracking-wide text-foreground">
        You chose: {picked.label}
      </p>
      <div className="mt-5 space-y-2.5 text-left">
        {choice.options.map((o) => (
          <div key={o.id} className="rounded-xl border border-border bg-card/70 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">
                {o.id} — {o.label}
              </span>
              <span className="font-display text-lg text-foreground">{o.sharePct}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
                  o.id === option ? "bg-primary" : "bg-muted-foreground/50"
                }`}
                style={{ width: `${o.sharePct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        {choice.totalVotes} viewers voted on this moment
      </p>
      <button
        onClick={onContinue}
        className="mt-5 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
      >
        Continue story — Path {option}
      </button>
    </div>
  );
}

export function ChoiceMeta({ choice, secondsLeft }: { choice: StoryChoice; secondsLeft: number }) {
  return (
    <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Timer className="size-3.5 text-primary" />
        Voting ends in{" "}
        <span className="font-display text-base tracking-wide text-foreground">
          {formatCountdown(secondsLeft)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Users className="size-3.5" />
        {choice.totalVotes} voted
      </span>
    </div>
  );
}
