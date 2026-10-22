/* ==========================================================================
   SHORTREEL ITERATION 4B — STORY ENGINE CMS DATA & MODEL
   Visual branching, story nodes, choice points, path testing, live voting,
   predictions, and validation rules.
   ========================================================================== */

export type StoryNodeType = "Episode" | "Choice" | "Branch" | "Ending";
export type StoryNodeStatus = "Draft" | "Ready" | "Published";

export interface ChoiceOption {
  id: string; // e.g. "opt-a", "opt-b"
  label: string; // "Option A", "Option B"
  text: string; // "Open it", "Destroy it"
  destinationNodeId: string; // e.g. "node-ep4a"
  voteCount?: number;
  votePercentage?: number;
}

export interface ChoiceConfig {
  id: string;
  question: string;
  options: ChoiceOption[];
  votingDurationSeconds: number;
  minimumAudienceCount: number;
  resultVisibility: "Immediate" | "AfterVotingEnds" | "Hidden";
  status: "Active" | "Scheduled" | "Closed";
  votingStart?: string;
  votingEnd?: string;
}

export interface StoryNode {
  id: string;
  episodeNumber?: number | undefined;
  title: string;
  description: string;
  thumbnail: string;
  type: StoryNodeType;
  status: StoryNodeStatus;
  videoUrl?: string | undefined;
  duration?: string | undefined;
  characters: string[]; // Characters associated with this node (Section 23)
  // Connections
  nextNodeId?: string | undefined; // Linear next node
  choiceConfig?: ChoiceConfig | undefined; // Choice configuration for Choice nodes
  branchTag?: string | undefined; // "Path A" or "Path B"
  // Visual layout coordinates for interactive graph builder
  x: number;
  y: number;
}

export interface StoryVersion {
  version: number;
  label: string;
  status: "Published" | "Draft" | "Archived";
  updatedAt: string;
  updatedBy: string;
  nodesCount: number;
}

export interface InteractiveStory {
  id: string;
  seriesId: string;
  seriesTitle: string;
  title: string;
  description: string;
  currentVersion: number;
  versions: StoryVersion[];
  nodes: StoryNode[];
  status: "Draft" | "Editorial Review" | "Ready" | "Published" | "Archived";
  activeVotesCount: number;
  completionRate: string;
  engagementScore: string;
  updatedAt: string;
}

export interface LiveVote {
  id: string;
  storyTitle: string;
  seriesId: string;
  episodeTitle: string;
  episodeNumber: number;
  choiceQuestion: string;
  optionA: { text: string; percentage: number; count: number };
  optionB: { text: string; percentage: number; count: number };
  optionC?: { text: string; percentage: number; count: number };
  totalVotes: string;
  totalVotersNumeric: number;
  timeRemaining: string;
  participationRate: string;
  status: "Active" | "Closed" | "Scheduled";
  timelineData: { time: string; votesA: number; votesB: number }[];
  completionBeforeVote: string;
  completionAfterVote: string;
}

export interface StoryPrediction {
  id: string;
  seriesId: string;
  seriesTitle: string;
  question: string;
  options: string[];
  correctAnswer: string;
  startDate: string;
  endDate: string;
  xpReward: number;
  totalPredictors: number;
  status: "Active" | "Settled" | "Upcoming";
}

/* ==========================================================================
   SECTION 28: COMPLETE WORKING MOCK STORY — "THE MISSING PHONE"
   Graph Topology:
   EP1 -> EP2 -> EP3 -> CHOICE
     ├─ A (Open it)    -> EP 4A -> EP 5A -> Ending A (Truth Revealed)
     └─ B (Destroy it) -> EP 4B -> EP 5B -> Ending B (Off The Grid)
   ========================================================================== */

