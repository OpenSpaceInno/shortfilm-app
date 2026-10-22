import { getSeries, type Series } from "@/lib/catalog";

/**
 * Mock data + service layer for the interactive story engine (iteration 1).
 * Shaped like a future API response so components never touch raw fixtures.
 */

export type ChoiceOptionId = "A" | "B";

export type ChoiceOption = {
  id: ChoiceOptionId;
  label: string;
  detail: string;
  sharePct: number;
};

export type StoryChoice = {
  id: string;
  seriesSlug: string;
  episodeNumber: number;
  prompt: string;
  setup: string;
  options: ChoiceOption[];
  totalVotes: string;
  /** Seconds left on the audience vote, mocked. */
  closesInSec: number;
  status: "live" | "upcoming";
};

export type StoryNode = {
  id: string;
  label: string;
  episode: number;
  branch: ChoiceOptionId | null;
  kind: "episode" | "choice";
};

export const storyChoices: StoryChoice[] = [
  {
    id: "the-missing-phone-e6",
    seriesSlug: "the-missing-phone",
    episodeNumber: 6,
    prompt: "What should Maya do?",
    setup: "She has unlocked the phone and read the last message.",
    options: [
      { id: "A", label: "Tell Arjun everything", detail: "Trust him with the screenshots", sharePct: 67 },
      { id: "B", label: "Keep it a secret", detail: "Go back to the flat alone", sharePct: 33 },
    ],
    totalVotes: "2.4M",
    closesInSec: 58,
    status: "live",
  },
  {
    id: "the-missing-phone-e3",
    seriesSlug: "the-missing-phone",
    episodeNumber: 3,
    prompt: "Should Maya open the phone?",
    setup: "It has been ringing in her bag since the platform.",
    options: [
      { id: "A", label: "Open it", detail: "Find out who is calling", sharePct: 74 },
      { id: "B", label: "Destroy it", detail: "Some things stay buried", sharePct: 26 },
    ],
    totalVotes: "3.1M",
    closesInSec: 0,
    status: "live",
  },
  {
    id: "messages-from-tomorrow-e4",
    seriesSlug: "messages-from-tomorrow",
    episodeNumber: 4,
    prompt: "Should she reply to her future self?",
    setup: "The voice note arrived twelve hours before it made sense.",
    options: [
      { id: "A", label: "Reply", detail: "Ask what happens next", sharePct: 58 },
      { id: "B", label: "Ignore it", detail: "Delete and sleep", sharePct: 42 },
    ],
    totalVotes: "1.1M",
    closesInSec: 612,
    status: "live",
  },
  {
    id: "floor-nine-e5",
    seriesSlug: "floor-nine",
    episodeNumber: 5,
    prompt: "Whose shift does she cover?",
    setup: "Only one of them will be on floor nine at 3:04 AM.",
    options: [
      { id: "A", label: "Take the shift herself", detail: "See the corridor first-hand", sharePct: 61 },
      { id: "B", label: "Send Kabir", detail: "Watch it on the monitors", sharePct: 39 },
    ],
    totalVotes: "884K",
    closesInSec: 240,
    status: "live",
  },
  {
    id: "glass-tower-e4",
    seriesSlug: "glass-tower",
    episodeNumber: 4,
    prompt: "Which file does she leak?",
    setup: "Two folders. One ends a career, one ends a company.",
    options: [
      { id: "A", label: "The payroll ledger", detail: "Hit the CEO directly", sharePct: 52 },
      { id: "B", label: "The safety report", detail: "Protect the floor staff", sharePct: 48 },
    ],
    totalVotes: "0",
    closesInSec: 0,
    status: "upcoming",
  },
];

export const interactiveSlugs = Array.from(
  new Set(storyChoices.map((c) => c.seriesSlug)),
);

export const isInteractive = (slug: string) => interactiveSlugs.includes(slug);

export const interactiveSeries = (): Series[] =>
  interactiveSlugs.map((s) => getSeries(s)).filter((s): s is Series => Boolean(s));

/** The choice moment (if any) that fires at the end of this episode. */
export const getChoiceFor = (slug: string, episode: number) =>
  storyChoices.find(
    (c) => c.seriesSlug === slug && c.episodeNumber === episode && c.status === "live",
  );

export const choicesForSeries = (slug: string) =>
  storyChoices
    .filter((c) => c.seriesSlug === slug)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);

export const liveChoices = storyChoices.filter((c) => c.status === "live");
export const upcomingChoices = storyChoices.filter((c) => c.status === "upcoming");
export const endingSoon = liveChoices
  .filter((c) => c.closesInSec > 0 && c.closesInSec <= 900)
  .sort((a, b) => a.closesInSec - b.closesInSec);

/** Branching graph for a series, derived from its first live choice point. */
export const storyNodes = (slug: string): StoryNode[] => {
  const choice = choicesForSeries(slug).find((c) => c.status === "live");
  const split = choice?.episodeNumber ?? 4;
  const before: StoryNode[] = Array.from({ length: split }, (_, i) => ({
    id: `${slug}-e${i + 1}`,
    label: `Episode ${i + 1}`,
    episode: i + 1,
    branch: null,
    kind: "episode" as const,
  }));
  return [
    ...before,
    {
      id: `${slug}-choice`,
      label: choice?.prompt ?? "The choice",
      episode: split,
      branch: null,
      kind: "choice",
    },
    { id: `${slug}-${split + 1}A`, label: `Episode ${split + 1}A`, episode: split + 1, branch: "A", kind: "episode" },
    { id: `${slug}-${split + 1}B`, label: `Episode ${split + 1}B`, episode: split + 1, branch: "B", kind: "episode" },
    { id: `${slug}-${split + 2}A`, label: `Episode ${split + 2}A`, episode: split + 2, branch: "A", kind: "episode" },
    { id: `${slug}-${split + 2}B`, label: `Episode ${split + 2}B`, episode: split + 2, branch: "B", kind: "episode" },
  ];
};

export const splitEpisode = (slug: string) =>
  choicesForSeries(slug).find((c) => c.status === "live")?.episodeNumber ?? 4;

export const formatCountdown = (sec: number) => {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
};
