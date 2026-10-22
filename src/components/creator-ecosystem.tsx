import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { creatorsApi } from "@/lib/api-client";
import {
  AlertCircle,
  ArrowDownToLine,
  Award,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Flame,
  GitBranch,
  Heart,
  Layers,
  Play,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Swords,
  TrendingUp,
  UserCheck,
  Users,
  Video,
  Wallet,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import {
  analyticsHighlights,
  creatorChallenges,
  retention,
  revenue,
  studioAnalytics,
  studioDrafts,
  studioMetrics,
  studioStories,
  studioSubmissions,
  type AiCharacter,
  type AiChoice,
  type AiEpisode,
  type AiStory,
  type Creator,
  type StudioStory,
} from "@/lib/creators";
import { getSeries } from "@/lib/catalog";
import { useCreatorState } from "@/lib/creator-state";

/* ==========================================================================
   1. CREATOR CARD
   Display: Profile image, name, followers, views, popular series, genre,
   language, badge, and working Follow button.
   ========================================================================== */

export function CreatorCard({
  creator,
  compact = false,
}: {
  creator: Creator;
  compact?: boolean;
}) {
  const { isFollowing, toggleFollow, getFollowerCount } = useCreatorState();
  const following = isFollowing(creator.id);
  const followerCount = getFollowerCount(creator);
  const primarySlug = creator.seriesSlugs[0];
  const popularSeries = primarySlug ? getSeries(primarySlug) : null;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border border-border bg-card/85 p-4 transition-all duration-300 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5 ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div>
        {/* Top bar: Avatar + Names + Follow button */}
        <div className="flex items-start justify-between gap-3">
          <Link
            to="/creator/$id"
            params={{ id: creator.id }}
            className="flex items-center gap-3 min-w-0 flex-1 group-hover:opacity-95"
          >
            {/* Avatar with gradient & monogram */}
            <div className="relative shrink-0">
              <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-accent/20 font-display text-lg tracking-wider text-primary border border-primary/30 shadow-inner">
                {creator.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              {creator.featured && (
                <span
                  title="Featured Creator"
                  className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px]"
                >
                  ★
                </span>
              )}
            </div>

            {/* Creator Name & Tagline */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {creator.name}
                </h3>
              </div>
              <p className="truncate text-xs text-muted-foreground mt-0.5">
                {followerCount} followers · {creator.views} views
              </p>
            </div>
          </Link>

          {/* Follow CTA */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFollow(creator.id);
              if (!following) {
                toast.success(`Following ${creator.name}!`, {
                  description: "You'll receive early access notifications for new series.",
                });
              } else {
                toast.info(`Unfollowed ${creator.name}`);
              }
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all active:scale-95 shrink-0 ${
              following
                ? "border border-primary/40 bg-primary/15 text-primary"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            }`}
          >
            {following ? (
              <>
                <Check className="size-3 stroke-[2.5]" /> Following
              </>
            ) : (
              <>
                <Heart className="size-3" /> Follow
              </>
            )}
          </button>
        </div>

        {/* Tagline / Bio snippet */}
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground/90">
          {creator.tagline || creator.bio}
        </p>

        {/* Popular Series if present */}
        {popularSeries && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 p-2 text-xs border border-border/60">
            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
              Hit Series
            </span>
            <Link
              to="/series/$slug"
              params={{ slug: popularSeries.slug }}
              className="truncate font-medium text-foreground hover:underline"
            >
              {popularSeries.title}
            </Link>
          </div>
        )}
      </div>

      {/* Footer metadata: Genre, Language, Badges */}
      <div className="mt-3.5 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-foreground/80">
            {creator.genres.join(" · ")}
          </span>
          <span>•</span>
          <span>{creator.languages.join(", ")}</span>
        </div>

        {creator.badges[0] && (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary text-[10px]">
            <Award className="size-3" />
            {creator.badges[0]}
          </span>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   2. CREATOR PROFILE
   Full creator view with Header, Bio, Stats, Badges, Follow button,
   and 3 Tabs: STORIES, ABOUT, ANALYTICS.
   ========================================================================== */

export function CreatorProfile({ creator }: { creator: Creator }) {
  const [activeTab, setActiveTab] = useState<"stories" | "about" | "analytics">(
    "stories"
  );
  const { isFollowing, toggleFollow, getFollowerCount } = useCreatorState();
  const following = isFollowing(creator.id);
  const followerCount = getFollowerCount(creator);

  const seriesList = creator.seriesSlugs
    .map((slug) => getSeries(slug))
    .filter((s): s is NonNullable<ReturnType<typeof getSeries>> => Boolean(s));

  return (
    <div className="space-y-6">
      {/* Studio Banner & Creator Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card via-card/90 to-background p-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-primary/30 via-primary/15 to-accent/25 font-display text-3xl tracking-wider text-primary border-2 border-primary/30 shadow-xl shrink-0">
              {creator.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-foreground">
                  {creator.name}
                </h1>
                {creator.featured && (
                  <span className="rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                    Studio Partner
                  </span>
                )}
              </div>
              <p className="text-xs text-primary font-medium mt-0.5">
                {creator.tagline}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {followerCount} Followers · {creator.views} Total Views
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                toggleFollow(creator.id);
                if (!following) {
                  toast.success(`Following ${creator.name}`);
                } else {
                  toast.info(`Unfollowed ${creator.name}`);
                }
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition-all active:scale-95 shadow-md ${
                following
                  ? "border border-primary/40 bg-primary/15 text-primary"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {following ? <Check className="size-4" /> : <Heart className="size-4" />}
              {following ? "Following Creator" : "Follow Creator"}
            </button>

            <Link
              to="/creator/studio"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent/20 transition-colors"
            >
              <Sparkles className="size-3.5 text-primary" />
              Creator Studio
            </Link>
          </div>
        </div>

        {/* Bio & Metadata pills */}
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground/90 max-w-2xl">
          {creator.bio}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-border/50 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-muted-foreground">
            <span className="font-semibold text-foreground">Genres:</span>
            <span>{creator.genres.join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1 text-muted-foreground">
            <span className="font-semibold text-foreground">Languages:</span>
            <span>{creator.languages.join(", ")}</span>
          </div>
          {creator.badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-xs font-medium text-primary"
            >
              <Award className="size-3.5" />
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border">
        {(["stories", "about", "analytics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none sm:px-8 py-3 text-center font-display text-lg tracking-wider uppercase transition-colors relative ${
              activeTab === tab
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: STORIES */}
      {activeTab === "stories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl tracking-wide text-foreground">
              Series by {creator.name} ({seriesList.length})
            </h2>
            <span className="text-xs text-muted-foreground">
              Interactive & Vertical OTT Originals
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {seriesList.map((series) => (
              <div
                key={series.slug}
                className="flex gap-4 rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-primary/40"
              >
                <img
                  src={series.poster}
                  alt={series.title}
                  className="size-24 rounded-xl object-cover shrink-0 shadow-md"
                />
                <div className="flex flex-col justify-between min-w-0 flex-1">
                  <div>
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                      {series.genres.join(" · ")}
                    </span>
                    <h3 className="truncate font-semibold text-foreground text-sm mt-0.5">
                      {series.title}
                    </h3>
                    <p className="line-clamp-2 text-xs text-muted-foreground mt-1">
                      {series.tagline}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-[11px] text-muted-foreground">
                      {series.episodeCount} Episodes · {series.views}
                    </span>
                    <Link
                      to="/watch/$slug"
                      params={{ slug: series.slug }}
                      search={{ ep: 1 }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Play className="size-3 fill-current" /> Watch
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: ABOUT */}
      {activeTab === "about" && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-display text-xl tracking-wide text-foreground">
            About the Studio
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {creator.bio}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
            <div className="rounded-xl bg-muted/30 p-3.5 border border-border/50">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Creative Process
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                We design backward from interactive cliffhangers, pairing vertical
                cinematography with dynamic audience branch choices that resolve in under 90 seconds.
              </p>
            </div>
            <div className="rounded-xl bg-muted/30 p-3.5 border border-border/50">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Studio Gear & Production
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Vertical 9:16 anamorphic rigs, practical handheld lighting, and binaural audio
                soundscapes tailored for mobile headphone listening.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: ANALYTICS */}
      {activeTab === "analytics" && (
        <CreatorAnalyticsCard />
      )}
    </div>
  );
}

/* ==========================================================================
   3. CREATOR ANALYTICS CARD
   Shows: Views, Completion, Avg Watch Time, Followers, Votes, Choices,
   Shares, Revenue, Most Popular Character, Most Successful Episode,
   and Audience Retention Curve.
   ========================================================================== */

export function CreatorAnalyticsCard() {
  const [liveAnalytics, setLiveAnalytics] = useState<any | null>(null);
  const [retentionPoints, setRetentionPoints] = useState<any[]>(retention);

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, retRes] = await Promise.all([
          creatorsApi.getAnalytics().catch(() => null),
          creatorsApi.getRetentionAnalytics().catch(() => null),
        ]);

        if (overviewRes?.success && overviewRes.data) {
          setLiveAnalytics(overviewRes.data);
        }
        if (retRes?.success && retRes.data?.dropOffCurve && retRes.data.dropOffCurve.length > 0) {
          const mapped = retRes.data.dropOffCurve.slice(0, 8).map((pt: any, i: number) => ({
            label: `Ep ${i + 1}`,
            value: Math.round(Number(pt.completionRate || pt.retentionPercent || 70)),
          }));
          setRetentionPoints(mapped);
        }
      } catch (err) {
        console.warn("Analytics load error", err);
      }
    }
    loadData();
  }, []);

  const displayMetrics = liveAnalytics?.metrics
    ? [
        { label: "Total Views", value: Number(liveAnalytics.metrics.totalViews || 14200000).toLocaleString() },
        { label: "Unique Viewers", value: Number(liveAnalytics.metrics.uniqueViewers || 3800000).toLocaleString() },
        { label: "Avg Watch Time", value: `${Math.round((liveAnalytics.metrics.avgWatchTimeSeconds || 112) / 60)}m ${Math.round((liveAnalytics.metrics.avgWatchTimeSeconds || 112) % 60)}s` },
        { label: "Completion Rate", value: `${liveAnalytics.metrics.completionRatePercent || 72}%` },
        { label: "Choice Engagement", value: `${liveAnalytics.metrics.choiceEngagementPercent || 88}%` },
        { label: "Shares", value: Number(liveAnalytics.metrics.sharesCount || 42800).toLocaleString() },
        { label: "Binge Factor", value: `${liveAnalytics.metrics.bingeScore || 4.6} Ep/Sess` },
        { label: "Audience Rating", value: `${liveAnalytics.metrics.audienceScore || 98}% Positive` },
      ]
    : studioAnalytics;

  return (
    <div className="space-y-6">
      {/* 8-metric high level grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayMetrics.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card p-3.5"
          >
            <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
            <p className="mt-1 font-display text-2xl text-foreground tracking-wide">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {analyticsHighlights.map((hl) => (
          <div
            key={hl.label}
            className="flex items-start gap-3.5 rounded-2xl border border-primary/25 bg-primary/5 p-4"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
              <Flame className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold text-primary uppercase tracking-widest">
                {hl.label}
              </p>
              <h4 className="font-display text-xl text-foreground tracking-wide mt-0.5">
                {hl.value}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">{hl.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Audience Retention Chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              Audience Retention by Episode (M20)
            </h3>
            <p className="text-xs text-muted-foreground">
              Episode-by-episode viewer drop-off curve from Cloudflare Stream watch progress
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            {liveAnalytics?.metrics?.completionRatePercent || 72}% Avg Completion
          </span>
        </div>

        <div className="grid grid-cols-8 gap-2 items-end h-40 pt-4">
          {retentionPoints.map((ep) => (
            <div key={ep.label} className="flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-semibold text-muted-foreground">
                {ep.value}%
              </span>
              <div className="w-full bg-muted/60 rounded-t-lg relative overflow-hidden h-full flex items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary/80 to-primary transition-all duration-700"
                  style={{ height: `${ep.value}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-foreground">{ep.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. CREATOR STORY CARD
   Used in Studio for My Stories & Drafts with status badge, metrics, and actions.
   ========================================================================== */

export function CreatorStoryCard({
  story,
  onEdit,
}: {
  story: StudioStory;
  onEdit?: () => void;
}) {
  const statusStyles: Record<string, string> = {
    Live: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    Scheduled: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    Draft: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    "Under review": "bg-sky-500/10 border-sky-500/30 text-sky-400",
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground text-base truncate">
            {story.title}
          </h3>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              statusStyles[story.status] || "bg-muted text-muted-foreground"
            }`}
          >
            {story.status}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>{story.episodes} Episodes</span>
          <span>•</span>
          <span>{story.views} Views</span>
          <span>•</span>
          <span>{story.completion > 0 ? `${story.completion}% Completion` : "Unpublished"}</span>
          <span>•</span>
          <span>{story.votes} Votes</span>
          <span>•</span>
          <span>Updated {story.updated}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/creator/ai-studio"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/20 transition-colors"
        >
          <Edit3 className="size-3 text-primary" />
          Edit Arc
        </Link>
        {story.slug && (
          <Link
            to="/series/$slug"
            params={{ slug: story.slug }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Eye className="size-3" />
            Live Preview
          </Link>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   5. AI STORY STEP WORKFLOW
   Shows: 01 STORY CONCEPT, 02 CHARACTERS, 03 STORY ARC, 04 EPISODES,
   05 CLIFFHANGERS, 06 INTERACTIVE CHOICES, 07 PRODUCTION PACK.
   ========================================================================== */

export function AIStoryStep({
  activeStep,
  onSelectStep,
}: {
  activeStep: number;
  onSelectStep: (step: number) => void;
}) {
  const steps = [
    { no: "01", label: "Story Concept" },
    { no: "02", label: "Characters" },
    { no: "03", label: "Story Arc" },
    { no: "04", label: "Episodes" },
    { no: "05", label: "Cliffhangers" },
    { no: "06", label: "Interactive Choices" },
    { no: "07", label: "Production Pack" },
  ];

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center gap-2 min-w-max">
        {steps.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          return (
            <button
              key={step.no}
              onClick={() => onSelectStep(idx)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : isDone
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`font-display text-sm tracking-wider ${
                  isCurrent ? "text-primary-foreground" : isDone ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.no}
              </span>
              <span>{step.label}</span>
              {isDone && <Check className="size-3.5 stroke-[2.5]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   6. AI CHOICE GENERATOR
   Interactive branching simulator with A vs B, consequences,
   and Creator Controls: [ ACCEPT ], [ EDIT ], [ REGENERATE ].
   ========================================================================== */

export function AIChoiceGenerator({
  choice,
  onAccept,
  onEdit,
  onRegenerate,
  accepted = false,
}: {
  choice: AiChoice;
  onAccept?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  accepted?: boolean | undefined;
}) {
  const [selectedBranch, setSelectedBranch] = useState<"A" | "B">("A");
  const [isEditing, setIsEditing] = useState(false);
  const [promptText, setPromptText] = useState(choice.prompt);
  const [optA, setOptA] = useState(choice.optionA);
  const [optB, setOptB] = useState(choice.optionB);
  const [conseqA, setConseqA] = useState(choice.consequenceA);
  const [conseqB, setConseqB] = useState(choice.consequenceB);

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        accepted ? "border-primary/50 bg-primary/5" : "border-border bg-card"
      }`}
    >
      {/* Header with Episode & Creator Controls */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary/20 text-primary">
            <GitBranch className="size-4" />
          </span>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Episode {choice.episode} · Interactive Decision Node
          </span>
          {accepted && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
              <Check className="size-3" /> Accepted
            </span>
          )}
        </div>

        {/* Creator Controls: [ ACCEPT ] [ EDIT ] [ REGENERATE ] */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (onAccept) onAccept();
              toast.success("Choice branch accepted for production bible!");
            }}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              accepted
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-muted/40 text-foreground hover:border-primary/50"
            }`}
          >
            <Check className="size-3" /> Accept
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary/50 transition-colors"
          >
            <Edit3 className="size-3" /> {isEditing ? "Done" : "Edit"}
          </button>
          <button
            onClick={() => {
              if (onRegenerate) onRegenerate();
              toast.info("Regenerating decision branching options...");
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
          >
            <RefreshCw className="size-3" /> Regenerate
          </button>
        </div>
      </div>

      {/* Editing Mode */}
      {isEditing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Prompt Question</label>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border bg-muted/20">
              <label className="text-xs font-semibold text-primary">Option A</label>
              <input
                type="text"
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
              />
              <label className="text-[11px] text-muted-foreground mt-2 block">Consequence A</label>
              <textarea
                value={conseqA}
                onChange={(e) => setConseqA(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/20">
              <label className="text-xs font-semibold text-primary">Option B</label>
              <input
                type="text"
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
              />
              <label className="text-[11px] text-muted-foreground mt-2 block">Consequence B</label>
              <textarea
                value={conseqB}
                onChange={(e) => setConseqB(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Branch Visualizer */
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-display text-xl tracking-wide text-foreground">
              {promptText}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click either branch to test the narrative consequence and projected audience choice split.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Branch A */}
            <button
              onClick={() => setSelectedBranch("A")}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedBranch === "A"
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card/60 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-primary tracking-wide">
                  Option A
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  64% Projected
                </span>
              </div>
              <p className="mt-1 font-semibold text-sm text-foreground">{optA}</p>
              <div className="mt-3 pt-2.5 border-t border-border/50">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Consequence
                </span>
                <p className="text-xs text-muted-foreground/90 mt-0.5">{conseqA}</p>
              </div>
            </button>

            {/* Branch B */}
            <button
              onClick={() => setSelectedBranch("B")}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedBranch === "B"
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card/60 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-primary tracking-wide">
                  Option B
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  36% Projected
                </span>
              </div>
              <p className="mt-1 font-semibold text-sm text-foreground">{optB}</p>
              <div className="mt-3 pt-2.5 border-t border-border/50">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Consequence
                </span>
                <p className="text-xs text-muted-foreground/90 mt-0.5">{conseqB}</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   7. AI STORY OUTPUT
   Render all 7 generated sections with inline controls:
   [ ACCEPT ], [ EDIT ], [ REGENERATE ].
   ========================================================================== */

export function AIStoryOutput({ story }: { story: AiStory }) {
  const {
    acceptedSections,
    toggleAcceptSection,
    regenerateSection,
    submitStoryToEditorial,
    updateStorySection,
  } = useCreatorState();

  const [isEditingConcept, setIsEditingConcept] = useState(false);
  const [editedTitle, setEditedTitle] = useState(story.title);
  const [editedLogline, setEditedLogline] = useState(story.logline);
  const [submitted, setSubmitted] = useState(false);

  const handleSaveConcept = () => {
    updateStorySection("title", editedTitle);
    updateStorySection("logline", editedLogline);
    setIsEditingConcept(false);
    toast.success("Story Concept updated!");
  };

  const handleSubmit = () => {
    submitStoryToEditorial({
      title: story.title,
      genre: story.genre,
      episodes: story.episodes,
      logline: story.logline,
    });
    setSubmitted(true);
    toast.success("Story submitted to ShortReel editorial!", {
      description: "Our writers' board will review your branching bible within 5–7 days.",
    });
  };

  return (
    <div className="space-y-6">
      {/* 01 STORY CONCEPT */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-primary tracking-wider">01</span>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              STORY CONCEPT
            </h3>
            {acceptedSections["concept"] && (
              <span className="rounded-md bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                ✓ Accepted
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                toggleAcceptSection("concept");
                toast.success(acceptedSections["concept"] ? "Section marked for revision" : "Concept accepted!");
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                acceptedSections["concept"]
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/40 text-foreground"
              }`}
            >
              [ ACCEPT ]
            </button>
            <button
              onClick={() => setIsEditingConcept(!isEditingConcept)}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary/50"
            >
              [ EDIT ]
            </button>
            <button
              onClick={() => {
                regenerateSection("concept");
                toast.info("Regenerating premise and logline variations...");
              }}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              [ REGENERATE ]
            </button>
          </div>
        </div>

        {isEditingConcept ? (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Title</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Logline</label>
              <textarea
                value={editedLogline}
                onChange={(e) => setEditedLogline(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <button
              onClick={handleSaveConcept}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap text-xs text-primary font-medium">
              <span>{story.genre}</span>
              <span>•</span>
              <span>{story.language}</span>
              <span>•</span>
              <span>{story.episodes} Episodes</span>
              <span>•</span>
              <span>{story.format}</span>
            </div>
            <h2 className="font-display text-3xl tracking-wide text-foreground">
              {story.title}
            </h2>
            <div className="rounded-xl bg-muted/30 p-3.5 border border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                LOGLINE
              </span>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                {story.logline}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 02 CHARACTERS */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-primary tracking-wider">02</span>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              CHARACTERS ({story.characters.length})
            </h3>
            {acceptedSections["characters"] && (
              <span className="rounded-md bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                ✓ Accepted
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                toggleAcceptSection("characters");
                toast.success(acceptedSections["characters"] ? "Characters unverified" : "Cast profiles accepted!");
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                acceptedSections["characters"]
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/40 text-foreground"
              }`}
            >
              [ ACCEPT ]
            </button>
            <button
              onClick={() => toast.info("Opening Character Bible Editor...")}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary/50"
            >
              [ EDIT ]
            </button>
            <button
              onClick={() => {
                regenerateSection("characters");
                toast.info("Regenerating character roster...");
              }}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              [ REGENERATE ]
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {story.characters.map((char) => (
            <div
              key={char.name}
              className="rounded-xl border border-border/70 bg-card/70 p-3.5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{char.name}</h4>
                  <p className="text-xs text-primary font-medium">{char.role}</p>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {char.age}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {char.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 03 STORY ARC */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-primary tracking-wider">03</span>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              STORY ARC
            </h3>
            {acceptedSections["arc"] && (
              <span className="rounded-md bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                ✓ Accepted
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleAcceptSection("arc")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                acceptedSections["arc"]
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/40 text-foreground"
              }`}
            >
              [ ACCEPT ]
            </button>
            <button
              onClick={() => toast.info("Opening Act Structure Editor...")}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary/50"
            >
              [ EDIT ]
            </button>
            <button
              onClick={() => {
                regenerateSection("arc");
                toast.info("Regenerating 3-Act structural turns...");
              }}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              [ REGENERATE ]
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {story.arc.map((act, index) => (
            <div
              key={act.label}
              className="rounded-xl border border-border/60 bg-muted/20 p-3.5 flex items-start gap-3"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-primary/15 font-display text-sm text-primary shrink-0">
                {index + 1}
              </span>
              <div>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {act.label}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {act.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 04 EPISODES & 05 CLIFFHANGERS */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-primary tracking-wider">04 & 05</span>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              EPISODES & CLIFFHANGERS
            </h3>
            {acceptedSections["episodes"] && (
              <span className="rounded-md bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                ✓ Accepted
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleAcceptSection("episodes")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                acceptedSections["episodes"]
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/40 text-foreground"
              }`}
            >
              [ ACCEPT ]
            </button>
            <button
              onClick={() => toast.info("Opening Episode Outline Tool...")}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary/50"
            >
              [ EDIT ]
            </button>
            <button
              onClick={() => {
                regenerateSection("episodes");
                toast.info("Regenerating episode hooks & cliffhangers...");
              }}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              [ REGENERATE ]
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {story.episodeList.map((ep) => (
            <div
              key={ep.number}
              className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base text-primary">
                    EPISODE {ep.number}
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {ep.title}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  ~{ep.duration} · Cast: {ep.characters.join(", ")}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">{ep.synopsis}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-card p-2.5 border border-border/50">
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                    Opening Hook
                  </span>
                  <p className="mt-0.5 text-muted-foreground">{ep.hook}</p>
                </div>
                <div className="rounded-lg bg-card p-2.5 border border-primary/30">
                  <span className="text-[10px] font-semibold text-destructive uppercase tracking-wide">
                    Cliffhanger Cut
                  </span>
                  <p className="mt-0.5 text-foreground/90 font-medium">{ep.cliffhanger}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 06 INTERACTIVE CHOICES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-primary tracking-wider">06</span>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              INTERACTIVE CHOICES ({story.choices.length})
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Dynamic Narrative Branching Nodes
          </span>
        </div>

        {story.choices.map((c, i) => (
          <AIChoiceGenerator
            key={i}
            choice={c}
            accepted={acceptedSections[`choice-${i}`]}
            onAccept={() => toggleAcceptSection(`choice-${i}`)}
            onRegenerate={() => regenerateSection("choices")}
          />
        ))}
      </section>

      {/* 07 PRODUCTION PACK */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-primary tracking-wider">07</span>
            <h3 className="font-display text-xl tracking-wide text-foreground">
              PRODUCTION PACK ({story.productionPack.length} Deliverables)
            </h3>
            {acceptedSections["pack"] && (
              <span className="rounded-md bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                ✓ Accepted
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleAcceptSection("pack")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                acceptedSections["pack"]
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/40 text-foreground"
              }`}
            >
              [ ACCEPT ]
            </button>
            <button
              onClick={() => toast.success("Exporting full production ZIP bundle...")}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground hover:border-primary/50"
            >
              Export
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Ready-to-shoot pack for vertical 9:16 cameras, screen inserts, and interactive node scripts.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {story.productionPack.map((pack) => (
            <div
              key={pack.title}
              className="rounded-xl border border-border/70 bg-card/60 p-3.5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wide">
                  {pack.title}
                </h4>
                <FileText className="size-3.5 text-primary" />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {pack.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL SUBMISSION CTA */}
      <div className="rounded-3xl border border-primary/40 bg-gradient-to-r from-card via-primary/10 to-card p-6 text-center shadow-xl">
        {submitted ? (
          <StorySubmissionCard
            storyTitle={story.title}
            status="Under review"
            note="Our editorial team will review your story."
          />
        ) : (
          <div className="max-w-md mx-auto space-y-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary/20 text-primary mx-auto">
              <Send className="size-6" />
            </span>
            <h3 className="font-display text-2xl tracking-wide text-foreground">
              Ready to Pitch Your Interactive Series?
            </h3>
            <p className="text-xs text-muted-foreground">
              Submit your Story Bible, Character Roster, and Choice Branching Map to the
              ShortReel Editorial Board for official co-production grants.
            </p>
            <button
              onClick={handleSubmit}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg active:scale-95"
            >
              <Send className="size-4" />
              SUBMIT TO SHORTREEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   8. STORY SUBMISSION CARD
   Confirmation state with Status: UNDER REVIEW and Editorial guidelines.
   ========================================================================== */

export function StorySubmissionCard({
  storyTitle,
  status = "Under review",
  note = "Our editorial team will review your story.",
}: {
  storyTitle: string;
  status?: "Under review" | "Approved" | "Changes requested";
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-5 text-left space-y-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 px-3 py-1 text-xs font-semibold text-sky-400">
          <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
          STATUS: {status.toUpperCase()}
        </span>
        <span className="text-xs text-muted-foreground">Submitted Today</span>
      </div>

      <div>
        <h4 className="font-display text-2xl text-foreground tracking-wide">
          STORY SUBMITTED
        </h4>
        <p className="text-sm font-semibold text-primary mt-0.5">{storyTitle}</p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{note}</p>
      </div>

      <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground space-y-1.5 border border-border/60">
        <p className="font-semibold text-foreground">Next Review Milestones:</p>
        <p>• Day 1–2: Logline & Vertical Pacing Validation</p>
        <p>• Day 3–4: Interactive Decision Tree & Continuity Audit</p>
        <p>• Day 5: Production Grant & Creator Revenue Share Terms</p>
      </div>

      <Link
        to="/creator/studio"
        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        View Submissions in Creator Studio →
      </Link>
    </div>
  );
}

/* ==========================================================================
   9. REVENUE CARD & SETTLEMENT LEDGER (P9.4)
   Full Monthly Earnings Ledger & Catalog Analytics with:
   - Live summary metrics (totalGross, totalNet, totalPaid, pendingPayout, heldAmount)
   - Monthly Settlement Ledger Table with state machine badges (PAID, PENDING_PAYOUT, CALCULATED, HELD)
   - Engagement pool breakdown (VIP watch-time pool, choice bonus, etc.)
   - Tax invoice action & direct payout bank info
   ========================================================================== */

export function RevenueCard() {
  const [summary, setSummary] = useState<any | null>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    let mounted = true;
    async function loadEarnings() {
      try {
        setLoading(true);
        const [sumRes, earnRes] = await Promise.all([
          creatorsApi.getEarningsSummary().catch(() => null),
          creatorsApi.getEarnings().catch(() => null),
        ]);

        if (!mounted) return;
        if (sumRes?.success && sumRes.data) {
          setSummary(sumRes.data);
        }
        if (earnRes?.success && earnRes.data) {
          const items = Array.isArray(earnRes.data)
            ? earnRes.data
            : earnRes.data.items || [];
          setEarnings(items);
        }
      } catch (err) {
        console.warn("Failed to load creator earnings", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadEarnings();
    return () => {
      mounted = false;
    };
  }, []);

  const fallbackSummary = {
    totalGross: "124500.00",
    totalNet: "74700.00",
    totalPaid: "52200.00",
    pendingPayout: "22500.00",
    heldAmount: "0.00",
    currency: "INR",
    lifetimePayoutsCount: 6,
    lastSettlementMonth: "2026-09-01",
  };

  const displaySummary = summary || fallbackSummary;

  const fallbackEarnings = [
    {
      id: "earn_sep_2026",
      periodMonth: "2026-09-01",
      grossAmount: "37500.00",
      platformFee: "11250.00",
      taxWithheld: "2625.00",
      netPayout: "23625.00",
      currency: "INR",
      status: "PENDING_PAYOUT",
      payoutReference: null,
      paidAt: null,
      holdReason: null,
    },
    {
      id: "earn_aug_2026",
      periodMonth: "2026-08-01",
      grossAmount: "34200.00",
      platformFee: "10260.00",
      taxWithheld: "2394.00",
      netPayout: "21546.00",
      currency: "INR",
      status: "PAID",
      payoutReference: "payout_rzp_8891024",
      paidAt: "2026-09-05T08:30:00Z",
      holdReason: null,
    },
    {
      id: "earn_jul_2026",
      periodMonth: "2026-07-01",
      grossAmount: "28900.00",
      platformFee: "8670.00",
      taxWithheld: "2023.00",
      netPayout: "18207.00",
      currency: "INR",
      status: "PAID",
      payoutReference: "payout_rzp_7761099",
      paidAt: "2026-08-05T11:15:00Z",
      holdReason: null,
    },
    {
      id: "earn_jun_2026",
      periodMonth: "2026-06-01",
      grossAmount: "23900.00",
      platformFee: "7170.00",
      taxWithheld: "1673.00",
      netPayout: "15057.00",
      currency: "INR",
      status: "PAID",
      payoutReference: "payout_rzp_6612085",
      paidAt: "2026-07-05T09:40:00Z",
      holdReason: null,
    },
  ];

  const displayItems = earnings.length > 0 ? earnings : fallbackEarnings;
  const filteredItems =
    statusFilter === "ALL"
      ? displayItems
      : displayItems.filter((item: any) => item.status === statusFilter);

  const formatCurrency = (val: string | number | undefined) => {
    if (val === undefined || val === null) return "₹0";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatMonth = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const handleDownloadInvoice = (item: any) => {
    toast.success(`Tax Invoice downloaded for ${formatMonth(item.periodMonth)}`, {
      description: `Settlement Ref: ${item.payoutReference || item.id} (TDS 194C)`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Refresh & Account status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary">
              <Wallet className="size-5" />
            </span>
            <h3 className="font-display text-2xl tracking-wide text-foreground">
              Creator Earnings & Settlement Ledger (M19)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Automated monthly revenue share calculated from VIP watch-time retention & choice interactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
            KYC Verified · HDFC Bank ••••4921
          </span>
        </div>
      </div>

      {/* 2. Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Total Gross Earnings</p>
          <p className="font-display text-2xl text-foreground tracking-wide mt-1">
            {formatCurrency(displaySummary.totalGross)}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">100% Platform Pool Value</span>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-xs text-primary font-semibold">Total Net Creator Share</p>
          <p className="font-display text-2xl text-primary tracking-wide mt-1">
            {formatCurrency(displaySummary.totalNet)}
          </p>
          <span className="text-[10px] text-primary/80 mt-0.5 block">60% Revenue Share Pool</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-400 font-semibold">Total Paid to Bank</p>
          <p className="font-display text-2xl text-foreground tracking-wide mt-1">
            {formatCurrency(displaySummary.totalPaid)}
          </p>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
            {displaySummary.lifetimePayoutsCount} Completed Transfers
          </span>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-400 font-semibold">Pending Settlement</p>
          <p className="font-display text-2xl text-foreground tracking-wide mt-1">
            {formatCurrency(displaySummary.pendingPayout)}
          </p>
          <span className="text-[10px] text-amber-400/80 mt-0.5 block">Payout on 1st of month</span>
        </div>
      </div>

      {/* 3. Monthly Settlement Ledger Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-border/60">
          <div>
            <h4 className="font-display text-xl text-foreground tracking-wide">
              Monthly Settlement History
            </h4>
            <p className="text-xs text-muted-foreground">
              Official tax invoice records, withholding details, and payout tracking
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "PAID", "PENDING_PAYOUT", "CALCULATED", "HELD"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/50"
                }`}
              >
                {status === "ALL" ? "All" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Period</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Gross Pool</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Platform Fee (30%)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">TDS (10%)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Net Payout</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {formatMonth(item.periodMonth)}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {formatCurrency(item.grossAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {formatCurrency(item.platformFee)}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {formatCurrency(item.taxWithheld)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-primary text-sm">
                    {formatCurrency(item.netPayout)}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.status === "PAID" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <Check className="size-3" /> Paid
                      </span>
                    )}
                    {item.status === "PENDING_PAYOUT" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        <Clock className="size-3" /> Pending
                      </span>
                    )}
                    {item.status === "CALCULATED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                        <RefreshCw className="size-3" /> Calculated
                      </span>
                    )}
                    {item.status === "HELD" && (
                      <span
                        title={item.holdReason || "Payout held"}
                        className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400"
                      >
                        <AlertCircle className="size-3" /> Held
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary/50 transition-colors"
                    >
                      <ArrowDownToLine className="size-3 text-primary" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Earnings Breakdown by Engagement Pool */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Revenue Allocation Pools (60% Creator Royalty Share)
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dynamic distribution weights based on verified watch sessions and interactive player actions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {revenue.breakdown.map((item) => (
            <div
              key={item.label}
              className="flex flex-col justify-between rounded-xl bg-muted/30 p-3.5 border border-border/50"
            >
              <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
              <p className="font-display text-xl text-primary tracking-wide mt-2">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Payout Footer & Banking terms */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary shrink-0" />
          <span>
            Next automatic disbursement: <strong>Nov 1, 2026</strong> (Threshold ₹1,000 satisfied)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>TDS Certificate: <strong>Form 16A Q2 Ready</strong></span>
          <button
            onClick={() => toast.success("Opening banking settings modal")}
            className="text-primary font-semibold hover:underline"
          >
            Manage Bank Details →
          </button>
        </div>
      </div>
    </div>
  );
}
