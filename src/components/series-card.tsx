import { Link } from "@tanstack/react-router";
import { Crown, Play } from "lucide-react";
import type { Series } from "@/lib/catalog";

export function PosterCard({
  item,
  className = "",
}: {
  item: Series;
  className?: string;
}) {
  return (
    <Link
      to="/series/$slug"
      params={{ slug: item.slug }}
      className={`group block shrink-0 ${className}`}
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
        <img
          src={item.poster}
          alt={`${item.title} poster`}
          loading="lazy"
          width={576}
          height={1024}
          className="aspect-[9/16] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        {item.premium ? (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Crown className="size-3" /> VIP
          </span>
        ) : (
          <span className="absolute top-2 right-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
            FREE
          </span>
        )}
        <div className="absolute bottom-0 w-full p-2.5">
          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {item.episodeCount} eps · {item.views} views
          </p>
        </div>
      </div>
    </Link>
  );
}

export function ContinueCard({
  item,
  episodeNumber,
  progress,
}: {
  item: Series;
  episodeNumber: number;
  progress: number;
}) {
  return (
    <Link
      to="/watch/$slug"
      params={{ slug: item.slug }}
      search={{ ep: episodeNumber }}
      className="relative w-40 shrink-0 overflow-hidden rounded-xl border border-border"
    >
      <img
        src={item.poster}
        alt={`${item.title} episode ${episodeNumber}`}
        loading="lazy"
        width={576}
        height={1024}
        className="aspect-[3/4] w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-full bg-primary/90 p-2 text-primary-foreground">
          <Play className="size-4 fill-current" />
        </span>
      </span>
      <div className="absolute bottom-0 w-full p-2.5">
        <p className="truncate text-xs font-semibold text-foreground">{item.title}</p>
        <p className="text-[11px] text-muted-foreground">EP {episodeNumber}</p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export function Row({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="flex items-baseline justify-between px-5">
        <h2 className="font-display text-xl tracking-wide text-foreground">{title}</h2>
        {action ? <span className="text-xs text-primary">{action}</span> : null}
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
