import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  FileCheck,
  FileEdit,
  Flame,
  FolderOpen,
  GitBranch,
  Layers,
  LineChart,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Tv,
  Upload,
  Users,
  Video,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import {
  CreatorAnalyticsCard,
  CreatorStoryCard,
  RevenueCard,
  StorySubmissionCard,
} from "@/components/creator-ecosystem";
import { VideoDirectUploader } from "@/components/video-direct-uploader";
import { creationSteps, studioMetrics } from "@/lib/creators";
import { useCreatorState } from "@/lib/creator-state";

export const Route = createFileRoute("/creator/studio")({
  head: () => ({
    meta: [
      { title: "Creator Studio — ShortReel Workspace" },
      {
        name: "description",
        content:
          "Manage your interactive short series, track real-time analytics, monitor revenue, and craft new branching stories.",
      },
    ],
  }),
  component: CreatorStudioPage,
});

type StudioTab =
  | "stories"
  | "drafts"
  | "submissions"
  | "analytics"
  | "earnings"
  | "ai-studio";

function CreatorStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("stories");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeEpisodeUpload, setActiveEpisodeUpload] = useState({
    id: "ep_pilot_01",
    title: "Episode 1: The Pilot",
  });
  const { stories, drafts, submissions, dashboardData, submitStoryToEditorial } = useCreatorState();

  const metricsToDisplay = dashboardData?.metrics
    ? [
        {
          label: "Total Views",
          value: dashboardData.metrics.totalViews > 0
            ? `${dashboardData.metrics.totalViews.toLocaleString()}`
            : "14.2M",
          delta: "+18%",
        },
        {
          label: "Active Stories",
          value: String(dashboardData.metrics.totalStories || stories.length),
          delta: "+2",
        },
        {
          label: "Published",
          value: String(dashboardData.metrics.publishedStories || 3),
          delta: "100%",
        },
        {
          label: "In Review",
          value: String(dashboardData.metrics.inReviewSubmissions || submissions.length),
          delta: "Live",
        },
        {
          label: "Followers",
          value: dashboardData.metrics.followersCount > 0
            ? `${dashboardData.metrics.followersCount.toLocaleString()}`
            : "1.24M",
          delta: "+4.2%",
        },
      ]
    : studioMetrics;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Studio Pro Workspace Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Watch OTT
            </Link>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl tracking-wide text-foreground">
                  Creator Studio
                </span>
                <span className="rounded-md bg-primary/10 border border-primary/25 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                  Pro Workspace
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Ananya Studios · Verified Partner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveEpisodeUpload({
                  id: "ep_custom_master",
                  title: "Direct Master Cut",
                });
                setIsUploadOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-primary/10 transition-colors active:scale-95 shadow-sm"
            >
              <Upload className="size-3.5 text-primary" />
              <span>UPLOAD VIDEO (TUS)</span>
            </button>

            <Link
              to="/creator/ai-studio"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:opacity-95 transition-all active:scale-95"
            >
              <Plus className="size-3.5 stroke-[3]" />
              <span className="font-bold">CREATE NEW STORY</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Story Creation Visual Workflow Banner */}
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-card via-primary/5 to-card p-5 sm:p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
                <Wand2 className="size-3" /> 7-Step Interactive Pipeline
              </span>
              <h2 className="font-display text-2xl text-foreground tracking-wide mt-1">
                Story Creation Workflow
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                Build branch-ready vertical narratives powered by the ShortReel AI Story Engine.
              </p>
            </div>

            <Link
              to="/creator/ai-studio"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Sparkles className="size-3.5 fill-current" />
              CREATE NEW STORY
            </Link>
          </div>

          {/* 7 Workflow Steps Horizontal Visualizer */}
          <div className="mt-5 pt-4 border-t border-border/60 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {creationSteps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border/70 px-3 py-2 text-xs">
                    <span className="grid size-5 place-items-center rounded-full bg-primary/20 font-display text-xs text-primary font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-xs">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.hint}</p>
                    </div>
                  </div>
                  {idx < creationSteps.length - 1 && (
                    <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5 Headline Metrics Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {metricsToDisplay.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-border bg-card p-3.5 transition-all hover:border-primary/40"
            >
              <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
              <p className="font-display text-2xl text-foreground tracking-wide mt-0.5">
                {metric.value}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mt-1">
                <TrendingUp className="size-3" />
                {metric.delta} this month
              </span>
            </div>
          ))}
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-border overflow-x-auto">
          <div className="flex items-center min-w-max">
            {(
              [
                { id: "stories", label: `My Stories (${stories.length})`, icon: Video },
                { id: "drafts", label: `Drafts (${drafts.length})`, icon: FileEdit },
                { id: "submissions", label: `Submissions (${submissions.length})`, icon: FileCheck },
                { id: "analytics", label: "Analytics", icon: LineChart },
                { id: "earnings", label: "Earnings", icon: Coins },
                { id: "ai-studio", label: "AI Story Studio", icon: Sparkles },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors relative ${
                  activeTab === id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{label}</span>
                {activeTab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: MY STORIES */}
        {activeTab === "stories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl tracking-wide text-foreground">
                  Published & Scheduled Series
                </h3>
                <p className="text-xs text-muted-foreground">
                  Active series streaming to consumer vertical OTT feeds
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveEpisodeUpload({ id: "ep_series_pilot", title: "New Episode Master Cut" });
                  setIsUploadOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Upload className="size-3.5" /> + Upload Episode Stream
              </button>
            </div>

            <div className="space-y-3">
              {stories.map((story) => (
                <div key={story.id} className="relative group">
                  <CreatorStoryCard story={story} />
                  <div className="mt-2 flex items-center justify-end gap-2 pr-2">
                    <button
                      onClick={() => {
                        setActiveEpisodeUpload({ id: `ep_${story.id}_next`, title: `${story.title} - Next Episode` });
                        setIsUploadOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Upload className="size-3" /> Upload Episode (TUS)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: DRAFTS */}
        {activeTab === "drafts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl tracking-wide text-foreground">
                  Work In Progress Drafts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Unfinished scripts and interactive branch nodes
                </p>
              </div>
              <Link
                to="/creator/ai-studio"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Sparkles className="size-3.5" /> Start With AI
              </Link>
            </div>

            <div className="space-y-3">
              {drafts.map((draft) => (
                <div key={draft.id} className="relative group border border-border/80 rounded-2xl p-1 bg-card/60">
                  <CreatorStoryCard story={draft} />
                  <div className="p-3 bg-muted/20 border-t border-border/60 rounded-b-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="text-muted-foreground text-[11px]">
                      Story Lifecycle: <span className="font-semibold text-amber-400">DRAFT</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveEpisodeUpload({ id: `ep_${draft.id}`, title: `${draft.title} - Scene 1` });
                          setIsUploadOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Upload className="size-3" /> Upload Video (TUS)
                      </button>
                      <button
                        onClick={async () => {
                          await submitStoryToEditorial({
                            title: draft.title,
                            genre: "Interactive Series",
                            episodes: draft.episodes,
                            logline: "Submitted from creator studio draft workspace.",
                          });
                          toast.success(`Submitted "${draft.title}" into editorial review pipeline!`);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <Send className="size-3" /> Submit for Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: SUBMISSIONS */}
        {activeTab === "submissions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl tracking-wide text-foreground">
                  Editorial Review Queue
                </h3>
                <p className="text-xs text-muted-foreground">
                  Scripts currently under evaluation by the ShortReel curation board
                </p>
              </div>
              <span className="rounded-full bg-sky-500/10 border border-sky-500/30 px-3 py-1 text-xs font-semibold text-sky-400">
                {submissions.filter((s) => s.status === "Under review").length} Under Review
              </span>
            </div>

            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground text-sm">{sub.title}</h4>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          sub.status === "Under review"
                            ? "bg-sky-500/15 border border-sky-500/30 text-sky-400"
                            : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Submitted {sub.submitted}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {sub.note}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <span className="text-muted-foreground">
                      Format: Vertical 9:16 Interactive Short Series
                    </span>
                    <Link
                      to="/creator/ai-studio"
                      className="text-primary font-semibold hover:underline"
                    >
                      Open in AI Studio →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-xl tracking-wide text-foreground">
                Audience Intelligence & Engagement
              </h3>
              <p className="text-xs text-muted-foreground">
                Track how viewers branch, vote, and stay hooked across episodes
              </p>
            </div>
            <CreatorAnalyticsCard />
          </div>
        )}

        {/* Tab 5: EARNINGS */}
        {activeTab === "earnings" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-xl tracking-wide text-foreground">
                Revenue & Monetization Pools
              </h3>
              <p className="text-xs text-muted-foreground">
                Direct revenue share from subscriber minutes and interactive battle votes
              </p>
            </div>
            <RevenueCard />
          </div>
        )}

        {/* Tab 6: AI STORY STUDIO HIGHLIGHT */}
        {activeTab === "ai-studio" && (
          <div className="rounded-3xl border border-primary/30 bg-card p-6 space-y-5 text-center">
            <div className="grid size-16 place-items-center rounded-3xl bg-primary/15 text-primary mx-auto">
              <Bot className="size-8" />
            </div>

            <div className="max-w-md mx-auto">
              <h3 className="font-display text-3xl tracking-wide text-foreground">
                AI Story Studio
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generate high-concept loglines, 3-act story arcs, character casts, episode
                cliffhangers, and interactive choice maps with human creator controls.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <Link
                to="/creator/ai-studio"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                <Sparkles className="size-4 fill-current" />
                Launch AI Story Studio
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Direct TUS Video Upload Modal (Cloudflare Stream P9.2) */}
      <VideoDirectUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultEpisodeId={activeEpisodeUpload.id}
        defaultEpisodeTitle={activeEpisodeUpload.title}
        onUploadComplete={(res) => {
          toast.success("Stream direct upload verified!", {
            description: `Video asset registered with provider UID: ${res.providerUid}`,
          });
        }}
      />
    </div>
  );
}
