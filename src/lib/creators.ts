import { series as catalog, getSeries } from "@/lib/catalog";

/**
 * Mock creator ecosystem data. Shaped like a future API response so the
 * read layer can be swapped for real endpoints without touching components.
 */

export type Creator = {
  id: string;
  name: string;
  tagline: string;
  bio: string;
  followers: string;
  views: string;
  genres: string[];
  languages: string[];
  badges: string[];
  seriesSlugs: string[];
  rising?: boolean;
  featured?: boolean;
};

export const creators: Creator[] = [
  {
    id: "ananya-studios",
    name: "Ananya Studios",
    tagline: "Romance that hurts in the best way.",
    bio: "A four-person writers' room in Hyderabad making vertical romance and drama with a strong interactive spine. Known for cliffhangers that land in under ninety seconds.",
    followers: "1.2M",
    views: "48.6M",
    genres: ["Drama", "Romance"],
    languages: ["Hindi", "Telugu"],
    badges: ["Top Creator", "Interactive Pioneer"],
    seriesSlugs: ["messages-from-tomorrow", "umbrella-hearts", "rooftop-monsoon"],
    featured: true,
  },
  {
    id: "nine-frames",
    name: "Nine Frames Studio",
    tagline: "Corridors, cameras and things that shouldn't move.",
    bio: "A thriller-first studio built by two ex-ad filmmakers. Every series is shot handheld, lit practical and written backwards from the final twist.",
    followers: "864K",
    views: "39.2M",
    genres: ["Thriller", "Mystery"],
    languages: ["English", "Hindi"],
    badges: ["Breakout IP", "Editor's Pick"],
    seriesSlugs: ["floor-nine", "glass-tower"],
    featured: true,
  },
  {
    id: "late-local-films",
    name: "Late Local Films",
    tagline: "Mumbai at 7:40 AM, every single episode.",
    bio: "Street-cast, city-shot mystery series. Late Local built its audience entirely on story votes and has never released an ending without one.",
    followers: "612K",
    views: "27.4M",
    genres: ["Mystery", "Thriller"],
    languages: ["Hindi"],
    badges: ["Audience Favourite"],
    seriesSlugs: ["the-missing-phone"],
    featured: true,
  },
  {
    id: "lantern-collective",
    name: "Lantern Collective",
    tagline: "Folklore, recorded carefully.",
    bio: "A Kolkata collective adapting regional folk tales into supernatural short series with original sound design.",
    followers: "148K",
    views: "6.1M",
    genres: ["Supernatural", "Mystery"],
    languages: ["Bengali", "Hindi"],
    badges: ["Rising Creator"],
    seriesSlugs: ["lantern-village"],
    rising: true,
  },
  {
    id: "last-bench-co",
    name: "Last Bench Co.",
    tagline: "Campus comedy, attendance optional.",
    bio: "Three college friends who kept filming after graduation. Fast, loud, extremely quotable.",
    followers: "96K",
    views: "4.4M",
    genres: ["Comedy", "Campus"],
    languages: ["Hinglish"],
    badges: ["Rising Creator", "New Voice"],
    seriesSlugs: ["last-bench"],
    rising: true,
  },
];

export const getCreator = (id: string) => creators.find((c) => c.id === id);

export const featuredCreators = creators.filter((c) => c.featured);
export const risingCreators = creators.filter((c) => c.rising);

export const creatorOriginals = creators
  .flatMap((c) => c.seriesSlugs.map((slug) => ({ creator: c, series: getSeries(slug) })))
  .filter((x): x is { creator: Creator; series: NonNullable<ReturnType<typeof getSeries>> } =>
    Boolean(x.series),
  )
  .slice(0, 6);

export const creatorForSeries = (slug: string) =>
  creators.find((c) => c.seriesSlugs.includes(slug));

export type CreatorChallenge = {
  id: string;
  title: string;
  prompt: string;
  prize: string;
  closesIn: string;
  entries: number;
};

export const creatorChallenges: CreatorChallenge[] = [
  {
    id: "one-room",
    title: "One Room, Eight Episodes",
    prompt: "An entire interactive series that never leaves a single room.",
    prize: "Production grant + featured slot",
    closesIn: "11 days",
    entries: 184,
  },
  {
    id: "monsoon",
    title: "Monsoon Nights",
    prompt: "A romance where every choice happens during a downpour.",
    prize: "Editorial mentorship",
    closesIn: "26 days",
    entries: 92,
  },
  {
    id: "twist",
    title: "The Two-Ending Challenge",
    prompt: "Write a finale where both branches feel like the real one.",
    prize: "Featured on Story Battles",
    closesIn: "5 days",
    entries: 341,
  },
];

/* ------------------------------ Studio data ------------------------------ */

