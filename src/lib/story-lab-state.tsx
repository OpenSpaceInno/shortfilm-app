import React, { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from "react";
import {
  fetchStorySignals,
  fetchContentOpportunities,
  fetchStoryExperiments,
  updateStoryExperimentStatus as apiUpdateExperimentStatus,
  updateStoryOpportunityStatus as apiUpdateOpportunityStatus,
  createStoryExperiment as apiCreateExperiment,
} from "./story-lab-api";
import {
  storySignalsData,
  storyIntelligenceList,
  characterSignalsData,
  creatorSignalsData,
  interactiveSignalsData,
  contentOpportunitiesData,
  storyExperimentsData,
  type StorySignal,
  type StoryIntelligenceDetail,
  type CharacterSignal,
  type CreatorSignal,
  type InteractiveSignalItem,
  type ContentOpportunity,
  type StoryExperiment,
  type SignalType,
  type SignalStrength,
  type OpportunityStatus,
  type ExperimentStatus,
} from "./story-lab-data";
import { auditLog, type AdminRole } from "./admin-data";
import { useAdmin } from "./admin-state";

/* ==========================================================================
   STORY LAB — REACT STATE MANAGEMENT
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export type TimeRangeOption =
  | "Last 7 Days"
  | "Last 30 Days"
  | "Last 90 Days"
  | "Since Release"
  | "Custom";

export interface StoryLabFilterState {
  timeRange: TimeRangeOption;
  genre: string;
  language: string;
  creator: string;
  story: string;
  interactiveOnly: boolean;
  signalType: string;
  signalStrength: string;
  searchQuery: string;
}

export interface InvestigationTarget {
  title: string;
  storyTitle: string;
  signal: string;
  observation: string;
  suggestedInvestigation: string;
  storyId?: string;
  episode?: string;
  relatedCharacter?: string;
  relatedCreator?: string;
  supportingData?: string;
  timestamp?: string;
}

interface StoryLabContextType {
  // Global Filters
  filters: StoryLabFilterState;
  setTimeRange: (range: TimeRangeOption) => void;
  setGenre: (genre: string) => void;
  setLanguage: (language: string) => void;
  setCreator: (creator: string) => void;
  setStory: (story: string) => void;
  setInteractiveOnly: (interactive: boolean) => void;
  setSignalType: (signalType: string) => void;
  setSignalStrength: (strength: string) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;

  // Datasets
  signals: StorySignal[];
  filteredSignals: StorySignal[];
  storyIntelligence: StoryIntelligenceDetail[];
  filteredStoryIntelligence: StoryIntelligenceDetail[];
  characterSignals: CharacterSignal[];
  filteredCharacterSignals: CharacterSignal[];
  creatorSignals: CreatorSignal[];
  filteredCreatorSignals: CreatorSignal[];
  interactiveSignals: InteractiveSignalItem[];
  opportunities: ContentOpportunity[];
  filteredOpportunities: ContentOpportunity[];
  experiments: StoryExperiment[];
  filteredExperiments: StoryExperiment[];

  // Modal & Selection States
  selectedSignal: StorySignal | null;
  setSelectedSignal: (sig: StorySignal | null) => void;
  selectedExperiment: StoryExperiment | null;
  setSelectedExperiment: (exp: StoryExperiment | null) => void;
  selectedOpportunity: ContentOpportunity | null;
  setSelectedOpportunity: (opp: ContentOpportunity | null) => void;

  investigationModalTarget: InvestigationTarget | null;
  openInvestigation: (target: InvestigationTarget) => void;
  closeInvestigation: () => void;

  isCreateExperimentOpen: boolean;
  openCreateExperiment: () => void;
  closeCreateExperiment: () => void;

  // Actions
  createExperiment: (data: Omit<StoryExperiment, "id" | "sampleSize">) => void;
  updateExperimentStatus: (id: string, status: ExperimentStatus) => void;
  updateOpportunityStatus: (id: string, status: OpportunityStatus, note?: string) => void;
  addOpportunityNote: (id: string, note: string) => void;
  addStoryLabNote: (storyTitle: string, note: string) => void;

  // Role Permissions
  canAccessSection: (section: "overview" | "stories" | "audience" | "characters" | "interactive" | "opportunities" | "experiments") => boolean;
}

const initialFilters: StoryLabFilterState = {
  timeRange: "Last 30 Days",
  genre: "All",
  language: "All",
  creator: "All",
  story: "All",
  interactiveOnly: false,
  signalType: "All",
  signalStrength: "All",
  searchQuery: "",
};

const StoryLabContext = createContext<StoryLabContextType | undefined>(undefined);

export function StoryLabProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAdmin();
  const currentRole = currentUser?.role || "Super Admin";
  const user = currentUser;

  // Filter State
  const [filters, setFilters] = useState<StoryLabFilterState>(initialFilters);

  // Entities Data State
  const [signals, setSignals] = useState<StorySignal[]>(storySignalsData);
  const [storyIntelligence, setStoryIntelligence] = useState<StoryIntelligenceDetail[]>(storyIntelligenceList);
  const [characterSignals, setCharacterSignals] = useState<CharacterSignal[]>(characterSignalsData);
  const [creatorSignals, setCreatorSignals] = useState<CreatorSignal[]>(creatorSignalsData);
  const [interactiveSignals, setInteractiveSignals] = useState<InteractiveSignalItem[]>(interactiveSignalsData);
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>(contentOpportunitiesData);
  const [experiments, setExperiments] = useState<StoryExperiment[]>(storyExperimentsData);

  // Modals & Selection
  const [selectedSignal, setSelectedSignal] = useState<StorySignal | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<StoryExperiment | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ContentOpportunity | null>(null);
  const [investigationModalTarget, setInvestigationModalTarget] = useState<InvestigationTarget | null>(null);
  const [isCreateExperimentOpen, setIsCreateExperimentOpen] = useState(false);

  // Live Backend Data Fetching
  useEffect(() => {
    let isMounted = true;
    const loadLiveData = async () => {
      try {
        const [liveSignals, liveOpps, liveExps] = await Promise.all([
          fetchStorySignals(),
          fetchContentOpportunities(),
          fetchStoryExperiments(),
        ]);
        if (isMounted) {
          if (liveSignals && liveSignals.length > 0) setSignals(liveSignals);
          if (liveOpps && liveOpps.length > 0) setOpportunities(liveOpps);
          if (liveExps && liveExps.length > 0) setExperiments(liveExps);
        }
      } catch {
        // graceful offline fallback to mock datasets
      }
    };
    loadLiveData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Handlers
  const setTimeRange = (range: TimeRangeOption) => setFilters((f) => ({ ...f, timeRange: range }));
  const setGenre = (genre: string) => setFilters((f) => ({ ...f, genre }));
  const setLanguage = (language: string) => setFilters((f) => ({ ...f, language }));
  const setCreator = (creator: string) => setFilters((f) => ({ ...f, creator }));
  const setStory = (story: string) => setFilters((f) => ({ ...f, story }));
  const setInteractiveOnly = (interactiveOnly: boolean) => setFilters((f) => ({ ...f, interactiveOnly }));
  const setSignalType = (signalType: string) => setFilters((f) => ({ ...f, signalType }));
  const setSignalStrength = (signalStrength: string) => setFilters((f) => ({ ...f, signalStrength }));
  const setSearchQuery = (searchQuery: string) => setFilters((f) => ({ ...f, searchQuery }));
  const resetFilters = () => setFilters(initialFilters);

  // Modal Handlers
  const openInvestigation = (target: InvestigationTarget) => {
    setInvestigationModalTarget(target);
    // Audit log entry for investigation review
    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: user?.name || "Admin",
      role: currentRole,
      action: "Investigated Signal",
      entity: `${target.storyTitle}: ${target.signal}`,
      entityId: target.storyId || "story-signal",
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
      details: target.observation,
    });
  };

  const closeInvestigation = () => setInvestigationModalTarget(null);
  const openCreateExperiment = () => setIsCreateExperimentOpen(true);
  const closeCreateExperiment = () => setIsCreateExperimentOpen(false);

  // RBAC Helper based on Section 47 of specification
  const canAccessSection = (
    section: "overview" | "stories" | "audience" | "characters" | "interactive" | "opportunities" | "experiments"
  ): boolean => {
    switch (currentRole) {
      case "Super Admin":
      case "Analyst":
        return true;
      case "Content Admin":
        return ["overview", "stories", "audience", "interactive", "opportunities"].includes(section);
      case "Editor":
        return ["overview", "stories", "characters", "interactive", "experiments"].includes(section);
      case "Creator Manager":
        return ["overview", "characters", "stories"].includes(section);
      case "Finance":
        return false;
      default:
        return true;
    }
  };

  // Actions
  const createExperiment = (data: Omit<StoryExperiment, "id" | "sampleSize">) => {
    const newExp: StoryExperiment = {
      ...data,
      id: `exp-${Date.now().toString(36)}`,
      sampleSize: "0 viewers (accumulating)",
    };
    setExperiments((prev) => [newExp, ...prev]);

    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: user?.name || "Admin",
      role: currentRole,
      action: "Created Experiment",
      entity: `${newExp.name} (${newExp.storyTitle})`,
      entityId: newExp.id,
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
      details: `Hypothesis: ${newExp.hypothesis}`,
    });
  };

  const updateExperimentStatus = (id: string, status: ExperimentStatus) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, status } : exp))
    );
    apiUpdateExperimentStatus(id, status).catch(() => {});

    const exp = experiments.find((e) => e.id === id);
    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: user?.name || "Admin",
      role: currentRole,
      action: "Updated Experiment Status",
      entity: exp ? exp.name : id,
      entityId: id,
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
      details: `Status set to ${status}`,
    });
  };

  const updateOpportunityStatus = (id: string, status: OpportunityStatus, note?: string) => {
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== id) return opp;
        const newNotes = note
          ? opp.reviewerNotes
            ? `${opp.reviewerNotes} | ${note}`
            : note
          : opp.reviewerNotes;
        const updated: ContentOpportunity = {
          ...opp,
          status,
        };
        if (newNotes) {
          updated.reviewerNotes = newNotes;
        } else {
          delete updated.reviewerNotes;
        }
        return updated;
      })
    );
    apiUpdateOpportunityStatus(id, status, note).catch(() => {});

    const opp = opportunities.find((o) => o.id === id);
    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: user?.name || "Admin",
      role: currentRole,
      action: "Updated Opportunity Status",
      entity: opp ? opp.title : id,
      entityId: id,
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
      details: `Opportunity marked as: ${status}${note ? ` (${note})` : ""}`,
    });
  };

  const addOpportunityNote = (id: string, note: string) => {
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === id
          ? {
              ...opp,
              reviewerNotes: opp.reviewerNotes
                ? `${opp.reviewerNotes}\n[${new Date().toLocaleTimeString()}]: ${note}`
                : `[${new Date().toLocaleTimeString()}]: ${note}`,
            }
          : opp
      )
    );

    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: user?.name || "Admin",
      role: currentRole,
      action: "Added Opportunity Review Note",
      entity: id,
      entityId: id,
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
      details: note,
    });
  };

  const addStoryLabNote = (storyTitle: string, note: string) => {
    auditLog.unshift({
      id: `aud-${Date.now()}`,
      user: user?.name || "Admin",
      role: currentRole,
      action: "Story Lab Note Added",
      entity: storyTitle,
      entityId: "story-lab-note",
      timestamp: new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Success",
      details: note,
    });
  };

  // Filtered computed views
  const filteredSignals = useMemo(() => {
    return signals.filter((sig) => {
      if (filters.genre !== "All" && sig.genre.toLowerCase() !== filters.genre.toLowerCase()) return false;
      if (filters.creator !== "All" && sig.creatorName.toLowerCase() !== filters.creator.toLowerCase()) return false;
      if (filters.story !== "All" && sig.storyTitle.toLowerCase() !== filters.story.toLowerCase()) return false;
      if (filters.signalType !== "All" && sig.type !== filters.signalType) return false;
      if (filters.signalStrength !== "All" && sig.strength !== filters.signalStrength) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          sig.storyTitle.toLowerCase().includes(q) ||
          sig.title.toLowerCase().includes(q) ||
          sig.creatorName.toLowerCase().includes(q) ||
          sig.observation.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [signals, filters]);

  const filteredStoryIntelligence = useMemo(() => {
    return storyIntelligence.filter((story) => {
      if (filters.genre !== "All" && story.genre.toLowerCase() !== filters.genre.toLowerCase()) return false;
      if (filters.language !== "All" && story.language.toLowerCase() !== filters.language.toLowerCase()) return false;
      if (filters.creator !== "All" && story.creatorName.toLowerCase() !== filters.creator.toLowerCase()) return false;
      const title = story.storyTitle || story.title;
      if (filters.story !== "All" && title.toLowerCase() !== filters.story.toLowerCase()) return false;
      if (filters.interactiveOnly && !story.interactive) return false;
      if (filters.signalType !== "All") {
        const hasSig = story.signals.some((s) => s.type === filters.signalType);
        if (!hasSig) return false;
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          title.toLowerCase().includes(q) ||
          story.creatorName.toLowerCase().includes(q) ||
          story.genre.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [storyIntelligence, filters]);

  const filteredCharacterSignals = useMemo(() => {
    return characterSignals.filter((char) => {
      if (filters.story !== "All" && char.storyTitle.toLowerCase() !== filters.story.toLowerCase()) return false;
      if (filters.creator !== "All" && char.creatorName.toLowerCase() !== filters.creator.toLowerCase()) return false;
      if (filters.signalType !== "All" && char.signalType !== filters.signalType) return false;
      if (filters.signalStrength !== "All" && char.signalStrength !== filters.signalStrength) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          char.characterName.toLowerCase().includes(q) ||
          char.storyTitle.toLowerCase().includes(q) ||
          char.observation.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [characterSignals, filters]);

  const filteredCreatorSignals = useMemo(() => {
    return creatorSignals.filter((cr) => {
      if (filters.creator !== "All" && cr.creatorName.toLowerCase() !== filters.creator.toLowerCase()) return false;
      if (filters.signalType !== "All" && cr.signalType !== filters.signalType) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          cr.creatorName.toLowerCase().includes(q) ||
          cr.observation.toLowerCase().includes(q) ||
          cr.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [creatorSignals, filters]);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (filters.story !== "All" && opp.storyTitle?.toLowerCase() !== filters.story.toLowerCase()) return false;
      if (filters.creator !== "All" && opp.creatorName?.toLowerCase() !== filters.creator.toLowerCase()) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          opp.title.toLowerCase().includes(q) ||
          opp.observation.toLowerCase().includes(q) ||
          opp.possibleOpportunity.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [opportunities, filters]);

  const filteredExperiments = useMemo(() => {
    return experiments.filter((exp) => {
      if (filters.story !== "All" && exp.storyTitle.toLowerCase() !== filters.story.toLowerCase()) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          exp.name.toLowerCase().includes(q) ||
          exp.storyTitle.toLowerCase().includes(q) ||
          exp.hypothesis.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [experiments, filters]);

  return (
    <StoryLabContext.Provider
      value={{
        filters,
        setTimeRange,
        setGenre,
        setLanguage,
        setCreator,
        setStory,
        setInteractiveOnly,
        setSignalType,
        setSignalStrength,
        setSearchQuery,
        resetFilters,

        signals,
        filteredSignals,
        storyIntelligence,
        filteredStoryIntelligence,
        characterSignals,
        filteredCharacterSignals,
        creatorSignals,
        filteredCreatorSignals,
        interactiveSignals,
        opportunities,
        filteredOpportunities,
        experiments,
        filteredExperiments,

        selectedSignal,
        setSelectedSignal,
        selectedExperiment,
        setSelectedExperiment,
        selectedOpportunity,
        setSelectedOpportunity,

        investigationModalTarget,
        openInvestigation,
        closeInvestigation,

        isCreateExperimentOpen,
        openCreateExperiment,
        closeCreateExperiment,

        createExperiment,
        updateExperimentStatus,
        updateOpportunityStatus,
        addOpportunityNote,
        addStoryLabNote,

        canAccessSection,
      }}
    >
      {children}
    </StoryLabContext.Provider>
  );
}

export function useStoryLab() {
  const context = useContext(StoryLabContext);
  if (!context) {
    throw new Error("useStoryLab must be used within a StoryLabProvider");
  }
  return context;
}
