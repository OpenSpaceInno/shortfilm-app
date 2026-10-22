import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  XP_RULES,
  baseStats,
  badges as badgeDefs,
  levelFor,
  type BadgeDef,
  type Mood,
} from "@/lib/engagement";
import { useStoryState } from "@/lib/story-state";
import { engagementApi, interactiveApi } from "@/lib/api-client";

/**
 * Mock engagement persistence: XP, predictions, followed characters,
 * battle votes and mood. Swap the read/write pair for a real API later.
 */

type PredictionRecord = { predictionId: string; optionId: string; at: number };
type BattleRecord = { battleId: string; option: "A" | "B"; at: number };

type Persisted = {
  xp: number;
  predictions: PredictionRecord[];
  battles: BattleRecord[];
  followedCharacters: string[];
  mood: Mood | null;
  readNotifications: string[];
  isVip?: boolean;
  activePlan?: string | null;
  subscriptionId?: string | null;
  billingInterval?: string | null;
  currentPeriodEnd?: string | null;
  entitlements?: string[];
  likedEpisodes?: Record<string, boolean>;
};

type XpToast = { id: number; amount: number; label: string };

type UpgradeVipOptions = {
  subscriptionId?: string | undefined;
  billingInterval?: string | undefined;
  currentPeriodEnd?: string | undefined;
  entitlements?: string[] | undefined;
};

type EngagementState = Persisted & {
  totalXp: number;
  level: number;
  awardXp: (rule: keyof typeof XP_RULES, label?: string) => void;
  predictionFor: (id: string) => PredictionRecord | undefined;
  makePrediction: (predictionId: string, optionId: string) => void;
  battleFor: (id: string) => BattleRecord | undefined;
  voteBattle: (battleId: string, option: "A" | "B") => void;
  isFollowing: (characterId: string) => boolean;
  toggleFollow: (characterId: string) => void;
  setMood: (mood: Mood | null) => void;
  markAllRead: () => void;
  unreadCount: number;
  earnedBadges: BadgeDef[];
  stats: typeof baseStats;
  toasts: XpToast[];
  isVip: boolean;
  activePlan: string | null;
  subscriptionId: string | null;
  billingInterval: string | null;
  currentPeriodEnd: string | null;
  entitlements: string[];
  upgradeToVip: (planName: string, options?: UpgradeVipOptions) => void;
  cancelVip: () => void;
  isEpisodeLiked: (episodeId: string) => boolean;
  toggleLikeEpisode: (episodeId: string) => boolean;
};

const KEY = "shortreel.engagement.v1";
const empty: Persisted = {
  xp: 0,
  predictions: [],
  battles: [],
  followedCharacters: [],
  mood: null,
  readNotifications: [],
  isVip: false,
  activePlan: null,
  subscriptionId: null,
  billingInterval: null,
  currentPeriodEnd: null,
  entitlements: [],
  likedEpisodes: {},
};

const Ctx = createContext<EngagementState | null>(null);