export type StudioStory = {
  id: string;
  title: string;
  slug?: string;
  status: "Live" | "Draft" | "Under review" | "Scheduled";
  episodes: number;
  views: string;
  completion: number;
  votes: string;
  updated: string;
};

export const studioStories: StudioStory[] = [
  {
    id: "s1",
    title: "Messages From Tomorrow",
    slug: "messages-from-tomorrow",
    status: "Live",
    episodes: 8,
    views: "7.6M",
    completion: 74,
    votes: "128K",
    updated: "2 days ago",
  },
  {
    id: "s2",
    title: "Umbrella Hearts",
    slug: "umbrella-hearts",
    status: "Live",
    episodes: 6,
    views: "8.9M",
    completion: 69,
    votes: "96K",
    updated: "1 week ago",
  },
  {
    id: "s3",
    title: "Rooftop Monsoon",
    slug: "rooftop-monsoon",
    status: "Scheduled",
    episodes: 8,
    views: "12.4M",
    completion: 78,
    votes: "102K",
    updated: "Yesterday",
  },
];

export const studioDrafts: StudioStory[] = [
  {
    id: "d1",
    title: "The Last Letter (working title)",
    status: "Draft",
    episodes: 4,
    views: "—",
    completion: 0,
    votes: "—",
    updated: "3 hours ago",
  },
  {
    id: "d2",
    title: "Signal Lost",
    status: "Draft",
    episodes: 2,
    views: "—",
    completion: 0,
    votes: "—",
    updated: "Last Tuesday",
  },
];

export const studioSubmissions: {
  id: string;
  title: string;
  submitted: string;
  status: "Under review" | "Approved" | "Changes requested";
  note: string;
}[] = [
  {
    id: "sub1",
    title: "Night Shift Diaries",
    submitted: "4 days ago",
    status: "Under review",
    note: "Editorial review usually takes 5–7 working days.",
  },
  {
    id: "sub2",
    title: "Half Ticket",
    submitted: "3 weeks ago",
    status: "Changes requested",
    note: "Tighten episodes 3–5 and add one interactive choice.",
  },
];

export const studioMetrics = [
  { label: "Views", value: "1.8M", delta: "+12%" },
  { label: "Completion", value: "72%", delta: "+4%" },
  { label: "Followers", value: "84K", delta: "+2.1K" },
  { label: "Votes", value: "326K", delta: "+18%" },
  { label: "Revenue", value: "₹1.24L", delta: "+9%" },
];

export const studioAnalytics = [
  { label: "Views", value: "1,842,300" },
  { label: "Completion rate", value: "72%" },
  { label: "Average watch time", value: "6m 12s" },
  { label: "Followers", value: "84,120" },
  { label: "Votes cast", value: "326,480" },
  { label: "Choices made", value: "211,940" },
  { label: "Shares", value: "48,610" },
  { label: "Revenue", value: "₹1,24,500" },
];

export const analyticsHighlights = [
  {
    label: "Most popular character",
    value: "Maya",
    note: "82% audience favourite · 248K followers",
  },
  {
    label: "Most successful episode",
    value: "Episode 6 — Blocked",
    note: "91% completion · 44K votes",
  },
];

export const retention = [
  { label: "EP 1", value: 100 },
  { label: "EP 2", value: 92 },
  { label: "EP 3", value: 86 },
  { label: "EP 4", value: 81 },
  { label: "EP 5", value: 78 },
  { label: "EP 6", value: 76 },
  { label: "EP 7", value: 73 },
  { label: "EP 8", value: 72 },
];

export const revenue = {
  total: "₹1,24,500",
  creatorShare: "₹74,700",
  platformShare: "₹49,800",
  breakdown: [
    { label: "VIP watch-time pool", value: "₹68,200" },
    { label: "Interactive engagement bonus", value: "₹34,100" },
    { label: "Story Battle feature slot", value: "₹22,200" },
  ],
};

/* --------------------------- Story creation flow -------------------------- */

export const creationSteps = [
  { id: "idea", label: "Story Idea", hint: "Logline, genre, language, format" },
  { id: "characters", label: "Characters", hint: "Cast, roles and arcs" },
  { id: "arc", label: "Story Arc", hint: "Beginning, turn, finale" },
  { id: "episodes", label: "Episodes", hint: "Titles, synopses, cliffhangers" },
  { id: "choices", label: "Interactive Choices", hint: "Branch points and consequences" },
  { id: "review", label: "Review", hint: "Check pacing and continuity" },
  { id: "submit", label: "Submit", hint: "Send to ShortReel editorial" },
] as const;

/* ----------------------------- AI Story Studio ---------------------------- */

export const aiSteps = [
  { no: "01", label: "Story Concept" },
  { no: "02", label: "Characters" },
  { no: "03", label: "Story Arc" },
  { no: "04", label: "Episodes" },
  { no: "05", label: "Cliffhangers" },
  { no: "06", label: "Interactive Choices" },
  { no: "07", label: "Production Pack" },
] as const;

