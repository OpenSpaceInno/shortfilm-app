import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  aiStory as defaultAiStory,
  creators as initialCreators,
  studioDrafts as initialDrafts,
  studioStories as initialStories,
  studioSubmissions as initialSubmissions,
  type AiStory,
  type Creator,
  type StudioStory,
} from "@/lib/creators";
import { creatorsApi, aiStudioApi } from "@/lib/api-client";

type CreatorSubmission = {
  id: string;
  title: string;
  submitted: string;
  status: "Under review" | "Approved" | "Changes requested";
  note: string;
  episodesCount?: number;
  genre?: string;
};

type CreatorContextType = {
  followedCreators: string[];
  isFollowing: (creatorId: string) => boolean;
  toggleFollow: (creatorId: string) => void;
  getFollowerCount: (creator: Creator) => string;
  
  // Studio management
  stories: StudioStory[];
  drafts: StudioStory[];
  submissions: CreatorSubmission[];
  dashboardData: any | null;
  refreshDashboard: () => Promise<void>;
  addDraft: (draft: Partial<StudioStory>) => void;
  submitStoryToEditorial: (story: { title: string; genre: string; episodes: number; logline: string }) => Promise<void>;
  
  // AI Story Studio state
  aiStory: AiStory;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isGenerating: boolean;
  activePrompt: string;
  setActivePrompt: (prompt: string) => void;
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  episodesTarget: number;
  setEpisodesTarget: (target: number) => void;
  acceptedSections: Record<string, boolean>;
  toggleAcceptSection: (sectionKey: string) => void;
  updateStorySection: <K extends keyof AiStory>(key: K, value: AiStory[K]) => void;
  regenerateSection: (sectionKey: string) => void;
  generateStoryWithAi: (customPrompt?: string) => Promise<void>;
  resetStoryStudio: () => void;
};

const FOLLOWED_KEY = "shortreel.creators.followed.v1";
const SUBMISSIONS_KEY = "shortreel.creators.submissions.v1";
const DRAFTS_KEY = "shortreel.creators.drafts.v1";

const CreatorContext = createContext<CreatorContextType | null>(null);