export const mockMissingPhoneNodes: StoryNode[] = [
  {
    id: "node-ep1",
    episodeNumber: 1,
    title: "The Notification",
    description: "Riya discovers her lost phone has been found — by someone texting from her own number.",
    thumbnail: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=400&q=80",
    type: "Episode",
    status: "Published",
    videoUrl: "/videos/sample-drama-walking.mp4",
    duration: "1:42",
    characters: ["Maya", "Unknown Caller"],
    nextNodeId: "node-ep2",
    x: 350,
    y: 60,
  },
  {
    id: "node-ep2",
    episodeNumber: 2,
    title: "Stranger's Gallery",
    description: "The photos arriving on her cloud account are taken from inside her own apartment.",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80",
    type: "Episode",
    status: "Published",
    videoUrl: "/videos/sample-30s.mp4",
    duration: "1:55",
    characters: ["Maya", "Arjun"],
    nextNodeId: "node-ep3",
    x: 350,
    y: 190,
  },
  {
    id: "node-ep3",
    episodeNumber: 3,
    title: "The Voice Note",
    description: "A chilling 12-second voice message instructs Maya to make an irrevocable decision.",
    thumbnail: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80",
    type: "Episode",
    status: "Published",
    videoUrl: "/videos/sample-thriller-night.mp4",
    duration: "2:01",
    characters: ["Maya", "Arjun", "Kabir"],
    nextNodeId: "node-choice1",
    x: 350,
    y: 320,
  },
  {
    id: "node-choice1",
    title: "Maya's Dilemma",
    description: "The pivotal audience vote that splits the timeline into two distinct story trajectories.",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
    type: "Choice",
    status: "Published",
    characters: ["Maya", "Kabir"],
    choiceConfig: {
      id: "choice-mp-01",
      question: "Should Maya open the encrypted phone or destroy it?",
      options: [
        {
          id: "opt-a",
          label: "Option A",
          text: "Open It (Decrypt secret vault)",
          destinationNodeId: "node-ep4a",
          voteCount: 79898,
          votePercentage: 64,
        },
        {
          id: "opt-b",
          label: "Option B",
          text: "Destroy It (Shatter the SIM & phone)",
          destinationNodeId: "node-ep4b",
          voteCount: 44944,
          votePercentage: 36,
        },
      ],
      votingDurationSeconds: 86400,
      minimumAudienceCount: 1000,
      resultVisibility: "Immediate",
      status: "Active",
      votingStart: "20 Sep 2026",
      votingEnd: "25 Sep 2026",
    },
    x: 350,
    y: 450,
  },
  // Branch A Path
  {
    id: "node-ep4a",
    episodeNumber: 4,
    title: "Episode 4A: The Vault",
    description: "Maya decrypts the storage and uncovers audio files linking Kabir to the university dean.",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80",
    type: "Episode",
    status: "Published",
    branchTag: "Path A",
    videoUrl: "/videos/sample-30s.mp4",
    duration: "2:10",
    characters: ["Maya", "Kabir"],
    nextNodeId: "node-ep5a",
    x: 180,
    y: 590,
  },
  {
    id: "node-ep5a",
    episodeNumber: 5,
    title: "Episode 5A: The Confrontation",
    description: "Maya brings the leaked drive directly to Arjun before Kabir can intercept them.",
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&q=80",
    type: "Episode",
    status: "Published",
    branchTag: "Path A",
    videoUrl: "/videos/sample-drama-walking.mp4",
    duration: "2:18",
    characters: ["Maya", "Arjun"],
    nextNodeId: "node-ending-a",
    x: 180,
    y: 720,
  },
  {
    id: "node-ending-a",
    title: "Ending A: Truth Revealed",
    description: "The extortion syndicate is exposed live on student radio. Kabir is arrested.",
    thumbnail: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&q=80",
    type: "Ending",
    status: "Published",
    branchTag: "Path A",
    duration: "1:40",
    characters: ["Maya", "Arjun", "Kabir"],
    x: 180,
    y: 850,
  },
  // Branch B Path
  {
    id: "node-ep4b",
    episodeNumber: 4,
    title: "Episode 4B: The Runaway",
    description: "Maya smashes the phone on the pavement, but a burner courier is already tracking her scooter.",
    thumbnail: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=400&q=80",
    type: "Episode",
    status: "Published",
    branchTag: "Path B",
    videoUrl: "/videos/sample-thriller-night.mp4",
    duration: "1:58",
    characters: ["Maya"],
    nextNodeId: "node-ep5b",
    x: 520,
    y: 590,
  },
  {
    id: "node-ep5b",
    episodeNumber: 5,
    title: "Episode 5B: Ghost Signal",
    description: "With no devices, Maya seeks refuge at a highway petrol pump where an old payphone starts ringing.",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
    type: "Episode",
    status: "Published",
    branchTag: "Path B",
    videoUrl: "/videos/sample-thriller-night.mp4",
    duration: "2:04",
    characters: ["Maya", "Inspector Mehra"],
    nextNodeId: "node-ending-b",
    x: 520,
    y: 720,
  },
  {
    id: "node-ending-b",
    title: "Ending B: Off The Grid",
    description: "Maya fakes her departure on the night train to Goa, vanishing from digital reach forever.",
    thumbnail: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=400&q=80",
    type: "Ending",
    status: "Published",
    branchTag: "Path B",
    duration: "1:45",
    characters: ["Maya"],
    x: 520,
    y: 850,
  },
];

