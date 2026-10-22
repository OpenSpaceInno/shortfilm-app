import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Sparkles,
  Trophy,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app-shell";
import { CreatorCard } from "@/components/creator-ecosystem";
import {
  creatorChallenges,
  creatorOriginals,
  featuredCreators,
  risingCreators,
} from "@/lib/creators";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/creators")({
  head: () => ({
    meta: [
      { title: "Stories Start With Creators — ShortReel" },
      {
        name: "description",
        content:
          "Discover the storytellers, studios, and interactive series creators behind ShortReel originals.",
      },
      { property: "og:title", content: "Stories Start With Creators — ShortReel" },
      {
        property: "og:description",
        content: "Discover the people creating your next obsession.",
      },
    ],
  }),
  component: CreatorsPage,
});

function CreatorsPage() {
  const { setDevRole } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);
  const [studioName, setStudioName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [genre, setGenre] = useState("Mystery · Thriller");
  const [pitch, setPitch] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim() || !pitch.trim()) {
      toast.error("Please fill in your name and story pitch");
      return;
    }
    // Grant creator dev role and notify
    setDevRole("CREATOR");
    toast.success("Application submitted! Granted instant Creator Studio workspace access.");
    setApplyOpen(false);
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="px-5 pt-7 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs tracking-[0.2em] text-primary uppercase">
            Creator Ecosystem
          </span>
          <Link
            to="/creator/studio"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="size-3.5" /> Studio Workspace
          </Link>
        </div>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground leading-tight">
          Stories Start With Creators
        </h1>
        <p className="mt-1 text-sm text-muted-foreground italic">
          Discover the people creating your next obsession.
        </p>
      </header>

      {/* Creator Studio Promo Banner */}
      <div className="mx-5 mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-primary/10 to-card p-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
              <Wand2 className="size-3" /> AI Story Studio Now Live
            </span>
            <h3 className="font-display text-xl text-foreground tracking-wide mt-1">
              Have an Idea for a Short Series?
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
              Turn a one-line premise into an interactive 8-episode production bible with branching choices.
            </p>
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <Link
            to="/creator/ai-studio"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Sparkles className="size-3.5 fill-current" /> Launch AI Studio
          </Link>
          <button
            onClick={() => setApplyOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            Apply to Create
          </button>
          <Link
            to="/creator/studio"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-medium text-foreground hover:bg-accent/20 transition-colors"
          >
            Open Studio
          </Link>
        </div>
      </div>

      {/* Apply to Creator Program Modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Apply as a Creator</h3>
                <p className="text-xs text-muted-foreground">Join our partner network to produce interactive series</p>
              </div>
              <button
                onClick={() => setApplyOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Filmmaker / Writer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Krishnan"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Studio or Production Name</label>
                <input
                  type="text"
                  placeholder="e.g. Neon Horizon Studios"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Primary Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="Mystery · Thriller">Mystery · Thriller</option>
                  <option value="Romance · Drama">Romance · Drama</option>
                  <option value="Sci-Fi · Cyberpunk">Sci-Fi · Cyberpunk</option>
                  <option value="Horror · Supernatural">Horror · Supernatural</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Show Concept / Logline</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your series premise and key branching choice..."
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Portfolio / Showreel URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://vimeo.com/... or portfolio"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setApplyOpen(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-muted-foreground hover:bg-muted font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-2 font-bold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer"
                >
                  Submit &amp; Open Studio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section 1: FEATURED CREATORS */}
      <section className="mx-5 mt-7 space-y-3.5">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs tracking-widest text-primary uppercase">
              Spotlight
            </span>
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              FEATURED CREATORS
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Top Studios
          </span>
        </div>

        <div className="space-y-3">
          {featuredCreators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      </section>

      {/* Section 2: CREATOR ORIGINALS */}
      <section className="mx-5 mt-8 space-y-3.5">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs tracking-widest text-primary uppercase">
              Catalog
            </span>
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              CREATOR ORIGINALS
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Direct from Studios</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {creatorOriginals.map(({ creator, series }) => (
            <div
              key={series.slug}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-2.5 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="relative aspect-[9/13] w-full overflow-hidden rounded-xl">
                <img
                  src={series.poster}
                  alt={series.title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                    {series.genres[0]}
                  </span>
                  <h4 className="truncate font-display text-base text-foreground leading-tight">
                    {series.title}
                  </h4>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <Link
                  to="/creator/$id"
                  params={{ id: creator.id }}
                  className="truncate text-muted-foreground hover:text-primary transition-colors max-w-[100px]"
                >
                  By {creator.name}
                </Link>
                <Link
                  to="/watch/$slug"
                  params={{ slug: series.slug }}
                  search={{ ep: 1 }}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
                >
                  <Play className="size-3 fill-current" /> Play
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: RISING CREATORS */}
      <section className="mx-5 mt-8 space-y-3.5">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs tracking-widest text-primary uppercase">
              Breakout
            </span>
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              RISING CREATORS
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Fastest Growing</span>
        </div>

        <div className="space-y-3">
          {risingCreators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} compact />
          ))}
        </div>
      </section>

      {/* Section 4: CREATOR CHALLENGES */}
      <section className="mx-5 mt-8 pb-4 space-y-3.5">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs tracking-widest text-primary uppercase">
              Grants
            </span>
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              CREATOR CHALLENGES
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Compete & Produce</span>
        </div>

        <div className="space-y-3">
          {creatorChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
                    <Trophy className="size-3" /> Challenge Open
                  </span>
                  <h3 className="font-display text-xl text-foreground tracking-wide mt-0.5">
                    {challenge.title}
                  </h3>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground shrink-0">
                  Closes in {challenge.closesIn}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                "{challenge.prompt}"
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-xs">
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase block">
                    Prize & Grant
                  </span>
                  <span className="font-semibold text-foreground text-xs">
                    {challenge.prize}
                  </span>
                </div>

                <Link
                  to="/creator/ai-studio"
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  Enter with AI Studio →
                </Link>
              </div>

              <p className="text-[10px] text-muted-foreground/80">
                {challenge.entries} creators have submitted scripts so far.
              </p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