export type AiCharacter = {
  name: string;
  age: string;
  role: string;
  note: string;
};

export type AiEpisode = {
  number: number;
  title: string;
  synopsis: string;
  hook: string;
  cliffhanger: string;
  characters: string[];
  duration: string;
};

export type AiChoice = {
  episode: number;
  prompt: string;
  optionA: string;
  optionB: string;
  consequenceA: string;
  consequenceB: string;
};

export type AiStory = {
  title: string;
  genre: string;
  language: string;
  episodes: number;
  format: string;
  logline: string;
  arc: { label: string; text: string }[];
  characters: AiCharacter[];
  episodeList: AiEpisode[];
  choices: AiChoice[];
  productionPack: { title: string; body: string }[];
};

export const aiStory: AiStory = {
  title: "Messages From Tomorrow",
  genre: "Mystery · Romance",
  language: "Hindi",
  episodes: 8,
  format: "Vertical Short Series",
  logline:
    "A young woman begins receiving messages from her future self warning her about decisions she has not yet made.",
  arc: [
    {
      label: "Act I — The first message",
      text: "Maya dismisses the voice notes as a prank until one of them predicts an accident on her street.",
    },
    {
      label: "Act II — The cost of knowing",
      text: "Every warning she acts on changes something she didn't expect. Arjun starts noticing she knows too much.",
    },
    {
      label: "Act III — Tomorrow calls back",
      text: "The final message asks Maya to do the one thing that guarantees future Maya never exists.",
    },
  ],
  characters: [
    { name: "Maya", age: "Age 24", role: "Protagonist", note: "Night-shift coder, sceptic, terrible at sleeping." },
    { name: "Arjun", age: "Age 27", role: "Love interest", note: "Paramedic who keeps turning up at her warnings." },
    { name: "Riya", age: "Age 25", role: "Best friend", note: "The only person Maya tells the truth to." },
    { name: "Unknown Future Maya", age: "Age ?", role: "Mystery character", note: "Only ever heard, never seen." },
  ],
  episodeList: [
    {
      number: 1,
      title: "The First Message",
      synopsis: "A strange message arrives on Maya's phone at 3:04 AM.",
      hook: "Maya's phone plays a voice note she never recorded.",
      cliffhanger: "Maya receives a photograph of herself taken tomorrow.",
      characters: ["Maya", "Riya"],
      duration: "1m 50s",
    },
    {
      number: 2,
      title: "Twelve Hours Early",
      synopsis: "Maya tests the message by going where it tells her not to go.",
      hook: "The street is exactly as described — down to the broken signal.",
      cliffhanger: "Arjun pulls her back from the kerb a second before the crash.",
      characters: ["Maya", "Arjun"],
      duration: "2m 04s",
    },
    {
      number: 3,
      title: "Proof",
      synopsis: "Riya records Maya's phone for an entire night.",
      hook: "The recording captures nothing. The message is still there.",
      cliffhanger: "Future Maya says Riya's name for the first time.",
      characters: ["Maya", "Riya"],
      duration: "1m 44s",
    },
  ],
  choices: [
    {
      episode: 1,
      prompt: "What should Maya do?",
      optionA: "Open the message",
      optionB: "Delete the message",
      consequenceA: "Maya discovers the first clue.",
      consequenceB: "Maya avoids the danger temporarily.",
    },
    {
      episode: 2,
      prompt: "Should Maya tell Arjun the truth?",
      optionA: "Tell him everything",
      optionB: "Keep it to herself",
      consequenceA: "Arjun becomes an ally — and a target.",
      consequenceB: "Maya stays safe but starts lying to everyone.",
    },
  ],
  productionPack: [
    {
      title: "Story Bible",
      body: "Tone, rules of the time-loop, what future Maya can and cannot know, and the three questions every episode must answer.",
    },
    {
      title: "Character Profiles",
      body: "Full sheets for Maya, Arjun, Riya and Future Maya with voice, wardrobe and behaviour notes.",
    },
    {
      title: "Episode Outline",
      body: "Eight episodes mapped beat by beat with runtime targets between 90 and 130 seconds.",
    },
    {
      title: "Dialogue Draft",
      body: "First-pass dialogue for episodes 1–3, written for portrait framing and headphone listening.",
    },
    {
      title: "Scene List",
      body: "22 scenes across 6 locations, tagged night/day and interior/exterior for a 9-day shoot.",
    },
    {
      title: "Cliffhangers",
      body: "One hard cut per episode, each landing in the final four seconds.",
    },
    {
      title: "Interactive Choice Map",
      body: "Two branch points with four reconciling paths so the finale stays shootable.",
    },
    {
      title: "Production Notes",
      body: "Practical lighting, single-camera handheld, phone-screen inserts shot separately at 60fps.",
    },
  ],
};
