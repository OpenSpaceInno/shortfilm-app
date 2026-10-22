/* ==========================================================================
   STORY LAB — DATA MODELS & MOCK INTELLIGENCE DATA
   Iteration 4D — Content Intelligence Workspace & Decision Support
   Audience Behaviour -> Signal -> Insight -> Human Review -> Action -> Measure
   ========================================================================== */

export type SignalType =
  | "Breakout Signal"
  | "Momentum Signal"
  | "Engagement Signal"
  | "Retention Signal"
  | "Completion Signal"
  | "Interactive Signal"
  | "Character Signal"
  | "Creator Signal"
  | "Discovery Signal"
  | "Drop-off Signal"
  | "Opportunity Signal"
  | "Review Signal";

export type SignalStrength = "Emerging" | "Moderate" | "Strong";

export type OpportunityType =
  | "Story Expansion"
  | "Character Opportunity"
  | "Interactive Opportunity"
  | "Creator Opportunity"
  | "Genre Opportunity"
  | "Audience Opportunity"
  | "Discovery Opportunity"
  | "Retention Opportunity";

export type OpportunityStatus =
  | "Open Review"
  | "Under Investigation"
  | "Action Planned"
  | "Dismissed";

export type ExperimentStatus =
  | "Draft"
  | "Running"
  | "Completed"
  | "Paused"
  | "Archived";

export interface SupportingMetrics {
  episodesCount: number;
  viewersCount: string;
  interactionsCount: string;
  dataWindowDays: number;
  sampleDescription: string;
}

export interface StorySignal {
  id: string;
  storyId: string;
  storyTitle: string;
  storySlug: string;
  poster: string;
  creatorName: string;
  creatorId: string;
  genre: string;
  type: SignalType;
  strength: SignalStrength;
  title: string;
  observation: string;
  possibleInterpretation: string;
  suggestedInvestigation: string;
  supportingMetrics: SupportingMetrics;
  timePeriod: string;
  timestamp: string;
  keyMetric: string;
  metricLabel: string;
  direction: "up" | "down" | "neutral";
  changeValue: string;
  interactive?: boolean;
}

export interface EpisodeFunnelNode {
  episodeNumber: number;
  episode?: string;
  episodeTitle: string;
  title?: string;
  completionRate: number; // percentage
  completionPercentage?: number;
  dropOffRate: number; // percentage drop from previous
  viewers: string;
  viewerCount?: string;
  isChoice?: boolean;
  choiceQuestion?: string;
  pathA?: { label: string; percentage: number; nextCompletion: number };
  pathB?: { label: string; percentage: number; nextCompletion: number };
}

export interface StoryIntelligence {
  id: string;
  title: string;
  storyTitle?: string;
  slug: string;
  creatorName: string;
  creatorId: string;
  genre: string;
  language: string;
  status: "Published" | "In Review" | "Active" | "Archived";
  episodes: number;
  episodesCount?: number;
  interactive: boolean;
  views: string;
  totalViews?: string;
  viewsNumber: number;
  uniqueViewers: string;
  completionRate: string;
  completionNumber: number;
  watchTime: string;
  avgWatchTimeMinutes: string;
  engagement: string;
  returningViewers: string;
  shares: string;
  followersGenerated: string | number;
  interactiveParticipation: string;
  primarySignal: SignalType;
  signalStrength: SignalStrength;
  signalsCount: number;
  releasePeriod?: string;
  signals: StorySignal[];
  healthSignals: {
    title: string;
    description: string;
    supportingData: string;
    type: "positive" | "warning" | "neutral";
  }[];
  funnel: EpisodeFunnelNode[];
  largestObservedDrop: {
    fromEpisode: string;
    toEpisode: string;
    dropPercentage: number;
    observation: string;
    possibleInterpretation: string;
    suggestedInvestigation: string;
  };
  poster: string;
}

export interface CharacterSignal {
  id: string;
  characterName: string;
  avatar: string;
  storyId: string;
  storyTitle: string;
  storySlug: string;
  creatorName: string;
  role: string;
  followers: string;
  followersNumber: number;
  followerGrowth: string;
  followerGrowthNumber: number;
  episodesAppeared: number;
  shares: string;
  choiceAssociation: string;
  signalType: SignalType;
  signalStrength: SignalStrength;
  observation: string;
  potentialOpportunity: string;
  momentumTimeline: {
    milestone: string;
    detail: string;
    date: string;
  }[];
}

export interface CreatorSignal {
  id: string;
  creatorName: string;
  creatorId: string;
  username: string;
  avatar: string;
  category: string;
  recentStories: number;
  views: string;
  completion: string;
  engagement: string;
  followerGrowth: string;
  signalType: SignalType;
  signalStrength: SignalStrength;
  observation: string;
  suggestedAction: string;
}

export interface InteractiveSignalItem {
  id: string;
  storyTitle: string;
  storySlug: string;
  episodeTitle: string;
  episodeNumber: number;
  choiceQuestion: string;
  participationRate: string;
  totalVotes: string;
  completionAfterChoice: string;
  returnRate: string;
  optionA: {
    label: string;
    percentage: number;
    votes: string;
    postChoiceCompletion: string;
  };
  optionB: {
    label: string;
    percentage: number;
    votes: string;
    postChoiceCompletion: string;
  };
  observedPathDifference: string;
  signalType: SignalType;
  signalStrength: SignalStrength;
  suggestedInvestigation: string;
}

export interface ContentOpportunity {
  id: string;
  title: string;
  type: OpportunityType;
  storyId?: string;
  storyTitle?: string;
  characterName?: string;
  creatorName?: string;
  signal: string;
  observation: string;
  possibleOpportunity: string;
  supportingData: string;
  status: OpportunityStatus;
  priority: "High" | "Medium" | "Routine";
  createdAt: string;
  reviewerNotes?: string;
}

export interface StoryExperiment {
  id: string;
  name: string;
  storyTitle: string;
  storyId: string;
  episode: string;
  hypothesis: string;
  variable: string;
  controlCondition: string;
  variantCondition: string;
  metrics: {
    label: string;
    controlValue: string;
    variantValue: string;
    difference: string;
  }[];
  startDate: string;
  endDate: string;
  owner: string;
  status: ExperimentStatus;
  sampleSize: string;
  summaryNote: string;
}

