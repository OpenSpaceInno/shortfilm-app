import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bot,
  Brain,
  Check,
  ChevronRight,
  Edit3,
  Flame,
  GitBranch,
  Layers,
  Lightbulb,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { AIStoryOutput, AIStoryStep } from "@/components/creator-ecosystem";
import { AiStudioTools } from "@/components/ai-studio-tools";
import { useCreatorState } from "@/lib/creator-state";

export const Route = createFileRoute("/creator/ai-studio")({
  head: () => ({
    meta: [
      { title: "AI Story Studio — ShortReel" },
      {
        name: "description",
        content:
          "Turn an idea into an interactive vertical short series with AI-generated story concepts, characters, episodes, and choice branches.",
      },
      { property: "og:title", content: "AI Story Studio — ShortReel" },
      {
        property: "og:description",
        content: "Turn an idea into an interactive short series.",
      },
    ],
  }),
  component: AIStoryStudioPage,
});

const presetIdeas = [
  {
    title: "Messages From Tomorrow",
    genre: "Mystery · Romance",
    lang: "Hindi",
    idea: "A young woman begins receiving voice notes from her future self warning her about decisions she hasn't yet made.",
  },
  {
    title: "Neon Karma 2099",
    genre: "Cyberpunk · Thriller",
    lang: "Hinglish",
    idea: "In a vertical neon-lit Mumbai sky-corridor, an ethical memory hacker is hired to delete a crime she hasn't committed yet.",
  },
  {
    title: "Monsoon Room 302",
    genre: "Romance · Drama",
    lang: "Telugu",
    idea: "Two estranged ex-fiancés are stranded in a flooded coastal guest room during an overnight thunderstorm.",
  },
  {
    title: "The Ghost in the Metro",
    genre: "Supernatural · Suspense",
    lang: "Tamil",
    idea: "At 1:17 AM on the final train car, passengers receive a text asking them to vote on who gets off at the phantom platform.",
  },
];

function AIStoryStudioPage() {
  const {
    aiStory,
    currentStep,
    setCurrentStep,
    isGenerating,
    activePrompt,
    setActivePrompt,
    selectedGenre,
    setSelectedGenre,
    selectedLanguage,
    setSelectedLanguage,
    episodesTarget,
    setEpisodesTarget,
    generateStoryWithAi,
  } = useCreatorState();

  const handleGenerate = async () => {
    if (!activePrompt.trim()) {
      toast.error("Please enter a story idea or pick a preset prompt.");
      return;
    }
    toast.info("Synthesizing interactive narrative universe...", {
      description: "Generating story concept, characters, arc, episodes & branching choices.",
    });
    await generateStoryWithAi(activePrompt);
    toast.success("AI interactive series generated successfully!");
  };

  const handlePickPreset = (preset: (typeof presetIdeas)[0]) => {
    setActivePrompt(preset.idea);
    setSelectedGenre(preset.genre);
    setSelectedLanguage(preset.lang);
    toast.info(`Preset selected: ${preset.title}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Studio Header Bar */}
      <header className="border-b border-border bg-card/75 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/creator/studio"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Studio Workspace
            </Link>

            <div className="h-4 w-px bg-border hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl tracking-wide text-foreground">
                  AI Story Studio
                </span>
                <span className="rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                  Co-Pilot v3.2
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground italic hidden sm:block">
                Turn an idea into an interactive short series.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/creators"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Explore Creators
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Main Title & Subtitle */}
        <section className="space-y-1">
          <h1 className="font-display text-4xl sm:text-5xl tracking-wide text-foreground leading-tight">
            AI Story Studio
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground italic font-sans">
            &gt; Turn an idea into an interactive short series.
          </p>
        </section>

        {/* Story Idea Generation Prompt Box */}
        <section className="rounded-3xl border border-primary/30 bg-gradient-to-b from-card via-card/90 to-background p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="font-display text-lg tracking-wide text-primary uppercase flex items-center gap-2">
              <Sparkles className="size-4" />
              WHAT'S YOUR STORY IDEA?
            </label>
            <span className="text-xs text-muted-foreground">
              Supports vertical mobile framing &amp; dynamic choice branching
            </span>
          </div>

          <div className="relative">
            <textarea
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
              placeholder="&gt; A young woman receives messages from her future self..."
              rows={3}
              className="w-full rounded-2xl border border-border bg-background/80 p-4 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all leading-relaxed"
            />
          </div>

          {/* Preset Inspiration Chips */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Lightbulb className="size-3.5 text-primary" /> Inspiration Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetIdeas.map((preset) => (
                <button
                  key={preset.title}
                  onClick={() => handlePickPreset(preset)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all text-left border ${
                    activePrompt === preset.idea
                      ? "border-primary bg-primary/15 text-primary shadow-sm"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="font-semibold text-foreground">{preset.title}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">
                    ({preset.genre})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generation Configuration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Primary Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Mystery · Romance">Mystery · Romance</option>
                <option value="Thriller · Sci-Fi">Thriller · Sci-Fi</option>
                <option value="Drama · Romance">Drama · Romance</option>
                <option value="Supernatural · Suspense">Supernatural · Suspense</option>
                <option value="Cyberpunk · Neo-Noir">Cyberpunk · Neo-Noir</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Primary Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
                <option value="Tamil">Tamil</option>
                <option value="Hinglish">Hinglish</option>
                <option value="English">English</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Episodes Target
              </label>
              <select
                value={episodesTarget}
                onChange={(e) => setEpisodesTarget(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value={6}>6 Episodes (Micro-Binge)</option>
                <option value={8}>8 Episodes (Standard Vertical Arc)</option>
                <option value={10}>10 Episodes (Extended Branching)</option>
              </select>
            </div>
          </div>

          {/* CTA: GENERATE STORY */}
          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full inline-flex items-center justify-center gap-2.5 rounded-full py-3.5 text-sm sm:text-base font-bold tracking-wide transition-all shadow-lg active:scale-[0.99] ${
                isGenerating
                  ? "bg-primary/50 text-primary-foreground cursor-wait"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-5 animate-spin" />
                  <span>Synthesizing Characters, Episodes &amp; Decision Trees...</span>
                </>
              ) : (
                <>
                  <Wand2 className="size-5" />
                  <span>GENERATE STORY</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Visual Progress Workflow Across 7 Phases */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl tracking-wide text-foreground">
              Production Workflow Pipeline
            </h3>
            <span className="text-xs text-muted-foreground">
              Phase {currentStep + 1} of 7 Active
            </span>
          </div>
          <AIStoryStep activeStep={currentStep} onSelectStep={setCurrentStep} />
        </section>

        {/* Live Story Output Engine with Creator Controls */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                Interactive Generation Output
              </span>
              <h2 className="font-display text-3xl tracking-wide text-foreground mt-0.5">
                {aiStory.title}
              </h2>
            </div>

            <div className="rounded-xl bg-card border border-border px-3 py-1.5 text-xs text-muted-foreground">
              Creator In Control: <span className="text-foreground font-semibold">Human In The Loop</span>
            </div>
          </div>

          {/* 5 Specialized Generative AI Studio Endpoints & Bible Generator */}
          <AiStudioTools />

          <AIStoryOutput story={aiStory} />
        </section>
      </main>
    </div>
  );
}