/* ==========================================================================
   INTERACTIVE STORIES REPOSITORY
   ========================================================================== */

export const mockInteractiveStories: InteractiveStory[] = [
  {
    id: "story-ser-001",
    seriesId: "ser-001",
    seriesTitle: "The Missing Phone",
    title: "The Missing Phone — Interactive Arc",
    description: "India's highest rated interactive branch thriller with dual endings.",
    currentVersion: 1,
    versions: [
      {
        version: 1,
        label: "v1.0 (Live Broadcast)",
        status: "Published",
        updatedAt: "20 Sep 2026",
        updatedBy: "Super Admin",
        nodesCount: 9,
      },
      {
        version: 2,
        label: "v2.0 (Director's Cut)",
        status: "Draft",
        updatedAt: "24 Sep 2026",
        updatedBy: "Editor (Rohan)",
        nodesCount: 12,
      },
      {
        version: 0,
        label: "v0.9 (Pre-launch Pilot)",
        status: "Archived",
        updatedAt: "10 Aug 2026",
        updatedBy: "Content Admin",
        nodesCount: 7,
      },
    ],
    nodes: mockMissingPhoneNodes,
    status: "Published",
    activeVotesCount: 1,
    completionRate: "78%",
    engagementScore: "91%",
    updatedAt: "20 Sep 2026",
  },
  {
    id: "story-ser-002",
    seriesId: "ser-002",
    seriesTitle: "Shadow Campus",
    title: "Shadow Campus: Initiation",
    description: "Interactive campus mystery where student votes decide secret society allegiances.",
    currentVersion: 1,
    versions: [
      {
        version: 1,
        label: "v1.0 (Fall Semester)",
        status: "Published",
        updatedAt: "18 Sep 2026",
        updatedBy: "Editor",
        nodesCount: 6,
      },
    ],
    nodes: [
      {
        id: "sc-ep1",
        episodeNumber: 1,
        title: "Orientation Night",
        description: "Aditya receives a secret envelope under his dorm door.",
        thumbnail: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&q=80",
        type: "Episode",
        status: "Published",
        duration: "1:38",
        characters: ["Aditya Verma"],
        nextNodeId: "sc-choice1",
        x: 350,
        y: 80,
      },
      {
        id: "sc-choice1",
        title: "The Oath",
        description: "Aditya must decide whether to sign the loyalty ledger.",
        thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80",
        type: "Choice",
        status: "Published",
        characters: ["Aditya Verma", "The Dean"],
        choiceConfig: {
          id: "choice-sc-01",
          question: "Should Aditya sign the ledger or report it?",
          options: [
            { id: "sc-opt-a", label: "Option A", text: "Sign the ledger", destinationNodeId: "sc-ep2a", votePercentage: 58 },
            { id: "sc-opt-b", label: "Option B", text: "Report to warden", destinationNodeId: "sc-ep2b", votePercentage: 42 },
          ],
          votingDurationSeconds: 43200,
          minimumAudienceCount: 500,
          resultVisibility: "Immediate",
          status: "Active",
        },
        x: 350,
        y: 220,
      },
      {
        id: "sc-ep2a",
        episodeNumber: 2,
        title: "Episode 2A: The Ring",
        description: "Aditya wears the obsidian ring into lecture hall.",
        thumbnail: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=80",
        type: "Episode",
        status: "Published",
        branchTag: "Path A",
        duration: "1:52",
        characters: ["Aditya Verma"],
        nextNodeId: "sc-end-a",
        x: 200,
        y: 360,
      },
      {
        id: "sc-ep2b",
        episodeNumber: 2,
        title: "Episode 2B: The Whistleblower",
        description: "The warden warns Aditya that the dean founded the society.",
        thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
        type: "Episode",
        status: "Published",
        branchTag: "Path B",
        duration: "1:48",
        characters: ["Aditya Verma"],
        nextNodeId: "sc-end-b",
        x: 500,
        y: 360,
      },
      {
        id: "sc-end-a",
        title: "Ending A: Inducted",
        description: "Aditya takes the inner circle oath.",
        thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80",
        type: "Ending",
        status: "Published",
        duration: "1:30",
        characters: ["Aditya Verma"],
        x: 200,
        y: 500,
      },
      {
        id: "sc-end-b",
        title: "Ending B: The Rebel",
        description: "Aditya forms an underground counter-group.",
        thumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&q=80",
        type: "Ending",
        status: "Published",
        duration: "1:35",
        characters: ["Aditya Verma"],
        x: 500,
        y: 500,
      },
    ],
    status: "Published",
    activeVotesCount: 1,
    completionRate: "72%",
    engagementScore: "84%",
    updatedAt: "18 Sep 2026",
  },
  {
    id: "story-ser-004",
    seriesId: "ser-004",
    seriesTitle: "Neon Karma 2099",
    title: "Neon Karma: Delete Sequence",
    description: "Cyberpunk memory-hacker branching thriller.",
    currentVersion: 1,
    versions: [
      {
        version: 1,
        label: "v1.0 (Mumbai Skyway)",
        status: "Published",
        updatedAt: "22 Sep 2026",
        updatedBy: "Super Admin",
        nodesCount: 5,
      },
    ],
    nodes: [],
    status: "Ready",
    activeVotesCount: 0,
    completionRate: "68%",
    engagementScore: "88%",
    updatedAt: "22 Sep 2026",
  },
  {
    id: "story-ser-006",
    seriesId: "ser-006",
    seriesTitle: "The Ghost in the Metro",
    title: "The Ghost in the Metro: Phantom Platform",
    description: "Live interactive train car elimination vote.",
    currentVersion: 1,
    versions: [
      {
        version: 1,
        label: "v1.0",
        status: "Draft",
        updatedAt: "23 Sep 2026",
        updatedBy: "Kavitha R",
        nodesCount: 4,
      },
    ],
    nodes: [],
    status: "Editorial Review",
    activeVotesCount: 0,
    completionRate: "0%",
    engagementScore: "0%",
    updatedAt: "23 Sep 2026",
  },
];