/* ==========================================================================
   MOCK DATASETS
   ========================================================================== */

export const storyLabEcosystemKPIs = {
  storiesAnalysed: 38,
  activeStories: 24,
  breakoutSignals: 6,
  storiesNeedingReview: 4,
  interactiveStories: 14,
  activeExperiments: 5,
  totalWatchTime: "42.8M min",
  averageCompletion: "68.4%",
  interactiveParticipation: "52.1%",
  returningViewers: "64.2%",
  storyShares: "186K",
  characterFollows: "412K",
};

export const storyEcosystemSnapshot = [
  {
    title: "Audience Engagement",
    currentValue: "88.6%",
    previousPeriod: "82.4%",
    directionalChange: "↑ 6.2%",
    observation: "Session length and repeat viewing across vertical stories showed steady expansion over the past 30 days.",
    type: "positive" as const,
  },
  {
    title: "Story Completion",
    currentValue: "68.4%",
    previousPeriod: "61.2%",
    directionalChange: "↑ 7.2%",
    observation: "Pacing adjustments in early episodes contributed to higher continuation into middle episodes.",
    type: "positive" as const,
  },
  {
    title: "Interactive Participation",
    currentValue: "52.1%",
    previousPeriod: "40.1%",
    directionalChange: "↑ 12.0%",
    observation: "Audience decision participation increased notably across stories featuring time-sensitive cliffhanger choices.",
    type: "positive" as const,
  },
  {
    title: "Character Engagement",
    currentValue: "+38.4%",
    previousPeriod: "+24.1%",
    directionalChange: "↑ 14.3%",
    observation: "Protagonist and antagonist profile followings expanded significantly following high-stakes episode climaxes.",
    type: "positive" as const,
  },
  {
    title: "Creator Momentum",
    currentValue: "9 Creators",
    previousPeriod: "5 Creators",
    directionalChange: "↑ 80%",
    observation: "Multiple independent creators demonstrated breakout multi-episode retention on newly released interactive arcs.",
    type: "positive" as const,
  },
  {
    title: "Content Discovery",
    currentValue: "44% Organic",
    previousPeriod: "36% Organic",
    directionalChange: "↑ 8.0%",
    observation: "Peer sharing and social clips became stronger entry points compared to homepage browsing.",
    type: "positive" as const,
  },
];

export const storySignalsData: StorySignal[] = [
  {
    id: "sig-01",
    storyId: "st-phone",
    storyTitle: "The Missing Phone",
    storySlug: "the-missing-phone",
    poster: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&auto=format&fit=crop&q=80",
    creatorName: "Arjun Mehta",
    creatorId: "cr-arjun-01",
    genre: "Thriller",
    type: "Breakout Signal",
    strength: "Strong",
    title: "High multi-episode retention with interactive surge",
    observation: "Episode 1 to Episode 3 retention exceeds genre benchmark by 18%. Interactive choices show 64% direct participation.",
    possibleInterpretation: "The tactile mobile-interface premise creates intuitive viewer investment and organic cliffhangers.",
    suggestedInvestigation: "Review Episode 4 branch transitions and evaluate spin-off potential for secondary protagonist Aarav.",
    supportingMetrics: {
      episodesCount: 6,
      viewersCount: "1.8M",
      interactionsCount: "820K",
      dataWindowDays: 30,
      sampleDescription: "Measured across 1.8M unique starts with 64% choice engagement.",
    },
    timePeriod: "Last 30 Days",
    timestamp: "Today, 09:30 AM",
    keyMetric: "74% Completion",
    metricLabel: "Series Completion",
    direction: "up",
    changeValue: "+18%",
    interactive: true,
  },
  {
    id: "sig-02",
    storyId: "st-tomorrow",
    storyTitle: "Messages From Tomorrow",
    storySlug: "messages-from-tomorrow",
    poster: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    creatorName: "Kabir Rao",
    creatorId: "cr-kabir-03",
    genre: "Mystery / Drama",
    type: "Engagement Signal",
    strength: "Strong",
    title: "Elevated watch time and repeat viewer loops",
    observation: "Average watch time per user reaches 14m 20s. Over 32% of audience replay choices to view alternate story nodes.",
    possibleInterpretation: "Branching timelines encourage audience speculation and discussion in social groups.",
    suggestedInvestigation: "Inspect audience return patterns between Path A and Path B to determine narrative hook efficacy.",
    supportingMetrics: {
      episodesCount: 8,
      viewersCount: "2.4M",
      interactionsCount: "1.1M",
      dataWindowDays: 30,
      sampleDescription: "Validated over 2.4M viewers with 32% alternate path replays.",
    },
    timePeriod: "Last 30 Days",
    timestamp: "Yesterday, 04:15 PM",
    keyMetric: "14m 20s",
    metricLabel: "Avg Session Duration",
    direction: "up",
    changeValue: "+24%",
    interactive: true,
  },
  {
    id: "sig-03",
    storyId: "st-train",
    storyTitle: "Last Train Home",
    storySlug: "last-train-home",
    poster: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=80",
    creatorName: "Meera Sharma",
    creatorId: "cr-meera-04",
    genre: "Drama",
    type: "Review Signal",
    strength: "Moderate",
    title: "Noticeable drop-off identified at Episode 3 transition",
    observation: "Episode 1 has an 86% completion rate, but continuation drops to 51% upon entering Episode 3.",
    possibleInterpretation: "A sudden tonal shift or delayed conflict resolution may be interrupting initial narrative pacing.",
    suggestedInvestigation: "Review Episode 3 cold open, dialogue pacing, and hook placement prior to commissioning Season 2.",
    supportingMetrics: {
      episodesCount: 5,
      viewersCount: "850K",
      interactionsCount: "120K",
      dataWindowDays: 14,
      sampleDescription: "Observed across 850K viewers with steep mid-series attrition.",
    },
    timePeriod: "Last 14 Days",
    timestamp: "Today, 08:00 AM",
    keyMetric: "-35% Drop",
    metricLabel: "Ep 2 → Ep 3 Retention",
    direction: "down",
    changeValue: "-35%",
    interactive: false,
  },
  {
    id: "sig-04",
    storyId: "st-message",
    storyTitle: "One More Message",
    storySlug: "one-more-message",
    poster: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    creatorName: "Priya Nair",
    creatorId: "cr-priya-02",
    genre: "Romance",
    type: "Momentum Signal",
    strength: "Strong",
    title: "Accelerating character affinity and organic sharing",
    observation: "Character 'Riya' generates +42% follower growth. Episode clips shared 38,000 times outside the app.",
    possibleInterpretation: "Emotional relatability and high-chemistry dialogue drive personal recommendations.",
    suggestedInvestigation: "Evaluate supplementary character journal shorts or interactive companion side-stories.",
    supportingMetrics: {
      episodesCount: 4,
      viewersCount: "1.1M",
      interactionsCount: "340K",
      dataWindowDays: 30,
      sampleDescription: "Tracked across 1.1M viewers and 38K outbound shares.",
    },
    timePeriod: "Last 30 Days",
    timestamp: "2 days ago",
    keyMetric: "78% Completion",
    metricLabel: "Overall Completion",
    direction: "up",
    changeValue: "+15%",
    interactive: true,
  },
  {
    id: "sig-05",
    storyId: "st-mumbai",
    storyTitle: "Mumbai Underground",
    storySlug: "mumbai-underground",
    poster: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&auto=format&fit=crop&q=80",
    creatorName: "Vikramaditya",
    creatorId: "cr-vikram-05",
    genre: "Crime / Thriller",
    type: "Retention Signal",
    strength: "Moderate",
    title: "Strong late-night viewing and day-over-day return",
    observation: "72% of audience watches between 10 PM and 1 AM. D7 return rate reaches 64%.",
    possibleInterpretation: "Nocturnal thriller atmosphere aligns well with late-night binge behavior.",
    suggestedInvestigation: "Test late-evening push notification timing for future episode releases.",
    supportingMetrics: {
      episodesCount: 6,
      viewersCount: "1.6M",
      interactionsCount: "520K",
      dataWindowDays: 30,
      sampleDescription: "Analyzed across 1.6M viewers with 72% night watch bias.",
    },
    timePeriod: "Last 30 Days",
    timestamp: "3 days ago",
    keyMetric: "64% D7",
    metricLabel: "Day 7 Return Rate",
    direction: "up",
    changeValue: "+9%",
    interactive: false,
  },
  {
    id: "sig-06",
    storyId: "st-echoes",
    storyTitle: "Parallel Echoes",
    storySlug: "parallel-echoes",
    poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    creatorName: "Aisha Patel",
    creatorId: "cr-aisha-06",
    genre: "Sci-Fi / Drama",
    type: "Interactive Signal",
    strength: "Emerging",
    title: "Branch divergence creates polarized path retention",
    observation: "Path A retains 68% into the finale, while Path B drops to 39% before the climax.",
    possibleInterpretation: "Path B's narrative stakes may feel unresolved or excessively abrupt.",
    suggestedInvestigation: "Open Story Builder to analyze Node 4B's transition and bridge connections.",
    supportingMetrics: {
      episodesCount: 6,
      viewersCount: "920K",
      interactionsCount: "410K",
      dataWindowDays: 7,
      sampleDescription: "Emerging signal based on 7 days of live branching data.",
    },
    timePeriod: "Last 7 Days",
    timestamp: "4 days ago",
    keyMetric: "29pp Diff",
    metricLabel: "Branch Retention Gap",
    direction: "down",
    changeValue: "-29pp",
    interactive: true,
  },
];

