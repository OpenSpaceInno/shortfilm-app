import { Link } from "@tanstack/react-router";
import { Check, Lock, Play, Sparkles } from "lucide-react";
import type { ChoiceOptionId } from "@/lib/interactive";
import { splitEpisode, storyNodes } from "@/lib/interactive";

/**
 * Cinematic story path: a spine of episodes that forks at the choice point.
 * Selected branch is lit; the other branch stays dim and locked.
 */
export function StoryMap({
  slug,
  poster,
  path,
  watchedUpTo,
}: {
  slug: string;
  poster: string;
  path: ChoiceOptionId | null;
  watchedUpTo: number;
}) {
  const nodes = storyNodes(slug);
  const split = splitEpisode(slug);
  const spine = nodes.filter((n) => n.kind === "episode" && n.branch === null);
  const choiceNode = nodes.find((n) => n.kind === "choice")!;
  const branchA = nodes.filter((n) => n.branch === "A");
  const branchB = nodes.filter((n) => n.branch === "B");

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <ol className="space-y-2">
        {spine.map((n) => {
          const done = n.episode < watchedUpTo;
          return (
            <li key={n.id}>
              <Link
                to="/watch/$slug"
                params={{ slug }}
                search={{ ep: n.episode }}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2"
              >
                <img
                  src={poster}
                  alt=""
                  loading="lazy"
                  className="size-11 rounded-lg object-cover opacity-80"
                />
                <span className="flex-1 text-sm font-medium text-foreground">{n.label}</span>
                {done ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <Play className="size-4 fill-current text-muted-foreground" />
                )}
              </Link>
              <Connector />
            </li>
          );
        })}
      </ol>

      <div className="relative rounded-xl border border-primary/50 bg-primary/10 px-4 py-3 text-center">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
          <Sparkles className="size-3" /> Choice · Episode {split}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">{choiceNode.label}</p>
        {path ? (
          <p className="mt-1 text-[11px] text-muted-foreground">You chose path {path}</p>
        ) : (
          <p className="mt-1 text-[11px] text-primary">Choice waiting</p>
        )}
      </div>

      <div className="mt-1 flex justify-center">
        <div className="h-6 w-px bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Branch slug={slug} poster={poster} id="A" nodes={branchA} active={path === "A"} chosen={path !== null} />
        <Branch slug={slug} poster={poster} id="B" nodes={branchB} active={path === "B"} chosen={path !== null} />
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center">
      <div className="h-4 w-px bg-border" />
    </div>
  );
}

export function StoryBranch({
  id,
  active,
  children,
}: {
  id: ChoiceOptionId;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-2.5 transition-all ${
        active
          ? "border-primary bg-primary/10 shadow-[0_0_24px_-10px_var(--color-primary)]"
          : "border-border bg-background/50 opacity-60"
      }`}
    >
      <p className="mb-2 text-center text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        Path {id}
      </p>
      {children}
    </div>
  );
}

function Branch({
  slug,
  poster,
  id,
  nodes,
  active,
  chosen,
}: {
  slug: string;
  poster: string;
  id: ChoiceOptionId;
  nodes: { id: string; label: string; episode: number }[];
  active: boolean;
  chosen: boolean;
}) {
  const locked = chosen && !active;
  return (
    <StoryBranch id={id} active={active}>
      <div className="space-y-2">
        {nodes.map((n) => (
          <div key={n.id} className="relative overflow-hidden rounded-lg border border-border">
            <img
              src={poster}
              alt=""
              loading="lazy"
              className={`h-16 w-full object-cover ${locked ? "grayscale" : ""}`}
            />
            <div className="absolute inset-0 bg-background/55" />
            <span className="absolute inset-0 flex items-center justify-center gap-1 text-[11px] font-semibold text-foreground">
              {locked ? <Lock className="size-3" /> : null}
              {n.label}
            </span>
          </div>
        ))}
      </div>
    </StoryBranch>
  );
}
