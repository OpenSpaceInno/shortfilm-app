import { getSeries, type Series } from "@/lib/catalog";

/**
 * Iteration 2 mock data: predictions, characters, badges, story battles,
 * notifications and personalisation. Shaped like a future API response.
 */

export type Prediction = {
  id: string;
  seriesSlug: string;
  question: string;
  options: { id: string; label: string; sharePct: number }[];
  revealEpisode: number;
  participants: string;
};

export type Character = {
  id: string;
  name: string;
  seriesSlug: string;
  role: string;
  favouritePct: number;
  followers: string;
  about: string;
  genres: string[];
  keyMoments: { episode: number; title: string; note: string }[];
  popularChoices: { label: string; sharePct: number }[];
  predictionIds: string[];
};

export type StoryBattle = {
  id: string;
  seriesSlug: string;
  title: string;
  options: { id: "A" | "B"; label: string; detail: string; sharePct: number }[];
  votes: string;
  closesIn: string;
};

export type NotificationItem = {
  id: string;
  kind: "vote" | "closing" | "episode" | "prediction" | "character";
  title: string;
  body: string;
  time: string;
  href:
    | { to: "/watch/$slug"; params: { slug: string }; search: { ep: number } }
    | { to: "/series/$slug"; params: { slug: string } }
    | { to: "/character/$id"; params: { id: string } }
    | { to: "/interactive" };
};

export const XP_RULES = {
  watchEpisode: 10,
  completeEpisode: 25,
  vote: 30,
  prediction: 20,
  followCharacter: 15,
  completeSeries: 50,
  share: 20,
  like: 10,
} as const;

export const XP_LABELS: Record<keyof typeof XP_RULES, string> = {
  watchEpisode: "Episode started",
  completeEpisode: "Episode completed",
  vote: "Story vote",
  prediction: "Prediction made",
  followCharacter: "Character followed",
  completeSeries: "Series completed",
  share: "Story shared",
  like: "Episode liked",
};

export const predictions: Prediction[] = [
  {
    id: "the-missing-phone-traitor",
    seriesSlug: "the-missing-phone",
    question: "Who is the traitor?",
    options: [
      { id: "arjun", label: "Arjun", sharePct: 38 },
      { id: "maya", label: "Maya", sharePct: 12 },
      { id: "kabir", label: "Kabir", sharePct: 31 },
      { id: "unexpected", label: "Someone unexpected", sharePct: 19 },
    ],
    revealEpisode: 8,
    participants: "1.9M",
  },
  {
    id: "messages-from-tomorrow-voice",
    seriesSlug: "messages-from-tomorrow",
    question: "Whose voice is on the last note?",
    options: [
      { id: "her", label: "Her future self", sharePct: 44 },
      { id: "sister", label: "Her sister", sharePct: 21 },
      { id: "stranger", label: "A stranger", sharePct: 18 },
      { id: "nobody", label: "Nobody — it's a loop", sharePct: 17 },
    ],
    revealEpisode: 7,
    participants: "740K",
  },
  {
    id: "floor-nine-corridor",
    seriesSlug: "floor-nine",
    question: "What walks the corridor at 3:04 AM?",
    options: [
      { id: "guard", label: "The old guard", sharePct: 35 },
      { id: "cctv", label: "A CCTV glitch", sharePct: 27 },
      { id: "kabir", label: "Kabir himself", sharePct: 24 },
      { id: "unexpected", label: "Someone unexpected", sharePct: 14 },
    ],
    revealEpisode: 8,
    participants: "612K",
  },
];

export const getPrediction = (id: string) => predictions.find((p) => p.id === id);
export const predictionsForSeries = (slug: string) =>
  predictions.filter((p) => p.seriesSlug === slug);