export const storyIntelligenceDatabase: StoryIntelligence[] = [
  {
    id: "st-phone",
    title: "The Missing Phone",
    slug: "the-missing-phone",
    creatorName: "Arjun Mehta",
    creatorId: "cr-arjun-01",
    genre: "Thriller",
    language: "Hindi / Hinglish",
    status: "Published",
    episodes: 6,
    interactive: true,
    views: "1.8M",
    viewsNumber: 1800000,
    uniqueViewers: "1.42M",
    completionRate: "74%",
    completionNumber: 74,
    watchTime: "4.8M min",
    avgWatchTimeMinutes: "8m 45s",
    engagement: "91.2%",
    returningViewers: "68.5%",
    shares: "54.2K",
    followersGenerated: "42.8K",
    interactiveParticipation: "64.1%",
    primarySignal: "Breakout Signal",
    signalStrength: "Strong",
    signalsCount: 4,
    poster: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&auto=format&fit=crop&q=80",
    signals: storySignalsData.filter((s) => s.storyId === "st-phone"),
    healthSignals: [
      {
        title: "Strong completion through Episode 2",
        description: "91% of viewers who complete Episode 1 continue through Episode 2 without leaving the app.",
        supportingData: "Measured across 1.62M episode transitions.",
        type: "positive",
      },
      {
        title: "Choice participation peaks at Episode 3",
        description: "64% of active episode viewers engage with the critical choice point 'Do you unlock the gallery?'.",
        supportingData: "24,820 live votes cast during monitored window.",
        type: "positive",
      },
      {
        title: "Character 'Aarav' shows rapid follower growth",
        description: "Aarav gained +34% followers within 72 hours of Episode 3 release.",
        supportingData: "Top character follow velocity across platform thriller genre.",
        type: "positive",
      },
      {
        title: "Episode 4B has lower completion than Episode 4A",
        description: "Path A achieves 52% full arc completion while Path B falls to 41%.",
        supportingData: "Observed gap of 11 percentage points between branches.",
        type: "warning",
      },
    ],
    funnel: [
      {
        episodeNumber: 1,
        episodeTitle: "Found Object",
        completionRate: 100,
        dropOffRate: 0,
        viewers: "1.80M",
      },
      {
        episodeNumber: 2,
        episodeTitle: "Unknown Sender",
        completionRate: 82,
        dropOffRate: 18,
        viewers: "1.48M",
      },
      {
        episodeNumber: 3,
        episodeTitle: "The Password",
        completionRate: 71,
        dropOffRate: 11,
        viewers: "1.28M",
        isChoice: true,
        choiceQuestion: "Do you unlock the hidden gallery or power off the phone?",
        pathA: { label: "Unlock Gallery", percentage: 72, nextCompletion: 52 },
        pathB: { label: "Power Off", percentage: 28, nextCompletion: 41 },
      },
      {
        episodeNumber: 4,
        episodeTitle: "Branch A: The Vault / Branch B: Dark Corridor",
        completionRate: 58,
        dropOffRate: 13,
        viewers: "1.04M",
      },
      {
        episodeNumber: 5,
        episodeTitle: "Point of No Return",
        completionRate: 51,
        dropOffRate: 7,
        viewers: "918K",
      },
      {
        episodeNumber: 6,
        episodeTitle: "Final Reveal",
        completionRate: 46,
        dropOffRate: 5,
        viewers: "828K",
      },
    ],
    largestObservedDrop: {
      fromEpisode: "Episode 3",
      toEpisode: "Episode 4B",
      dropPercentage: 30,
      observation: "Viewers who selected Option B ('Power Off') experienced a 30% drop before reaching Episode 5.",
      possibleInterpretation: "Powering off the device creates narrative downtime with fewer active stakes than the Gallery branch.",
      suggestedInvestigation: "Review Episode 4B opening pacing and introduce an urgent counter-threat earlier in the branch.",
    },
  },
  {
    id: "st-tomorrow",
    title: "Messages From Tomorrow",
    slug: "messages-from-tomorrow",
    creatorName: "Kabir Rao",
    creatorId: "cr-kabir-03",
    genre: "Mystery / Drama",
    language: "English / Hindi",
    status: "Published",
    episodes: 8,
    interactive: true,
    views: "2.4M",
    viewsNumber: 2400000,
    uniqueViewers: "1.88M",
    completionRate: "68%",
    completionNumber: 68,
    watchTime: "6.2M min",
    avgWatchTimeMinutes: "14m 20s",
    engagement: "94.0%",
    returningViewers: "72.4%",
    shares: "86.1K",
    followersGenerated: "64.5K",
    interactiveParticipation: "71.2%",
    primarySignal: "Engagement Signal",
    signalStrength: "Strong",
    signalsCount: 5,
    poster: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    signals: storySignalsData.filter((s) => s.storyId === "st-tomorrow"),
    healthSignals: [
      {
        title: "Exceptional repeat viewing rate",
        description: "32% of audience replay choices to view alternate story nodes.",
        supportingData: "Measured across 2.4M viewers with high re-engagement.",
        type: "positive",
      },
      {
        title: "Social discussion coefficient",
        description: "Community choice debates generate 4.8 comments per viewer on average.",
        supportingData: "Top social discussion volume in Q3.",
        type: "positive",
      },
    ],
    funnel: [
      { episodeNumber: 1, episodeTitle: "The Ping", completionRate: 100, dropOffRate: 0, viewers: "2.40M" },
      { episodeNumber: 2, episodeTitle: "Tomorrow's News", completionRate: 88, dropOffRate: 12, viewers: "2.11M" },
      { episodeNumber: 3, episodeTitle: "First Warning", completionRate: 80, dropOffRate: 8, viewers: "1.92M" },
      { episodeNumber: 4, episodeTitle: "The Intersection", completionRate: 74, dropOffRate: 6, viewers: "1.77M" },
      { episodeNumber: 5, episodeTitle: "Future Echoes", completionRate: 68, dropOffRate: 6, viewers: "1.63M" },
    ],
    largestObservedDrop: {
      fromEpisode: "Episode 1",
      toEpisode: "Episode 2",
      dropPercentage: 12,
      observation: "First episode shows high initial retention with modest standard transition drop.",
      possibleInterpretation: "Premise establishes clarity early, maintaining consistent audience continuity.",
      suggestedInvestigation: "Monitor long-term completion through episode 8.",
    },
  },
  {
    id: "st-train",
    title: "Last Train Home",
    slug: "last-train-home",
    creatorName: "Meera Sharma",
    creatorId: "cr-meera-04",
    genre: "Drama",
    language: "Hindi",
    status: "Published",
    episodes: 5,
    interactive: false,
    views: "850K",
    viewsNumber: 850000,
    uniqueViewers: "680K",
    completionRate: "51%",
    completionNumber: 51,
    watchTime: "1.9M min",
    avgWatchTimeMinutes: "6m 10s",
    engagement: "71.4%",
    returningViewers: "48.2%",
    shares: "12.4K",
    followersGenerated: "14.2K",
    interactiveParticipation: "N/A",
    primarySignal: "Review Signal",
    signalStrength: "Moderate",
    signalsCount: 3,
    poster: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=80",
    signals: storySignalsData.filter((s) => s.storyId === "st-train"),
    healthSignals: [
      {
        title: "Strong premiere hook",
        description: "Episode 1 registers 86% watch completion, indicating compelling premise hook.",
        supportingData: "850K unique starts.",
        type: "positive",
      },
      {
        title: "Severe cliffhanger drop at Episode 3",
        description: "Continuation falls sharply from 76% to 51% upon entering Episode 3.",
        supportingData: "Drop is 14% higher than genre median.",
        type: "warning",
      },
    ],
    funnel: [
      { episodeNumber: 1, episodeTitle: "Platform 4", completionRate: 100, dropOffRate: 0, viewers: "850K" },
      { episodeNumber: 2, episodeTitle: "Midnight Ticket", completionRate: 86, dropOffRate: 14, viewers: "731K" },
      { episodeNumber: 3, episodeTitle: "Passing Stations", completionRate: 51, dropOffRate: 35, viewers: "433K" },
      { episodeNumber: 4, episodeTitle: "Empty Carriage", completionRate: 46, dropOffRate: 5, viewers: "391K" },
      { episodeNumber: 5, episodeTitle: "Final Stop", completionRate: 42, dropOffRate: 4, viewers: "357K" },
    ],
    largestObservedDrop: {
      fromEpisode: "Episode 2",
      toEpisode: "Episode 3",
      dropPercentage: 35,
      observation: "Sharp drop-off between Episode 2 cliffhanger and Episode 3 intro.",
      possibleInterpretation: "Pacing decelerates significantly in Episode 3 with long contemplative shots that test mobile short-form attention spans.",
      suggestedInvestigation: "Review Episode 3 edit to tighten conversation pauses and re-establish immediate stakes.",
    },
  },
  {
    id: "st-message",
    title: "One More Message",
    slug: "one-more-message",
    creatorName: "Priya Nair",
    creatorId: "cr-priya-02",
    genre: "Romance",
    language: "Hinglish",
    status: "Published",
    episodes: 4,
    interactive: true,
    views: "1.1M",
    viewsNumber: 1100000,
    uniqueViewers: "920K",
    completionRate: "78%",
    completionNumber: 78,
    watchTime: "2.8M min",
    avgWatchTimeMinutes: "7m 50s",
    engagement: "89.4%",
    returningViewers: "66.8%",
    shares: "38.2K",
    followersGenerated: "36.4K",
    interactiveParticipation: "58.4%",
    primarySignal: "Momentum Signal",
    signalStrength: "Strong",
    signalsCount: 4,
    poster: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    signals: storySignalsData.filter((s) => s.storyId === "st-message"),
    healthSignals: [
      {
        title: "High organic share coefficient",
        description: "1 in 28 viewers shares a clip or choice result on messaging platforms.",
        supportingData: "38,200 shared links tracked.",
        type: "positive",
      },
      {
        title: "Rapid character following velocity",
        description: "Lead character Riya gained 34K followers in under a month.",
        supportingData: "+42% follower expansion.",
        type: "positive",
      },
    ],
    funnel: [
      { episodeNumber: 1, episodeTitle: "Read Receipt", completionRate: 100, dropOffRate: 0, viewers: "1.10M" },
      { episodeNumber: 2, episodeTitle: "Typing...", completionRate: 89, dropOffRate: 11, viewers: "979K" },
      { episodeNumber: 3, episodeTitle: "Drafts", completionRate: 82, dropOffRate: 7, viewers: "902K" },
      { episodeNumber: 4, episodeTitle: "Send", completionRate: 78, dropOffRate: 4, viewers: "858K" },
    ],
    largestObservedDrop: {
      fromEpisode: "Episode 1",
      toEpisode: "Episode 2",
      dropPercentage: 11,
      observation: "Minimal attrition across the 4-episode arc.",
      possibleInterpretation: "Compact 4-episode structure creates effortless binge momentum.",
      suggestedInvestigation: "Explore commissioning extended second arc with creator Priya Nair.",
    },
  },
];