/* ==========================================================================
   SECTION 16 & 17 & 18: VOTES & LIVE VOTE ANALYTICS
   ========================================================================== */

export const mockLiveVotes: LiveVote[] = [
  {
    id: "vote-001",
    storyTitle: "The Missing Phone",
    seriesId: "ser-001",
    episodeTitle: "Episode 6: The Crossroads",
    episodeNumber: 6,
    choiceQuestion: "Who should Maya trust?",
    optionA: { text: "Arjun (Childhood Friend)", percentage: 64, count: 79898 },
    optionB: { text: "Kabir (The Mysterious Stranger)", percentage: 36, count: 44944 },
    totalVotes: "124,842",
    totalVotersNumeric: 124842,
    timeRemaining: "00:42:18",
    participationRate: "88.4%",
    status: "Active",
    completionBeforeVote: "94.2%",
    completionAfterVote: "91.8%",
    timelineData: [
      { time: "00:00", votesA: 12000, votesB: 8500 },
      { time: "06:00", votesA: 28000, votesB: 16500 },
      { time: "12:00", votesA: 45000, votesB: 27000 },
      { time: "18:00", votesA: 64000, votesB: 37500 },
      { time: "24:00", votesA: 79898, votesB: 44944 },
    ],
  },
  {
    id: "vote-002",
    storyTitle: "Shadow Campus",
    seriesId: "ser-002",
    episodeTitle: "Episode 3: The Initiation",
    episodeNumber: 3,
    choiceQuestion: "Should Aditya betray his roommate to protect the secret society?",
    optionA: { text: "Protect Roommate", percentage: 71, count: 62450 },
    optionB: { text: "Honor The Society", percentage: 29, count: 25510 },
    totalVotes: "87,960",
    totalVotersNumeric: 87960,
    timeRemaining: "04:15:30",
    participationRate: "82.1%",
    status: "Active",
    completionBeforeVote: "89.0%",
    completionAfterVote: "86.5%",
    timelineData: [
      { time: "00:00", votesA: 8000, votesB: 4000 },
      { time: "06:00", votesA: 22000, votesB: 9500 },
      { time: "12:00", votesA: 44000, votesB: 18000 },
      { time: "18:00", votesA: 62450, votesB: 25510 },
    ],
  },
  {
    id: "vote-003",
    storyTitle: "The Missing Phone",
    seriesId: "ser-001",
    episodeTitle: "Episode 3: The Voice Note",
    episodeNumber: 3,
    choiceQuestion: "Should Maya open the phone or destroy it?",
    optionA: { text: "Open It", percentage: 61, count: 142100 },
    optionB: { text: "Destroy It", percentage: 39, count: 90840 },
    totalVotes: "232,940",
    totalVotersNumeric: 232940,
    timeRemaining: "Ended",
    participationRate: "92.6%",
    status: "Closed",
    completionBeforeVote: "96.1%",
    completionAfterVote: "94.3%",
    timelineData: [
      { time: "Day 1", votesA: 42000, votesB: 28000 },
      { time: "Day 2", votesA: 95000, votesB: 58000 },
      { time: "Day 3", votesA: 142100, votesB: 90840 },
    ],
  },
];