export function CreatorProvider({ children }: { children: ReactNode }) {
  const [followed, setFollowed] = useState<string[]>(["ananya-studios"]);
  const [stories] = useState<StudioStory[]>(initialStories);
  const [drafts, setDrafts] = useState<StudioStory[]>(initialDrafts);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>(initialSubmissions);
  const [dashboardData, setDashboardData] = useState<any | null>(null);

  const refreshDashboard = useCallback(async () => {
    try {
      const res = await creatorsApi.getDashboard();
      if (res.success && res.data) {
        setDashboardData(res.data);
        if (res.data.submissions && Array.isArray(res.data.submissions) && res.data.submissions.length > 0) {
          const mappedSubs: CreatorSubmission[] = res.data.submissions.map((s: any) => ({
            id: s.id,
            title: s.title,
            submitted: s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "Recent",
            status: s.status === "APPROVED" ? "Approved" : s.status === "CHANGES_REQUESTED" ? "Changes requested" : "Under review",
            note: s.reviewerNotes || s.synopsis || "Editorial review in progress.",
            episodesCount: s.storyInfo?.episodeCount || 8,
            genre: s.storyInfo?.genre || "Interactive Series",
          }));
          setSubmissions((prev) => {
            const merged = [...mappedSubs];
            for (const item of prev) {
              if (!merged.some((m) => m.id === item.id)) merged.push(item);
            }
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn("Failed to fetch creator dashboard", e);
    }
  }, []);

  // AI Studio State
  const [aiStory, setAiStory] = useState<AiStory>(defaultAiStory);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activePrompt, setActivePrompt] = useState<string>(
    "A young woman receives voice messages from her future self warning her about decisions she hasn't yet made."
  );
  const [selectedGenre, setSelectedGenre] = useState<string>("Mystery · Romance");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Hindi");
  const [episodesTarget, setEpisodesTarget] = useState<number>(8);
  const [acceptedSections, setAcceptedSections] = useState<Record<string, boolean>>({
    concept: true,
  });

  // Local storage initialization
  useEffect(() => {
    try {
      const storedFollowed = localStorage.getItem(FOLLOWED_KEY);
      if (storedFollowed) setFollowed(JSON.parse(storedFollowed));

      const storedSubs = localStorage.getItem(SUBMISSIONS_KEY);
      if (storedSubs) setSubmissions(JSON.parse(storedSubs));

      const storedDrafts = localStorage.getItem(DRAFTS_KEY);
      if (storedDrafts) setDrafts(JSON.parse(storedDrafts));
    } catch (e) {
      console.warn("Failed to load creator local storage", e);
    }
    refreshDashboard();
  }, [refreshDashboard]);

  const toggleFollow = useCallback((creatorId: string) => {
    setFollowed((prev) => {
      const next = prev.includes(creatorId)
        ? prev.filter((id) => id !== creatorId)
        : [...prev, creatorId];
      try {
        localStorage.setItem(FOLLOWED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const isFollowing = useCallback(
    (creatorId: string) => followed.includes(creatorId),
    [followed]
  );

  const getFollowerCount = useCallback(
    (creator: Creator) => {
      const isFav = followed.includes(creator.id);
      if (!isFav) return creator.followers;
      // If following, add +1 user hint
      if (creator.followers.endsWith("M")) return `${creator.followers} (+1)`;
      if (creator.followers.endsWith("K")) return `${creator.followers} (+1)`;
      return creator.followers;
    },
    [followed]
  );

  const addDraft = useCallback((draft: Partial<StudioStory>) => {
    setDrafts((prev) => {
      const newDraft: StudioStory = {
        id: `d-${Date.now()}`,
        title: draft.title || "Untitled Interactive Story",
        status: "Draft",
        episodes: draft.episodes || 6,
        views: "—",
        completion: 0,
        votes: "—",
        updated: "Just now",
        ...draft,
      };
      const next = [newDraft, ...prev];
      try {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const submitStoryToEditorial = useCallback(
    async (storyData: { title: string; genre: string; episodes: number; logline: string }) => {
      let createdId = `sub-${Date.now()}`;
      try {
        const res = await creatorsApi.submitStory({
          title: storyData.title,
          synopsis: storyData.logline,
          submissionType: "FULL_SERIES",
          storyInfo: {
            title: storyData.title,
            genre: storyData.genre,
            synopsis: storyData.logline,
            episodeCount: storyData.episodes,
            interactive: true,
          },
          checklist: {
            contentComplete: true,
            metadataComplete: true,
            interactivePathsValid: true,
            storyStructureValid: true,
          },
        });

        if (res.success && res.data?.id) {
          createdId = res.data.id;
          await creatorsApi.submitForReview(res.data.id).catch(() => {});
        }
      } catch (err) {
        console.warn("Backend submitStory failed, keeping local state", err);
      }

      setSubmissions((prev) => {
        const newSub: CreatorSubmission = {
          id: createdId,
          title: storyData.title,
          submitted: "Just now",
          status: "Under review",
          note: "Editorial review initiated. Script and interactive branch mapping in queue.",
          episodesCount: storyData.episodes,
          genre: storyData.genre,
        };
        const next = [newSub, ...prev];
        try {
          localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const toggleAcceptSection = useCallback((sectionKey: string) => {
    setAcceptedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }, []);

  const updateStorySection = useCallback(
    <K extends keyof AiStory>(key: K, value: AiStory[K]) => {
      setAiStory((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const regenerateSection = useCallback((sectionKey: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      if (sectionKey === "characters") {
        setAiStory((prev) => ({
          ...prev,
          characters: [
            {
              name: "Maya Roy",
              age: "Age 24",
              role: "Protagonist",
              note: "Junior systems architect, insomniac, receives timestamped audio from 2027.",
            },
            {
              name: "Kabir",
              age: "Age 28",
              role: "Investigative Ally",
              note: "Ex-cybersecurity researcher who notices the carrier signal is impossible.",
            },
            {
              name: "Dr. Ananya",
              age: "Age 42",
              role: "Antagonist / Architect",
              note: "Quantum telemetry lead at ChronoCorp who wrote the prediction algorithm.",
            },
            {
              name: "Echo (Future Voice)",
              age: "Unknown",
              role: "Temporal Conduit",
              note: "Speaks with Maya's voice cadence but knows how every character dies.",
            },
          ],
        }));
      } else if (sectionKey === "arc") {
        setAiStory((prev) => ({
          ...prev,
          arc: [
            {
              label: "Act I — Desynchronization",
              text: "The audio warns Maya of a subway power grid failure. When it occurs at 3:14 PM, her world shatters.",
            },
            {
              label: "Act II — Quantum Divergence",
              text: "Every butterfly choice changes the future notes. She discovers her ally Kabir might be the informant who betrays her.",
            },
            {
              label: "Act III — The Singular Loop",
              text: "To save the city, Maya must broadcast the very warning frequency backwards in time to herself.",
            },
          ],
        }));
      } else if (sectionKey === "episodes") {
        setAiStory((prev) => ({
          ...prev,
          episodeList: [
            {
              number: 1,
              title: "Timestamp 03:04 AM",
              synopsis: "An encrypted voice file arrives from a sender identical to Maya's own number.",
              hook: "Maya hears herself weeping in audio recorded 48 hours in the future.",
              cliffhanger: "A CCTV notification flashes showing someone identical to her outside her apartment door.",
              characters: ["Maya", "Riya"],
              duration: "1m 58s",
            },
            {
              number: 2,
              title: "The Butterfly Corridor",
              synopsis: "Maya intentionally misses her regular train to test the temporal anomaly.",
              hook: "The train she skipped derails in the tunnel ahead.",
              cliffhanger: "Paramedic Kabir pulls Maya into the control booth as security seals the station.",
              characters: ["Maya", "Kabir"],
              duration: "2m 10s",
            },
            {
              number: 3,
              title: "Frequency Modulation",
              synopsis: "Kabir hooks the audio stream to an oscilloscope, uncovering hidden ultrasonic coordinates.",
              hook: "The coordinate points directly under Maya's childhood bedroom.",
              cliffhanger: "Future Maya's voice cuts in: 'Don't let Kabir see the map.'",
              characters: ["Maya", "Kabir"],
              duration: "1m 45s",
            },
          ],
        }));
      } else if (sectionKey === "choices") {
        setAiStory((prev) => ({
          ...prev,
          choices: [
            {
              episode: 1,
              prompt: "What should Maya do with the mysterious voice note?",
              optionA: "Listen immediately through headphones",
              optionB: "Forward the raw file to Kabir's forensics lab",
              consequenceA: "Maya learns the future immediately but the signal burns her phone SIM.",
              consequenceB: "Kabir traces the carrier wave, but alerting authorities activates the hunters.",
            },
            {
              episode: 2,
              prompt: "Kabir asks Maya why she was waiting at the subway platform:",
              optionA: "Reveal the future audio warning",
              optionB: "Lie and claim it was a panicked hunch",
              consequenceA: "Kabir commits 100% as an ally, but puts his family in danger.",
              consequenceB: "Maya protects Kabir, but he suspects she is working with the saboteurs.",
            },
          ],
        }));
      } else if (sectionKey === "concept") {
        setAiStory((prev) => ({
          ...prev,
          title: "Messages From Tomorrow: Redux",
          logline:
            "When voice notes from tomorrow predict a city-wide blackout, a young coder must choose between saving strangers or preventing her own erasure.",
        }));
      }
      setIsGenerating(false);
    }, 900);
  }, []);

  const generateStoryWithAi = useCallback(
    async (customPrompt?: string) => {
      const promptToUse = customPrompt || activePrompt;
      setIsGenerating(true);
      setCurrentStep(0);

      try {
        const apiPromise = aiStudioApi.expandConcept({
          idea: promptToUse,
          genre: selectedGenre,
          language: selectedLanguage,
          episodesTarget,
        });

        // Step through visual workflow
        for (let s = 1; s <= 5; s++) {
          await new Promise((r) => setTimeout(r, 250));
          setCurrentStep(s);
        }

        const res = await apiPromise;
        setCurrentStep(6);

        if (res.success && res.data) {
          const data = res.data;
          const updatedStory: AiStory = {
            ...defaultAiStory,
            title: data.title || (promptToUse.length > 30 ? promptToUse.slice(0, 30) + '...' : promptToUse),
            genre: data.genre || selectedGenre,
            language: data.language || selectedLanguage,
            episodes: data.episodes || episodesTarget,
            logline: data.logline || promptToUse,
            arc: data.arc && data.arc.length > 0
              ? data.arc.map((a: any) => ({ label: a.label, text: a.text }))
              : defaultAiStory.arc,
            characters: data.characters && data.characters.length > 0
              ? data.characters.map((c: any) => ({
                  name: c.name,
                  age: c.age || 'Age 24',
                  role: c.role || 'Protagonist',
                  note: c.coreDesire || c.motivation || c.note || 'Dynamic character',
                }))
              : defaultAiStory.characters,
          };

          setAiStory(updatedStory);
          setIsGenerating(false);
          return;
        }
      } catch (err) {
        console.warn('aiStudioApi.expandConcept failed, falling back to local synthesis', err);
      }

      // Fallback synthesis
      const generatedTitle = promptToUse.toLowerCase().includes("cyberpunk")
        ? "Neon Karma 2099"
        : promptToUse.toLowerCase().includes("monsoon")
        ? "Monsoon Room 302"
        : "Messages From Tomorrow";

      const updatedStory: AiStory = {
        ...defaultAiStory,
        title: generatedTitle,
        genre: selectedGenre,
        language: selectedLanguage,
        episodes: episodesTarget,
        logline: promptToUse,
      };

      setAiStory(updatedStory);
      setIsGenerating(false);
    },
    [activePrompt, selectedGenre, selectedLanguage, episodesTarget]
  );

  const resetStoryStudio = useCallback(() => {
    setAiStory(defaultAiStory);
    setCurrentStep(0);
    setAcceptedSections({ concept: true });
  }, []);

  const value = useMemo(
    () => ({
      followedCreators: followed,
      isFollowing,
      toggleFollow,
      getFollowerCount,
      stories,
      drafts,
      submissions,
      dashboardData,
      refreshDashboard,
      addDraft,
      submitStoryToEditorial,
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
      acceptedSections,
      toggleAcceptSection,
      updateStorySection,
      regenerateSection,
      generateStoryWithAi,
      resetStoryStudio,
    }),
    [
      followed,
      isFollowing,
      toggleFollow,
      getFollowerCount,
      stories,
      drafts,
      submissions,
      dashboardData,
      refreshDashboard,
      addDraft,
      submitStoryToEditorial,
      aiStory,
      currentStep,
      isGenerating,
      activePrompt,
      selectedGenre,
      selectedLanguage,
      episodesTarget,
      acceptedSections,
      toggleAcceptSection,
      updateStorySection,
      regenerateSection,
      generateStoryWithAi,
      resetStoryStudio,
    ]
  );

  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>;
}

export function useCreatorState() {
  const ctx = useContext(CreatorContext);
  if (!ctx) {
    throw new Error("useCreatorState must be used within a CreatorProvider");
  }
  return ctx;
}