export const characters: Character[] = [
  {
    id: "maya",
    name: "Maya",
    seriesSlug: "the-missing-phone",
    role: "Protagonist",
    favouritePct: 82,
    followers: "248K",
    about:
      "A junior archivist who takes the 7:40 local every morning — until the day she picks up a phone that isn't hers and starts answering it.",
    genres: ["Mystery", "Romance"],
    keyMoments: [
      { episode: 3, title: "She unlocks the phone", note: "74% of viewers told her to open it." },
      { episode: 5, title: "The platform confession", note: "Her most-shared scene of the season." },
      { episode: 6, title: "Tell Arjun, or don't", note: "The season's biggest fork." },
    ],
    popularChoices: [
      { label: "Tell Arjun everything", sharePct: 67 },
      { label: "Keep it a secret", sharePct: 33 },
    ],
    predictionIds: ["the-missing-phone-traitor"],
  },
  {
    id: "arjun",
    name: "Arjun",
    seriesSlug: "the-missing-phone",
    role: "Love Interest",
    favouritePct: 71,
    followers: "186K",
    about:
      "The friend who always answers on the second ring. He knows more about the phone's owner than he has admitted so far.",
    genres: ["Mystery", "Drama"],
    keyMoments: [
      { episode: 2, title: "The second ring", note: "His first appearance, already lying." },
      { episode: 6, title: "He waits at the flat", note: "Only visible on Path A." },
    ],
    popularChoices: [{ label: "Trust him with the screenshots", sharePct: 67 }],
    predictionIds: ["the-missing-phone-traitor"],
  },
  {
    id: "kabir",
    name: "Kabir",
    seriesSlug: "floor-nine",
    role: "Mystery Character",
    favouritePct: 64,
    followers: "121K",
    about:
      "The night-shift colleague who never appears on the same camera twice. Audiences are split on whether he is a victim or the reason.",
    genres: ["Thriller", "Mystery"],
    keyMoments: [
      { episode: 4, title: "The reset timestamp", note: "First hint that he is out of sync." },
      { episode: 5, title: "Whose shift?", note: "39% of viewers sent him up to floor nine." },
    ],
    popularChoices: [{ label: "Send Kabir", sharePct: 39 }],
    predictionIds: ["floor-nine-corridor"],
  },
  {
    id: "aisha",
    name: "Aisha",
    seriesSlug: "rooftop-monsoon",
    role: "Protagonist",
    favouritePct: 77,
    followers: "203K",
    about:
      "Ten nights, one terrace, and a countdown she never agreed to. Aisha is the reason viewers keep returning to the rooftop.",
    genres: ["Romance", "Drama"],
    keyMoments: [
      { episode: 1, title: "First climb", note: "The scene that started the series' word of mouth." },
      { episode: 5, title: "The confession", note: "Most replayed moment on ShortReel." },
    ],
    popularChoices: [{ label: "Stay one more night", sharePct: 58 }],
    predictionIds: [],
  },
  {
    id: "nila",
    name: "Nila",
    seriesSlug: "messages-from-tomorrow",
    role: "Protagonist",
    favouritePct: 69,
    followers: "98K",
    about:
      "A night-shift coder who hears tomorrow before it happens — and has to decide whether answering makes it true.",
    genres: ["Mystery", "Romance"],
    keyMoments: [
      { episode: 4, title: "The reply", note: "58% of viewers told her to answer." },
    ],
    popularChoices: [{ label: "Reply", sharePct: 58 }],
    predictionIds: ["messages-from-tomorrow-voice"],
  },
];

export const getCharacter = (id: string) => characters.find((c) => c.id === id);
export const charactersForSeries = (slug: string) =>
  characters.filter((c) => c.seriesSlug === slug);

export const storyBattles: StoryBattle[] = [
  {
    id: "the-missing-phone-ending",
    seriesSlug: "the-missing-phone",
    title: "Which ending should win?",
    options: [
      { id: "A", label: "Ending A", detail: "Maya leaves the city.", sharePct: 63 },
      { id: "B", label: "Ending B", detail: "Maya stays and confronts Arjun.", sharePct: 37 },
    ],
    votes: "1.2M",
    closesIn: "2 days",
  },
  {
    id: "floor-nine-ending",
    seriesSlug: "floor-nine",
    title: "How should Floor Nine close?",
    options: [
      { id: "A", label: "Ending A", detail: "The corridor stays empty.", sharePct: 45 },
      { id: "B", label: "Ending B", detail: "The timestamp never resets again.", sharePct: 55 },
    ],
    votes: "540K",
    closesIn: "5 days",
  },
];

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  /** How it is earned in this mock build. */
  earnedBy: "firstVote" | "explorer" | "predictions" | "thriller" | "romance" | "streak" | "earlyFan" | "collector";
};