/* ==========================================================================
   SECTION 19: PREDICTION MANAGEMENT
   ========================================================================== */

export const mockPredictions: StoryPrediction[] = [
  {
    id: "pred-001",
    seriesId: "ser-001",
    seriesTitle: "The Missing Phone",
    question: "Who is the blackmailer behind the lost phone number?",
    options: ["Arjun (Best Friend)", "Maya's Professor", "Kabir (Ex-Boyfriend)", "Inspector Mehra"],
    correctAnswer: "Kabir (Ex-Boyfriend)",
    startDate: "15 Aug 2026",
    endDate: "30 Sep 2026",
    xpReward: 50,
    totalPredictors: 42800,
    status: "Active",
  },
  {
    id: "pred-002",
    seriesId: "ser-002",
    seriesTitle: "Shadow Campus",
    question: "Who is the supreme founder of the Obsidian Society?",
    options: ["Dean Vasudev", "Student President Sneha", "Aditya's Father", "The Alumni Trustee"],
    correctAnswer: "Dean Vasudev",
    startDate: "01 Sep 2026",
    endDate: "15 Oct 2026",
    xpReward: 100,
    totalPredictors: 28400,
    status: "Active",
  },
  {
    id: "pred-003",
    seriesId: "ser-004",
    seriesTitle: "Neon Karma 2099",
    question: "Whose memory was deleted in Client Zero's vault?",
    options: ["Zara herself", "The Police Commissioner", "Zara's Sister", "The AI Core"],
    correctAnswer: "Zara herself",
    startDate: "01 Aug 2026",
    endDate: "20 Aug 2026",
    xpReward: 75,
    totalPredictors: 19500,
    status: "Settled",
  },
];