export const characterSignalsData: CharacterSignal[] = [
  {
    id: "cs-01",
    characterName: "Aarav",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
    storyId: "st-phone",
    storyTitle: "The Missing Phone",
    storySlug: "the-missing-phone",
    creatorName: "Arjun Mehta",
    role: "Reluctant Protagonist",
    followers: "148K",
    followersNumber: 148000,
    followerGrowth: "+34%",
    followerGrowthNumber: 34,
    episodesAppeared: 6,
    shares: "42.8K",
    choiceAssociation: "Critical Node 3 & 4A",
    signalType: "Character Signal",
    signalStrength: "Strong",
    observation: "Rapid follower acceleration (+34%) immediately following Episode 3's moral crisis.",
    potentialOpportunity: "Review potential for character-centric companion miniseries or prequel arc.",
    momentumTimeline: [
      { milestone: "Episode 1 Debut", detail: "Initial baseline of 12K followers upon pilot launch.", date: "15 Aug 2026" },
      { milestone: "Episode 2 Interaction", detail: "Viewer engagement rises after moral stance revealed.", date: "22 Aug 2026" },
      { milestone: "Episode 3 Climax", detail: "Follower growth surges +34% following high-stakes choice.", date: "29 Aug 2026" },
      { milestone: "Choice Association", detail: "72% of audience aligned with Aarav's suggested moral path.", date: "05 Sep 2026" },
    ],
  },
  {
    id: "cs-02",
    characterName: "Maya",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    storyId: "st-tomorrow",
    storyTitle: "Messages From Tomorrow",
    storySlug: "messages-from-tomorrow",
    creatorName: "Kabir Rao",
    role: "Time-Displaced Guide",
    followers: "192K",
    followersNumber: 192000,
    followerGrowth: "+28%",
    followerGrowthNumber: 28,
    episodesAppeared: 8,
    shares: "56.4K",
    choiceAssociation: "Time Paradox Choices",
    signalType: "Character Signal",
    signalStrength: "Strong",
    observation: "Highest quote and dialogue share rate across the platform's mystery catalog.",
    potentialOpportunity: "Evaluate interactive standalone puzzle episodes narrated from Maya's perspective.",
    momentumTimeline: [
      { milestone: "Mystery Intro", detail: "Audio-only debut in Episode 1 generated intrigue.", date: "01 Sep 2026" },
      { milestone: "Visual Reveal", detail: "Episode 3 reveal doubled profile visit velocity.", date: "08 Sep 2026" },
      { milestone: "Key Branch", detail: "Maya's warnings influenced 68% of community branch votes.", date: "15 Sep 2026" },
    ],
  },
  {
    id: "cs-03",
    characterName: "Riya",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    storyId: "st-message",
    storyTitle: "One More Message",
    storySlug: "one-more-message",
    creatorName: "Priya Nair",
    role: "Romantic Lead",
    followers: "86K",
    followersNumber: 86000,
    followerGrowth: "+42%",
    followerGrowthNumber: 42,
    episodesAppeared: 4,
    shares: "34.1K",
    choiceAssociation: "Confession Decision Point",
    signalType: "Character Signal",
    signalStrength: "Strong",
    observation: "Unusually high direct character following conversion (31% of total series viewers).",
    potentialOpportunity: "Consider expanding creator Priya Nair's relationship universe around this character.",
    momentumTimeline: [
      { milestone: "Pilot Launch", detail: "Immediate organic reception to opening monologue.", date: "05 Sep 2026" },
      { milestone: "Episode 4 Climax", detail: "Highest fan reaction velocity in romance category.", date: "18 Sep 2026" },
    ],
  },
  {
    id: "cs-04",
    characterName: "Siddharth",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    storyId: "st-train",
    storyTitle: "Last Train Home",
    storySlug: "last-train-home",
    creatorName: "Meera Sharma",
    role: "The Commuter",
    followers: "32K",
    followersNumber: 32000,
    followerGrowth: "+8%",
    followerGrowthNumber: 8,
    episodesAppeared: 5,
    shares: "8.2K",
    choiceAssociation: "Non-interactive Story",
    signalType: "Review Signal",
    signalStrength: "Emerging",
    observation: "Follower growth plateaued after Episode 2 in correlation with overall audience drop.",
    potentialOpportunity: "Investigate whether character motivation clarity in Episode 3 impacted viewer affinity.",
    momentumTimeline: [
      { milestone: "Debut", detail: "Consistent initial follows on premiere night.", date: "10 Sep 2026" },
      { milestone: "Plateau", detail: "Growth flattened sharply after Episode 3 release.", date: "17 Sep 2026" },
    ],
  },
];