export function EngagementProvider({
  children,
  choiceCount = 0,
  choiceSeriesCount = 0,
}: {
  children: ReactNode;
  choiceCount?: number;
  choiceSeriesCount?: number;
}) {
  const [state, setState] = useState<Persisted>(empty);
  const [toasts, setToasts] = useState<XpToast[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...empty, ...(JSON.parse(raw) as Persisted) });
    } catch {
      /* ignore corrupt local state */
    }

    // Backend gamification sync & streak ping
    engagementApi.pingStreak().catch(() => {});
    engagementApi.getGamificationProfile().then((res) => {
      if (res?.success && res.data) {
        setState((prev) => ({
          ...prev,
          xp: Math.max(prev.xp, res.data.currentXp || res.data.xp || 0),
        }));
      }
    }).catch(() => {});
  }, []);

  const persist = useCallback((next: Persisted) => {
    setState(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const pushToast = useCallback((amount: number, label: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, amount, label }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }, []);

  const value = useMemo<EngagementState>(() => {
    const totalXp = baseStats.xp + state.xp;
    const level = levelFor(totalXp);

    const stats = {
      ...baseStats,
      xp: totalXp,
      choicesMade: baseStats.choicesMade + choiceCount,
      predictions: baseStats.predictions + state.predictions.length,
      charactersFollowed: baseStats.charactersFollowed + state.followedCharacters.length,
    };

    const earned = new Set<BadgeDef["earnedBy"]>(["streak", "earlyFan", "thriller", "romance"]);
    if (choiceCount > 0) earned.add("firstVote");
    if (choiceSeriesCount >= 2) earned.add("explorer");
    if (state.predictions.length >= 2) earned.add("predictions");
    if (state.followedCharacters.length >= 2) earned.add("collector");

    const awardXp = (rule: keyof typeof XP_RULES, label?: string) => {
      const amount = XP_RULES[rule];
      pushToast(amount, label ?? "XP earned");
      persist({ ...state, xp: state.xp + amount });
    };

    return {
      ...state,
      totalXp,
      level,
      stats,
      toasts,
      awardXp,
      predictionFor: (id) => state.predictions.find((p) => p.predictionId === id),
      makePrediction: (predictionId, optionId) => {
        const next = [
          ...state.predictions.filter((p) => p.predictionId !== predictionId),
          { predictionId, optionId, at: Date.now() },
        ];
        pushToast(XP_RULES.prediction, "Prediction made");
        persist({ ...state, predictions: next, xp: state.xp + XP_RULES.prediction });
        engagementApi.submitPrediction({ predictionId, optionId, wagerXp: 50 }).catch(() => {});
      },
      battleFor: (id) => state.battles.find((b) => b.battleId === id),
      voteBattle: (battleId, option) => {
        const next = [
          ...state.battles.filter((b) => b.battleId !== battleId),
          { battleId, option, at: Date.now() },
        ];
        pushToast(XP_RULES.vote, "Story battle vote");
        persist({ ...state, battles: next, xp: state.xp + XP_RULES.vote });
        interactiveApi.castVote({ choiceId: battleId, optionId: option }).catch(() => {});
      },
      isFollowing: (characterId) => state.followedCharacters.includes(characterId),
      toggleFollow: (characterId) => {
        const following = state.followedCharacters.includes(characterId);
        const next = following
          ? state.followedCharacters.filter((c) => c !== characterId)
          : [...state.followedCharacters, characterId];
        if (!following) pushToast(XP_RULES.followCharacter, "Character followed");
        persist({
          ...state,
          followedCharacters: next,
          xp: state.xp + (following ? 0 : XP_RULES.followCharacter),
        });
        engagementApi.toggleFollow({ targetType: 'CHARACTER', targetId: characterId }).catch(() => {});
      },
      setMood: (mood) => persist({ ...state, mood }),
      markAllRead: () => persist({ ...state, readNotifications: ["all"] }),
      unreadCount: state.readNotifications.includes("all") ? 0 : 3,
      earnedBadges: badgeDefs.filter((b) => earned.has(b.earnedBy)),
      isVip: Boolean(state.isVip),
      activePlan: state.activePlan ?? null,
      subscriptionId: state.subscriptionId ?? null,
      billingInterval: state.billingInterval ?? null,
      currentPeriodEnd: state.currentPeriodEnd ?? null,
      entitlements: state.entitlements ?? [],
      upgradeToVip: (planName: string, options?: UpgradeVipOptions) => {
        pushToast(100, "VIP Pass Activated!");
        persist({
          ...state,
          isVip: true,
          activePlan: planName,
          subscriptionId: options?.subscriptionId || state.subscriptionId || null,
          billingInterval: options?.billingInterval || state.billingInterval || null,
          currentPeriodEnd: options?.currentPeriodEnd || state.currentPeriodEnd || null,
          entitlements: options?.entitlements || state.entitlements || [],
          xp: state.xp + 100,
        });
      },
      cancelVip: () => {
        persist({
          ...state,
          isVip: false,
          activePlan: null,
          subscriptionId: null,
          billingInterval: null,
          currentPeriodEnd: null,
          entitlements: [],
        });
      },
      isEpisodeLiked: (episodeId: string) => Boolean(state.likedEpisodes?.[episodeId]),
      toggleLikeEpisode: (episodeId: string) => {
        const currentlyLiked = Boolean(state.likedEpisodes?.[episodeId]);
        const nextLiked = { ...(state.likedEpisodes || {}), [episodeId]: !currentlyLiked };
        if (!currentlyLiked) {
          pushToast(15, "Episode Liked!");
        }
        persist({
          ...state,
          likedEpisodes: nextLiked,
          xp: state.xp + (!currentlyLiked ? 15 : 0),
        });
        return !currentlyLiked;
      },
    };
  }, [state, toasts, persist, pushToast, choiceCount, choiceSeriesCount]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <XpToastLayer toasts={toasts} />
    </Ctx.Provider>
  );
}

function XpToastLayer({ toasts }: { toasts: XpToast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-in fade-in slide-in-from-bottom-2 rounded-full border border-primary/50 bg-card/95 px-4 py-2 shadow-lg backdrop-blur duration-300"
        >
          <span className="font-display text-base tracking-wide text-primary">+{t.amount} XP</span>
          <span className="ml-2 text-[11px] text-muted-foreground">{t.label}</span>
        </div>
      ))}
    </div>
  );
}

export function useEngagement() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEngagement must be used inside EngagementProvider");
  return ctx;
}

/** Feeds Iteration 1 choice data into the engagement layer. */
export function EngagementBridge({ children }: { children: ReactNode }) {
  const { choices, seriesWithChoices } = useStoryState();
  return (
    <EngagementProvider
      choiceCount={choices.length}
      choiceSeriesCount={seriesWithChoices.length}
    >
      {children}
    </EngagementProvider>
  );
}
