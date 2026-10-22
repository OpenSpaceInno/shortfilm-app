import poster1 from "@/assets/poster-1.jpg";
import poster2 from "@/assets/poster-2.jpg";
import poster3 from "@/assets/poster-3.jpg";
import poster4 from "@/assets/poster-4.jpg";
import poster5 from "@/assets/poster-5.jpg";
import poster6 from "@/assets/poster-6.jpg";

export type Episode = {
  id: string;
  number: number;
  title: string;
  durationSec: number;
  premium: boolean;
  progress?: number | undefined; // 0..1
};

export type Season = {
  id: string;
  number: number;
  title: string;
  episodes: Episode[];
};

export type Series = {
  slug: string;
  title: string;
  tagline: string;
  synopsis: string;
  poster: string;
  genres: string[];
  language: string;
  ageRating: string;
  episodeCount: number;
  views: string;
  premium: boolean;
  trending: boolean;
  seasons: Season[];
};

const epTitles = [
  "The First Look",
  "Missed Call",
  "Half Truths",
  "Rain Check",
  "The Confession",
  "Blocked",
  "Second Chance",
  "Last Episode",
];

function makeSeason(
  slug: string,
  seasonNo: number,
  count: number,
  freeCount: number,
  progressOn?: number,
): Season {
  return {
    id: `${slug}-s${seasonNo}`,
    number: seasonNo,
    title: `Season ${seasonNo}`,
    episodes: Array.from({ length: count }, (_, i) => ({
      id: `${slug}-s${seasonNo}e${i + 1}`,
      number: i + 1,
      title: epTitles[i % epTitles.length] ?? "Episode",
      durationSec: 30 + ((i * 15) % 30),
      premium: i + 1 > freeCount,
      progress: progressOn === i + 1 ? 0.42 : undefined,
    })),
  };
}

export const series: Series[] = [
  {
    slug: "rooftop-monsoon",
    title: "Rooftop Monsoon",
    tagline: "One terrace. Two strangers. Ten nights.",
    synopsis:
      "Aisha escapes her arranged-marriage countdown by climbing to the rooftop every night — until she finds someone already there.",
    poster: poster1,
    genres: ["Drama", "Romance"],
    language: "Hindi",
    ageRating: "16+",
    episodeCount: 8,
    views: "12.4M",
    premium: true,
    trending: true,
    seasons: [makeSeason("rooftop-monsoon", 1, 8, 3, 2)],
  },
  {
    slug: "umbrella-hearts",
    title: "Umbrella Hearts",
    tagline: "Love, on a two-minute forecast.",
    synopsis:
      "Every downpour brings them back to the same street corner. Neither of them owns an umbrella by choice.",
    poster: poster2,
    genres: ["Romance"],
    language: "Hindi",
    ageRating: "13+",
    episodeCount: 6,
    views: "8.9M",
    premium: false,
    trending: true,
    seasons: [makeSeason("umbrella-hearts", 1, 6, 6)],
  },
  {
    slug: "floor-nine",
    title: "Floor Nine",
    tagline: "Something walks the corridor at 3:04 AM.",
    synopsis:
      "A night-shift security guard notices the CCTV timestamp resets every night — and so does the man in the hallway.",
    poster: poster3,
    genres: ["Thriller", "Mystery"],
    language: "English",
    ageRating: "18+",
    episodeCount: 8,
    views: "15.1M",
    premium: true,
    trending: true,
    seasons: [makeSeason("floor-nine", 1, 8, 2, 5)],
  },
  {
    slug: "last-bench",
    title: "Last Bench",
    tagline: "Attendance optional. Chaos guaranteed.",
    synopsis:
      "Five friends, one failing semester, and a bet that decides who confesses first.",
    poster: poster4,
    genres: ["Comedy", "Campus"],
    language: "Hinglish",
    ageRating: "13+",
    episodeCount: 8,
    views: "6.2M",
    premium: false,
    trending: false,
    seasons: [makeSeason("last-bench", 1, 8, 8)],
  },
  {
    slug: "lantern-village",
    title: "Lantern Village",
    tagline: "The fog remembers every name.",
    synopsis:
      "A folklorist returns to her grandmother's village to record a lullaby that nobody is willing to sing twice.",
    poster: poster5,
    genres: ["Supernatural", "Mystery"],
    language: "Bengali",
    ageRating: "16+",
    episodeCount: 6,
    views: "4.7M",
    premium: true,
    trending: false,
    seasons: [makeSeason("lantern-village", 1, 6, 2)],
  },
  {
    slug: "glass-tower",
    title: "Glass Tower",
    tagline: "She signed the NDA. Not the surrender.",
    synopsis:
      "Fired at 9 AM, back on the 41st floor by Monday — this time on the other side of the table.",
    poster: poster6,
    genres: ["Drama", "Revenge"],
    language: "Hindi",
    ageRating: "16+",
    episodeCount: 8,
    views: "10.3M",
    premium: true,
    trending: true,
    seasons: [makeSeason("glass-tower", 1, 8, 3, 1)],
  },
  {
    slug: "the-missing-phone",
    title: "The Missing Phone",
    tagline: "One locked screen. Everyone's secrets.",
    synopsis:
      "Maya finds a stranger's phone on the 7:40 local. It keeps ringing — and every caller knows her name.",
    poster: poster3,
    genres: ["Mystery", "Thriller"],
    language: "Hindi",
    ageRating: "16+",
    episodeCount: 8,
    views: "18.9M",
    premium: false,
    trending: true,
    seasons: [makeSeason("the-missing-phone", 1, 8, 6, 5)],
  },
  {
    slug: "messages-from-tomorrow",
    title: "Messages From Tomorrow",
    tagline: "The voice notes arrive twelve hours early.",
    synopsis:
      "A night-shift coder starts receiving voice notes from her own future self, each one describing something that hasn't happened yet.",
    poster: poster2,
    genres: ["Mystery", "Romance"],
    language: "Telugu",
    ageRating: "13+",
    episodeCount: 8,
    views: "7.6M",
    premium: true,
    trending: true,
    seasons: [makeSeason("messages-from-tomorrow", 1, 8, 4)],
  },
];

export const genres = [
  "Romance",
  "Drama",
  "Thriller",
  "Comedy",
  "Mystery",
  "Supernatural",
  "Campus",
  "Revenge",
];

export const getSeries = (slug: string) => series.find((s) => s.slug === slug);

export const continueWatching = series
  .flatMap((s) =>
    (s.seasons[0]?.episodes ?? [])
      .filter((e) => e.progress !== undefined)
      .map((e) => ({ series: s, episode: e })),
  )
  .slice(0, 4);

export const trending = series.filter((s) => s.trending);
export const freeToWatch = series.filter((s) => !s.premium);

export const plans = [
  {
    id: "monthly",
    name: "Monthly",
    price: "₹149",
    period: "/month",
    note: "Cancel anytime",
    perks: ["All premium series", "Ad-free", "1080p portrait streaming"],
  },
  {
    id: "annual",
    name: "Annual",
    price: "₹999",
    period: "/year",
    note: "Save 44% · 7-day free trial",
    perks: [
      "All premium series",
      "Ad-free",
      "1080p portrait streaming",
      "Early access to new drops",
    ],
    best: true,
  },
];

export const formatDuration = (sec: number) =>
  `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, "0")}s`;