export const creatorSignalsData: CreatorSignal[] = [
  {
    id: "crs-01",
    creatorName: "Arjun Mehta",
    creatorId: "cr-arjun-01",
    username: "@arjunstories",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    category: "Thriller",
    recentStories: 4,
    views: "1.8M",
    completion: "74%",
    engagement: "91.2%",
    followerGrowth: "+24%",
    signalType: "Creator Signal",
    signalStrength: "Strong",
    observation: "Recent interactive stories show rising completion rates (+14% over baseline) and strong audience choice engagement.",
    suggestedAction: "Schedule review to discuss multi-season development contract.",
  },
  {
    id: "crs-02",
    creatorName: "Kabir Rao",
    creatorId: "cr-kabir-03",
    username: "@kabirverse",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    category: "Mystery",
    recentStories: 6,
    views: "2.4M",
    completion: "68%",
    engagement: "94.0%",
    followerGrowth: "+31%",
    signalType: "Creator Signal",
    signalStrength: "Strong",
    observation: "Demonstrates consistent high watch time and strong repeat branch exploration across his series catalog.",
    suggestedAction: "Explore pairing with advanced Interactive Story Builder features.",
  },
  {
    id: "crs-03",
    creatorName: "Priya Nair",
    creatorId: "cr-priya-02",
    username: "@priyawrites",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    category: "Romance",
    recentStories: 3,
    views: "1.1M",
    completion: "78%",
    engagement: "89.4%",
    followerGrowth: "+38%",
    signalType: "Momentum Signal",
    signalStrength: "Strong",
    observation: "Fastest organic fan growth in the romance category with top social share conversion.",
    suggestedAction: "Review creator proposal for holiday mini-series.",
  },
  {
    id: "crs-04",
    creatorName: "Meera Sharma",
    creatorId: "cr-meera-04",
    username: "@meerastories",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
    category: "Drama",
    recentStories: 2,
    views: "850K",
    completion: "51%",
    engagement: "71.4%",
    followerGrowth: "+6%",
    signalType: "Review Signal",
    signalStrength: "Moderate",
    observation: "Strong concept generation but requires editorial support on middle-episode pacing and hook structure.",
    suggestedAction: "Offer editorial story workshop prior to next series submission.",
  },
];

