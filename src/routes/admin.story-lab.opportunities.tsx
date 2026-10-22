import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Lightbulb,
  ChevronRight,
  Tv,
  User,
  FlaskConical,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileEdit,
  ExternalLink,
  Info,
  Filter,
  Search,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useStoryLab } from "@/lib/story-lab-state";
import type { OpportunityType, OpportunityStatus, ContentOpportunity } from "@/lib/story-lab-data";

/* ==========================================================================
   STORY LAB — CONTENT OPPORTUNITIES
   Route: /admin/story-lab/opportunities
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export const Route = createFileRoute("/admin/story-lab/opportunities")({
  component: ContentOpportunitiesPage,
});

function ContentOpportunitiesPage() {
  const {
    filteredOpportunities,
    updateOpportunityStatus,
    addOpportunityNote,
    openCreateExperiment,
    openInvestigation,
    filters,
    setSearchQuery,
  } = useStoryLab();

  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const opportunitiesList = filteredOpportunities.filter((opp) => {
    if (typeFilter !== "All" && opp.type !== typeFilter) return false;
    if (statusFilter !== "All" && opp.status !== statusFilter) return false;
    return true;
  });

  const handleSaveNote = (id: string) => {
    if (!noteText.trim()) return;
    addOpportunityNote(id, noteText);
    setEditingNoteId(null);
    setNoteText("");
  };

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
            <span className="text-xs font-semibold text-primary">
              Human Review Workspace
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Content Opportunities
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Editorial workspace to review content expansion, spin-off potential, and creative hypotheses before committing production resources.
          </p>
        </div>

        <button
          onClick={openCreateExperiment}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs self-start md:self-auto"
        >
          <FlaskConical className="size-3.5" />
          Test Hypothesis via Experiment
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INFORMATIONAL BANNER (Section 25) */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs leading-relaxed text-foreground">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold block mb-0.5 text-primary">
            Human Decision-Making Principle
          </span>
          Content Opportunities is an editorial evaluation space, NOT an automated investment recommendation engine. Signals surface promising story universes, breakout characters, or interactive mechanics for human team investigation.
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FILTERS & SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search opportunity by title or observation..."
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs rounded-lg bg-background border border-border px-2.5 py-1.5"
          >
            <option value="All">All Opportunity Types</option>
            <option value="Story Expansion">Story Expansion</option>
            <option value="Character Opportunity">Character Opportunity</option>
            <option value="Interactive Opportunity">Interactive Opportunity</option>
            <option value="Creator Opportunity">Creator Opportunity</option>
            <option value="Genre Opportunity">Genre Opportunity</option>
            <option value="Retention Opportunity">Retention Opportunity</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg bg-background border border-border px-2.5 py-1.5"
          >
            <option value="All">All Statuses</option>
            <option value="Open Review">Open Review</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Action Planned">Action Planned</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. OPPORTUNITIES LIST */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {opportunitiesList.length === 0 ? (
          <div className="col-span-2 bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Lightbulb className="size-8 mx-auto mb-2 opacity-40" />
            <h4 className="font-bold text-sm text-foreground">No opportunities found</h4>
            <p className="text-xs mt-1">Adjust filters or create new story hypotheses.</p>
          </div>
        ) : (
          opportunitiesList.map((opp) => (
            <div
              key={opp.id}
              className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {opp.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        opp.priority === "High"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {opp.priority} Priority
                    </span>
                  </div>

                  <span className="text-[11px] text-muted-foreground">{opp.createdAt}</span>
                </div>

                <h3 className="font-bold text-base text-foreground mb-1">{opp.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Signal: <span className="font-semibold text-foreground">{opp.signal}</span>
                  {opp.storyTitle && ` • Story: ${opp.storyTitle}`}
                  {opp.characterName && ` • Character: ${opp.characterName}`}
                  {opp.creatorName && ` • Creator: ${opp.creatorName}`}
                </p>

                {/* Observation Box */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border mb-3 text-xs">
                  <strong className="text-foreground block text-[11px] mb-0.5">
                    Observation:
                  </strong>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {opp.observation}
                  </p>
                  <span className="inline-block mt-2 text-[11px] text-muted-foreground bg-card px-2 py-0.5 rounded border border-border/80">
                    Evidence: {opp.supportingData}
                  </span>
                </div>

                {/* Possible Opportunity */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs mb-3">
                  <strong className="text-primary block text-[11px] mb-0.5 flex items-center gap-1">
                    <Lightbulb className="size-3" />
                    Possible Opportunity:
                  </strong>
                  <p className="text-foreground leading-relaxed">
                    {opp.possibleOpportunity}
                  </p>
                </div>

                {/* Reviewer Notes & Lifecycle */}
                {opp.reviewerNotes && (
                  <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-xs mb-3 text-muted-foreground">
                    <strong className="text-foreground block text-[10px] uppercase tracking-wider mb-0.5">
                      Editorial Review Notes:
                    </strong>
                    <p className="whitespace-pre-line text-[11px]">{opp.reviewerNotes}</p>
                  </div>
                )}

                {/* Note Editor */}
                {editingNoteId === opp.id ? (
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Add reviewer notes..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full text-xs rounded-lg bg-background border border-border px-3 py-1.5 focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="text-xs px-2.5 py-1 text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNote(opp.id)}
                        className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground font-medium"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Status Update & Actions Footer */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-medium">Review Status:</span>
                    <select
                      value={opp.status}
                      onChange={(e) =>
                        updateOpportunityStatus(opp.id, e.target.value as OpportunityStatus)
                      }
                      className="text-xs rounded-md bg-background border border-border px-2 py-0.5 font-semibold text-foreground"
                    >
                      <option value="Open Review">Open Review</option>
                      <option value="Under Investigation">Under Investigation</option>
                      <option value="Action Planned">Action Planned</option>
                      <option value="Dismissed">Dismissed</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setEditingNoteId(opp.id);
                      setNoteText("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <MessageSquare className="size-3" />
                    <span>Add Note</span>
                  </button>
                </div>

                {/* Quick Navigation Links */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                  {opp.storyId && (
                    <Link
                      to="/admin/story-lab/stories/$storyId"
                      params={{ storyId: opp.storyId }}
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Tv className="size-3" /> Review Story
                    </Link>
                  )}
                  {opp.characterName && (
                    <Link
                      to="/admin/story-lab/characters"
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      <User className="size-3" /> Review Character
                    </Link>
                  )}
                  <button
                    onClick={() =>
                      openInvestigation({
                        title: opp.title,
                        storyTitle: opp.storyTitle || "Opportunity Investigation",
                        signal: opp.type,
                        observation: opp.observation,
                        suggestedInvestigation: opp.possibleOpportunity,
                        ...(opp.storyId ? { storyId: opp.storyId } : {}),
                        supportingData: opp.supportingData,
                      })
                    }
                    className="px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors ml-auto"
                  >
                    Investigate
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