export const badges: BadgeDef[] = [
  { id: "first-vote", name: "First Vote", description: "Shaped your first story moment", earnedBy: "firstVote" },
  { id: "story-explorer", name: "Story Explorer", description: "Voted across three different stories", earnedBy: "explorer" },
  { id: "prediction-master", name: "Prediction Master", description: "Made three predictions", earnedBy: "predictions" },
  { id: "thriller-expert", name: "Thriller Expert", description: "Deep in the thriller catalogue", earnedBy: "thriller" },
  { id: "romance-fan", name: "Romance Fan", description: "A soft spot for romance", earnedBy: "romance" },
  { id: "watch-streak", name: "7-Day Watch Streak", description: "Seven days in a row", earnedBy: "streak" },
  { id: "early-fan", name: "Early Fan", description: "Joined a story in its first week", earnedBy: "earlyFan" },
  { id: "character-collector", name: "Character Collector", description: "Followed five characters", earnedBy: "collector" },
];

export const moods = ["Romance", "Suspense", "Comedy", "Thriller", "Mystery"] as const;
export type Mood = (typeof moods)[number];

const moodGenres: Record<Mood, string[]> = {
  Romance: ["Romance"],
  Suspense: ["Thriller", "Mystery", "Supernatural"],
  Comedy: ["Comedy", "Campus"],
  Thriller: ["Thriller", "Revenge"],
  Mystery: ["Mystery", "Supernatural"],
};

export const seriesForMood = (mood: Mood): Series[] => {
  const wanted = moodGenres[mood];
  return getAll().filter((s) => s.genres.some((g) => wanted.includes(g)));
};

const getAll = (): Series[] =>
  [
    "rooftop-monsoon",
    "the-missing-phone",
    "messages-from-tomorrow",
    "floor-nine",
    "umbrella-hearts",
    "glass-tower",
    "lantern-village",
    "last-bench",
  ]
    .map((s) => getSeries(s))
    .filter((s): s is Series => Boolean(s));

/** "Because you love Mystery + Romance" — mock taste profile. */
export const tasteGenres = ["Mystery", "Romance"];

export const becauseYouLove = (): Series[] =>
  getAll().filter((s) => s.genres.some((g) => tasteGenres.includes(g))).slice(0, 6);

export const nextObsession = () => getSeries("messages-from-tomorrow")!;

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    kind: "vote",
    title: "Your story vote is live",
    body: "Rooftop Monsoon — Episode 6",
    time: "2m",
    href: { to: "/interactive" },
  },
  {
    id: "n2",
    kind: "closing",
    title: "Vote closing soon",
    body: "The Missing Phone — Episode 6",
    time: "18m",
    href: { to: "/watch/$slug", params: { slug: "the-missing-phone" }, search: { ep: 6 } },
  },
  {
    id: "n3",
    kind: "episode",
    title: "New episode available",
    body: "Floor Nine — Episode 7",
    time: "1h",
    href: { to: "/watch/$slug", params: { slug: "floor-nine" }, search: { ep: 7 } },
  },
  {
    id: "n4",
    kind: "prediction",
    title: "Your prediction was correct",
    body: "+50 XP · The Missing Phone",
    time: "3h",
    href: { to: "/series/$slug", params: { slug: "the-missing-phone" } },
  },
  {
    id: "n5",
    kind: "character",
    title: "Maya has a new episode",
    body: "The Missing Phone — Episode 7",
    time: "5h",
    href: { to: "/character/$id", params: { id: "maya" } },
  },
  {
    id: "n6",
    kind: "character",
    title: "New Maya moment",
    body: "Her most-shared scene of the season is live",
    time: "1d",
    href: { to: "/character/$id", params: { id: "maya" } },
  },
];

export const characterNotifications = (name: string) => [
  `${name} has a new episode`,
  `${name} appears in a new story`,
  `New ${name} moment`,
];

/** Base (pre-existing) profile stats the live session adds to. */
export const baseStats = {
  xp: 1240,
  episodesWatched: 42,
  storiesCompleted: 12,
  choicesMade: 27,
  predictions: 18,
  charactersFollowed: 14,
  creatorsFollowed: 8,
};

export const LEVEL_STEP = 155;
export const levelFor = (xp: number) => Math.max(1, Math.floor(xp / LEVEL_STEP));
export const levelTitle = (level: number) =>
  level >= 12 ? "Story Architect" : level >= 8 ? "Story Explorer" : level >= 4 ? "Story Seeker" : "New Viewer";
export const levelProgress = (xp: number) => (xp % LEVEL_STEP) / LEVEL_STEP;