export const interactiveSignalsData: InteractiveSignalItem[] = [
  {
    id: "int-01",
    storyTitle: "The Missing Phone",
    storySlug: "the-missing-phone",
    episodeTitle: "Episode 3: The Password",
    episodeNumber: 3,
    choiceQuestion: "Do you unlock the hidden gallery or power off the phone?",
    participationRate: "64.1%",
    totalVotes: "24,820",
    completionAfterChoice: "61%",
    returnRate: "54%",
    optionA: {
      label: "Unlock Gallery",
      percentage: 72,
      votes: "17,870",
      postChoiceCompletion: "58%",
    },
    optionB: {
      label: "Power Off Phone",
      percentage: 28,
      votes: "6,950",
      postChoiceCompletion: "43%",
    },
    observedPathDifference: "Path A leads to a 15 percentage point higher completion rate into Episode 5 compared to Path B.",
    signalType: "Interactive Signal",
    signalStrength: "Strong",
    suggestedInvestigation: "Investigate whether Path B's narrative stakes lack immediate tension after the phone is switched off.",
  },
  {
    id: "int-02",
    storyTitle: "Messages From Tomorrow",
    storySlug: "messages-from-tomorrow",
    episodeTitle: "Episode 4: The Intersection",
    episodeNumber: 4,
    choiceQuestion: "Warn the driver or document the event?",
    participationRate: "71.2%",
    totalVotes: "38,400",
    completionAfterChoice: "74%",
    returnRate: "68%",
    optionA: {
      label: "Warn Driver",
      percentage: 63,
      votes: "24,192",
      postChoiceCompletion: "76%",
    },
    optionB: {
      label: "Document Event",
      percentage: 37,
      votes: "14,208",
      postChoiceCompletion: "71%",
    },
    observedPathDifference: "Both branches maintain balanced retention within 5 percentage points, showing high parity.",
    signalType: "Engagement Signal",
    signalStrength: "Strong",
    suggestedInvestigation: "Examine this node as a positive benchmark for branch parity in story design.",
  },
  {
    id: "int-03",
    storyTitle: "Parallel Echoes",
    storySlug: "parallel-echoes",
    episodeTitle: "Episode 3: The Quantum Leap",
    episodeNumber: 3,
    choiceQuestion: "Enter Portal A (Future) or Portal B (Past)?",
    participationRate: "52.8%",
    totalVotes: "18,200",
    completionAfterChoice: "53%",
    returnRate: "48%",
    optionA: {
      label: "Portal A (Future)",
      percentage: 58,
      votes: "10,556",
      postChoiceCompletion: "68%",
    },
    optionB: {
      label: "Portal B (Past)",
      percentage: 42,
      votes: "7,644",
      postChoiceCompletion: "39%",
    },
    observedPathDifference: "Path B exhibits a 29 percentage point drop in finale completion.",
    signalType: "Drop-off Signal",
    signalStrength: "Moderate",
    suggestedInvestigation: "Review Episode 4B cold open in Story Builder to identify pacing friction.",
  },
];

