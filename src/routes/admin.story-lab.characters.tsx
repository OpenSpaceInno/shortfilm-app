import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User,
  ChevronRight,
  TrendingUp,
  Share2,
  Tv,
  Users,
  GitBranch,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Search,
  Clapperboard,
  ExternalLink,
} from "lucide-react";
import { useStoryLab } from "@/lib/story-lab-state";
import { SignalBadge, SignalStrengthBadge } from "@/components/story-lab-components";
import type { CharacterSignal, CreatorSignal } from "@/lib/story-lab-data";

/* ==========================================================================
   STORY LAB — CHARACTER & CREATOR SIGNALS
   Route: /admin/story-lab/characters
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/characters")({
  component: CharacterSignalsPage,
});

function CharacterSignalsPage() {
  const { filteredCharacterSignals, creatorSignals, openInvestigation, filters, setSearchQuery } =
    useStoryLab();

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterSignal | undefined>(
    filteredCharacterSignals[0]
  );
  const [activeTab, setActiveTab] = useState<"characters" | "creators">("characters");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/admin/story-lab"
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
            >
              Story Lab
              <ChevronRight className="size-3" />
            </Link>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              People Signals
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Character & Creator Signals
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Identify breakout characters and creator momentum signals driving audience loyalty and repeat viewing.
          </p>
        </div>

        {/* Existing Platform Modules Links */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/characters"
            className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <User className="size-3.5" />
            Character Management
          </Link>
          <Link
            to="/admin/creators"
            className="px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Clapperboard className="size-3.5" />
            Creator Management
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TAB TOGGLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3 border-b border-border">
        <button
          onClick={() => setActiveTab("characters")}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === "characters"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="size-3.5" />
          <span>Character Signals ({filteredCharacterSignals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("creators")}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeTab === "creators"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clapperboard className="size-3.5" />
          <span>Creator Momentum ({creatorSignals.length})</span>
        </button>
      </div>

      {activeTab === "characters" ? (
        <>
          {/* ------------------------------------------------------------------ */}
          {/* 3. CHARACTER SIGNALS TABLE (Section 18) */}
          {/* ------------------------------------------------------------------ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table Area (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Monitored Characters
                  </span>
                  <div className="relative w-48">
                    <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter character..."
                      value={filters.searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 text-xs rounded-md bg-background border border-border"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Character</th>
                        <th className="py-2.5 px-3">Story</th>
                        <th className="py-2.5 px-3">Followers</th>
                        <th className="py-2.5 px-3">Growth</th>
                        <th className="py-2.5 px-3">Episodes</th>
                        <th className="py-2.5 px-3">Signal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredCharacterSignals.map((char) => (
                        <tr
                          key={char.id}
                          onClick={() => setSelectedCharacter(char)}
                          className={`hover:bg-muted/40 transition-colors cursor-pointer ${
                            selectedCharacter?.id === char.id
                              ? "bg-amber-500/10 border-l-2 border-l-amber-500"
                              : ""
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={char.avatar}
                                alt={char.characterName}
                                className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                              />
                              <div>
                                <span className="font-semibold text-foreground block">
                                  {char.characterName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {char.role}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-muted-foreground">
                            {char.storyTitle}
                          </td>

                          <td className="py-3 px-3 font-semibold text-foreground">
                            {char.followers}
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {char.followerGrowth}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-muted-foreground">
                            {char.episodesAppeared}
                          </td>

                          <td className="py-3 px-3">
                            <SignalBadge type={char.signalType} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Selected Character Detail Card (Section 19) */}
            {selectedCharacter && (
              <div className="bg-card rounded-xl border border-border p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <img
                    src={selectedCharacter.avatar}
                    alt={selectedCharacter.characterName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <SignalBadge type={selectedCharacter.signalType} />
                      <SignalStrengthBadge strength={selectedCharacter.signalStrength} />
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      {selectedCharacter.characterName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedCharacter.role} • {selectedCharacter.storyTitle}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">
                      Followers
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {selectedCharacter.followers}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">
                      Follower Growth
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      {selectedCharacter.followerGrowth}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">
                      Episodes Appeared
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {selectedCharacter.episodesAppeared}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Shares</span>
                    <span className="font-bold text-foreground text-sm">
                      {selectedCharacter.shares}
                    </span>
                  </div>
                </div>

                {/* Choice Association */}
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs">
                  <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 block mb-0.5">
                    Choice Association
                  </span>
                  <p className="text-foreground leading-relaxed">
                    {selectedCharacter.choiceAssociation}
                  </p>
                </div>

                {/* Momentum Timeline (Section 19) */}
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Momentum Timeline
                  </span>
                  <div className="space-y-2 border-l-2 border-amber-500/30 pl-3 ml-1 text-xs">
                    {selectedCharacter.momentumTimeline.map((item, idx) => (
                      <div key={idx} className="relative">
                        <span className="size-2 rounded-full bg-amber-500 absolute -left-[17px] top-1" />
                        <span className="font-bold text-foreground block">
                          {item.milestone}
                        </span>
                        <span className="text-muted-foreground text-[11px] block">
                          {item.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Potential Character Signal Notice (Section 19) */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-foreground">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                    Potential Character Signal:
                  </span>
                  {selectedCharacter.potentialOpportunity}
                </div>

                {/* Platform Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
                  <Link
                    to="/admin/characters"
                    className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Open Character Profile
                    <ChevronRight className="size-3" />
                  </Link>
                  <button
                    onClick={() =>
                      openInvestigation({
                        title: `${selectedCharacter.characterName} Momentum Signal`,
                        storyTitle: selectedCharacter.storyTitle,
                        signal: selectedCharacter.signalType,
                        observation: selectedCharacter.observation,
                        suggestedInvestigation: selectedCharacter.potentialOpportunity,
                        relatedCharacter: selectedCharacter.characterName,
                        supportingData: `${selectedCharacter.followers} followers (${selectedCharacter.followerGrowth} growth)`,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Investigate
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ------------------------------------------------------------------ */
        /* 4. CREATOR SIGNALS VIEW (Section 20) */
        /* ------------------------------------------------------------------ */
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3 text-xs leading-relaxed text-blue-950 dark:text-blue-200">
            <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5 text-blue-900 dark:text-blue-300">
                Creator Momentum Intelligence
              </span>
              Story Lab monitors creator-level retention trends to suggest content collaboration and development opportunities without duplicating Creator Operations. Detailed payouts, submissions and contract approvals are managed in Creator Management.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creatorSignals.map((cr) => (
              <div
                key={cr.id}
                className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={cr.avatar}
                        alt={cr.creatorName}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{cr.creatorName}</h4>
                        <p className="text-xs text-muted-foreground">{cr.category}</p>
                      </div>
                    </div>
                    <SignalBadge type={cr.signalType} />
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs p-2 bg-muted/40 rounded-lg border border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Stories</span>
                      <span className="font-bold text-foreground">{cr.recentStories}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Views</span>
                      <span className="font-bold text-foreground">{cr.views}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Completion</span>
                      <span className="font-bold text-foreground">{cr.completion}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Follower Growth</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {cr.followerGrowth}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-card border border-border text-xs mb-3">
                    <strong className="text-foreground block text-[11px] mb-0.5">
                      Observation:
                    </strong>
                    <p className="text-muted-foreground leading-relaxed">{cr.observation}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs">
                    <strong className="text-primary block text-[11px] mb-0.5">
                      Suggested Action:
                    </strong>
                    <p className="text-foreground leading-relaxed">{cr.suggestedAction}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border mt-3 flex items-center justify-between">
                  <Link
                    to="/admin/creators"
                    className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Open Creator Management (4C)
                    <ExternalLink className="size-3" />
                  </Link>
                  <button
                    onClick={() =>
                      openInvestigation({
                        title: `${cr.creatorName} Creator Momentum`,
                        storyTitle: `Catalog by ${cr.creatorName}`,
                        signal: cr.signalType,
                        observation: cr.observation,
                        suggestedInvestigation: cr.suggestedAction,
                        relatedCreator: cr.creatorName,
                        supportingData: `${cr.views} views • ${cr.completion} completion rate`,
                      })
                    }
                    className="px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Investigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