/* ==========================================================================
   SECTION 13: STORY VALIDATION ENGINE
   ========================================================================== */

export interface StoryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  passedChecks: string[];
}

export function validateStoryGraph(nodes: StoryNode[]): StoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const passedChecks: string[] = [];

  if (nodes.length === 0) {
    return {
      isValid: false,
      errors: ["Story contains no nodes."],
      warnings: [],
      passedChecks: [],
    };
  }

  const nodeMap = new Map<string, StoryNode>();
  const incomingCount = new Map<string, number>();

  // 1. Check duplicate IDs
  let hasDuplicateId = false;
  for (const n of nodes) {
    if (nodeMap.has(n.id)) {
      errors.push(`Duplicate Node ID detected: "${n.id}"`);
      hasDuplicateId = true;
    }
    nodeMap.set(n.id, n);
    incomingCount.set(n.id, 0);
  }
  if (!hasDuplicateId) {
    passedChecks.push("No duplicate node IDs");
  }

  // 2. Count incoming connections and verify destination nodes exist
  let brokenConnections = 0;
  for (const n of nodes) {
    if (n.type === "Choice" && n.choiceConfig) {
      if (!n.choiceConfig.options || n.choiceConfig.options.length < 2) {
        errors.push(`Choice node "${n.title}" must have at least 2 options.`);
      }
      n.choiceConfig.options.forEach((opt) => {
        if (!opt.destinationNodeId) {
          errors.push(`Choice option "${opt.label}" in "${n.title}" has no destination node.`);
          brokenConnections++;
        } else if (!nodeMap.has(opt.destinationNodeId)) {
          errors.push(
            `Destination "${opt.destinationNodeId}" for "${opt.label}" does not exist in graph.`
          );
          brokenConnections++;
        } else {
          incomingCount.set(opt.destinationNodeId, (incomingCount.get(opt.destinationNodeId) || 0) + 1);
        }
      });
    } else if (n.type !== "Ending") {
      if (!n.nextNodeId) {
        warnings.push(`Node "${n.title}" has no next destination configured.`);
      } else if (!nodeMap.has(n.nextNodeId)) {
        errors.push(`Node "${n.title}" points to non-existent node "${n.nextNodeId}".`);
        brokenConnections++;
      } else {
        incomingCount.set(n.nextNodeId, (incomingCount.get(n.nextNodeId) || 0) + 1);
      }
    }
  }

  if (brokenConnections === 0) {
    passedChecks.push("All choice options have valid destinations");
    passedChecks.push("No broken connection paths");
  }

  // 3. Ending nodes check
  const endingNodes = nodes.filter((n) => n.type === "Ending");
  if (endingNodes.length === 0) {
    errors.push("Story graph must contain at least one Ending node.");
  } else {
    passedChecks.push(`Story has ${endingNodes.length} valid ending node(s)`);
  }

  // 4. Orphan nodes check (nodes with 0 incoming that aren't the root)
  const rootCandidates = nodes.filter((n) => (incomingCount.get(n.id) || 0) === 0);
  if (rootCandidates.length > 1) {
    warnings.push(
      `${rootCandidates.length} separate entry nodes detected (${rootCandidates
        .map((r) => r.title)
        .join(", ")}). One should be the primary entry point.`
    );
  } else if (rootCandidates.length === 1 && rootCandidates[0]) {
    passedChecks.push("Single coherent starting node: " + rootCandidates[0].title);
  }

  // 5. Media & Thumbnails check
  const missingThumbs = nodes.filter((n) => !n.thumbnail);
  if (missingThumbs.length === 0) {
    passedChecks.push("All thumbnails available");
  } else {
    warnings.push(`${missingThumbs.length} node(s) missing preview thumbnail.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    passedChecks,
  };
}