export const audienceSignalsData = {
  genres: [
    { genre: "Thriller", views: "14.2M", viewGrowth: "+24%", completion: "72%", watchTime: "24.8M min", interactiveParticipation: "62%", shares: "84K" },
    { genre: "Drama", views: "18.6M", viewGrowth: "+12%", completion: "64%", watchTime: "36.2M min", interactiveParticipation: "44%", shares: "92K" },
    { genre: "Romance", views: "12.8M", viewGrowth: "+31%", completion: "76%", watchTime: "21.4M min", interactiveParticipation: "58%", shares: "76K" },
    { genre: "Mystery", views: "9.4M", viewGrowth: "+19%", completion: "69%", watchTime: "18.1M min", interactiveParticipation: "71%", shares: "64K" },
    { genre: "Comedy", views: "6.2M", viewGrowth: "+8%", completion: "58%", watchTime: "9.2M min", interactiveParticipation: "38%", shares: "29K" },
  ],
  moods: [
    { mood: "Suspense", views: "11.4M", completion: "74%", sessionStarts: "4.8M", returningViewers: "68%" },
    { mood: "Feel Good", views: "8.6M", completion: "71%", sessionStarts: "3.2M", returningViewers: "62%" },
    { mood: "Romance", views: "7.9M", completion: "78%", sessionStarts: "2.9M", returningViewers: "66%" },
    { mood: "Fast Paced", views: "9.1M", completion: "69%", sessionStarts: "3.6M", returningViewers: "64%" },
    { mood: "Emotional", views: "5.4M", completion: "65%", sessionStarts: "2.1M", returningViewers: "58%" },
    { mood: "Mystery", views: "6.8M", completion: "70%", sessionStarts: "2.7M", returningViewers: "67%" },
  ],
  languages: [
    { language: "Hindi", audienceShare: "46%", completion: "71%", watchTime: "48.2M min", engagement: "88%" },
    { language: "English / Hinglish", audienceShare: "28%", completion: "74%", watchTime: "32.4M min", engagement: "91%" },
    { language: "Telugu", audienceShare: "12%", completion: "68%", watchTime: "14.6M min", engagement: "84%" },
    { language: "Tamil", audienceShare: "8%", completion: "66%", watchTime: "10.2M min", engagement: "82%" },
    { language: "Kannada", audienceShare: "4%", completion: "63%", watchTime: "5.1M min", engagement: "79%" },
    { language: "Malayalam", audienceShare: "2%", completion: "69%", watchTime: "3.2M min", engagement: "86%" },
  ],
  discoverySources: [
    { source: "Home Feed", starts: "42%", completion: "66%", followConversion: "18%", shareConversion: "6%" },
    { source: "Direct Shared Link", starts: "22%", completion: "78%", followConversion: "29%", shareConversion: "14%" },
    { source: "Browse Catalog", starts: "16%", completion: "62%", followConversion: "14%", shareConversion: "4%" },
    { source: "Creator Profile", starts: "11%", completion: "81%", followConversion: "38%", shareConversion: "12%" },
    { source: "In-App Search", starts: "6%", completion: "69%", followConversion: "21%", shareConversion: "7%" },
    { source: "Push Notifications", starts: "3%", completion: "74%", followConversion: "24%", shareConversion: "9%" },
  ],
};

export const contentOpportunitiesData: ContentOpportunity[] = [
  {
    id: "opp-01",
    title: "Expand 'The Missing Phone' universe with an Aarav spin-off",
    type: "Story Expansion",
    storyId: "st-phone",
    storyTitle: "The Missing Phone",
    characterName: "Aarav",
    creatorName: "Arjun Mehta",
    signal: "Strong completion (74%) + Rapid character growth (+34%)",
    observation: "Aarav has become the fastest-growing character in the thriller category, driving discussion in episode 3 choices.",
    possibleOpportunity: "Explore commissioning a 4-episode prequel or standalone side-quest centered around Aarav's cybersecurity background.",
    supportingData: "1.8M total views, 148K character follows, 72% choice alignment.",
    status: "Open Review",
    priority: "High",
    createdAt: "24 Sep 2026",
    reviewerNotes: "Arjun Mehta has indicated interest in developing companion shorts. Review script outline in next editorial cycle.",
  },
  {
    id: "opp-02",
    title: "Address Episode 3 Drop-off in 'Last Train Home'",
    type: "Retention Opportunity",
    storyId: "st-train",
    storyTitle: "Last Train Home",
    creatorName: "Meera Sharma",
    signal: "Severe drop-off at Episode 3 transition (-35%)",
    observation: "Episode 1 registers high 86% completion, but audience loses momentum upon entering Episode 3.",
    possibleOpportunity: "Review Episode 3 cold open with creator Meera Sharma to tighten dialogue and insert an earlier cliffhanger hook.",
    supportingData: "Measured across 850K starts with 35% attrition.",
    status: "Under Investigation",
    priority: "High",
    createdAt: "22 Sep 2026",
    reviewerNotes: "Editorial team scheduled a pacing review for Tuesday morning.",
  },
  {
    id: "opp-03",
    title: "Commission Romance follow-up with Priya Nair",
    type: "Creator Opportunity",
    storyTitle: "One More Message",
    creatorName: "Priya Nair",
    characterName: "Riya",
    signal: "Top romance completion (78%) and high social sharing (38K)",
    observation: "Priya Nair has achieved the highest viewer-to-follower conversion rate (38%) among new creators.",
    possibleOpportunity: "Offer a multi-project development agreement for two additional modern romance interactive series.",
    supportingData: "1.1M views, 78% completion, 86K character followers.",
    status: "Action Planned",
    priority: "Medium",
    createdAt: "20 Sep 2026",
    reviewerNotes: "Drafted agreement terms with Creator Operations team.",
  },
  {
    id: "opp-04",
    title: "Test Parallel Path B pacing in 'Parallel Echoes'",
    type: "Interactive Opportunity",
    storyTitle: "Parallel Echoes",
    creatorName: "Aisha Patel",
    signal: "29 percentage point branch disparity between Path A and B",
    observation: "Path B's finale retention drops to 39%, while Path A maintains 68%.",
    possibleOpportunity: "Run an A/B branch experiment adjusting the opening sequence of Episode 4B.",
    supportingData: "410K total branch votes with 29pp retention gap.",
    status: "Open Review",
    priority: "Medium",
    createdAt: "19 Sep 2026",
  },
];

export const storyExperimentsData: StoryExperiment[] = [
  {
    id: "exp-01",
    name: "Choice Placement & Cliffhanger Timing Test",
    storyTitle: "The Missing Phone",
    storyId: "st-phone",
    episode: "Episode 3: The Password",
    hypothesis: "Moving the interactive choice 15 seconds closer to the episode cliffhanger will increase decision participation and continuation.",
    variable: "Time offset of interactive modal appearance",
    controlCondition: "Choice appears at 75% episode progress (1m 15s)",
    variantCondition: "Choice appears at 90% episode progress (1m 30s) directly before black screen",
    metrics: [
      { label: "Choice Participation", controlValue: "58.2%", variantValue: "64.8%", difference: "+6.6 pp" },
      { label: "Episode Completion", controlValue: "71.0%", variantValue: "76.4%", difference: "+5.4 pp" },
      { label: "Next Episode Return", controlValue: "52.4%", variantValue: "58.9%", difference: "+6.5 pp" },
      { label: "Average Watch Time", controlValue: "1m 38s", variantValue: "1m 52s", difference: "+14s" },
    ],
    startDate: "10 Sep 2026",
    endDate: "24 Sep 2026",
    owner: "Content Optimization Team",
    status: "Completed",
    sampleSize: "48,000 viewers",
    summaryNote: "Observed difference suggests tighter choice proximity to cliffhanger heightens decision urgency. Recommendation to roll out variant as default.",
  },
  {
    id: "exp-02",
    name: "Cold Open Hook vs Immediate Action",
    storyTitle: "Last Train Home",
    storyId: "st-train",
    episode: "Episode 3: Passing Stations",
    hypothesis: "Starting Episode 3 with a 6-second tense audio cue and close-up will mitigate the observed 35% drop-off.",
    variable: "Opening 10 seconds edit sequence",
    controlCondition: "Standard slow pan of passing station lights (ambient sound)",
    variantCondition: "Sudden conductor whistle and tense footsteps approaching carriage door",
    metrics: [
      { label: "15s Retention", controlValue: "64.1%", variantValue: "73.2%", difference: "+9.1 pp" },
      { label: "Full Ep Completion", controlValue: "51.2%", variantValue: "58.6%", difference: "+7.4 pp" },
      { label: "Viewer Rating", controlValue: "3.8/5", variantValue: "4.2/5", difference: "+0.4" },
    ],
    startDate: "18 Sep 2026",
    endDate: "02 Oct 2026",
    owner: "Editorial Team",
    status: "Running",
    sampleSize: "16,400 viewers",
    summaryNote: "Early data points toward higher initial hold. Experiment remains active until full 30,000 viewer threshold is reached.",
  },
  {
    id: "exp-03",
    name: "Urgency Countdown Visualizer on Choice Point",
    storyTitle: "Messages From Tomorrow",
    storyId: "st-tomorrow",
    episode: "Episode 4: The Intersection",
    hypothesis: "Adding an audible heartbeat and subtle countdown ring will increase organic choice participation.",
    variable: "Interactive UI modal visual cues",
    controlCondition: "Standard choice buttons without countdown urgency",
    variantCondition: "Subtle 8-second pulsing ring and soft countdown timer",
    metrics: [
      { label: "Choice Participation", controlValue: "68.4%", variantValue: "74.1%", difference: "+5.7 pp" },
      { label: "Option Balancing", controlValue: "63% / 37%", variantValue: "60% / 40%", difference: "+3 pp balance" },
    ],
    startDate: "15 Sep 2026",
    endDate: "29 Sep 2026",
    owner: "Product Interactive Team",
    status: "Running",
    sampleSize: "22,800 viewers",
    summaryNote: "Results showing positive correlation with engagement without increasing user exit rate.",
  },
];

export const aiStoryAnalystPlaceholder = {
  disclaimer: "AI-generated observations will appear here after the ShortReel Story Intelligence Engine is connected.",
  mockObservation: {
    patternTitle: "Observed Choice Retention Divergence",
    description: "Viewers who chose Option A ('Unlock Gallery') in Episode 3 show an 18% higher return rate into Episode 5 compared to Option B.",
    supportingData: "Measured across 8,421 monitored sessions over 14 days.",
    suggestedInvestigation: "Review whether the Option A narrative path creates stronger forward continuation hooks.",
  },
};

export const genreSignalsData = audienceSignalsData.genres.map((g) => ({
  ...g,
  observation: `Displays ${g.viewGrowth} view growth with strong ${g.interactiveParticipation} interactive participation rate.`,
}));
export const moodSignalsData = audienceSignalsData.moods.map((m) => ({
  ...m,
  observation: `Highest repeat start retention (${m.returningViewers}) in the evening window.`,
}));
export const languageSignalsData = audienceSignalsData.languages.map((l) => ({
  ...l,
  audience: l.audienceShare,
  observation: `Healthy ${l.completion} completion and strong engagement in regional markets.`,
}));
export const discoverySignalsData = audienceSignalsData.discoverySources.map((d) => ({
  ...d,
  channel: d.source,
  observation: `Shows ${d.followConversion} follow conversion with steady retention.`,
}));

export type StoryIntelligenceDetail = StoryIntelligence;

export const storyIntelligenceList: StoryIntelligence[] = storyIntelligenceDatabase.map((s) => ({
  ...s,
  storyTitle: s.title,
  episodesCount: s.episodes,
  totalViews: s.views,
  releasePeriod: "Aug 2026",
  funnel: s.funnel.map((n) => ({
    ...n,
    episode: `Episode ${n.episodeNumber}`,
    title: n.episodeTitle,
    completionPercentage: n.completionRate,
    viewerCount: n.viewers,
  })),
}));

