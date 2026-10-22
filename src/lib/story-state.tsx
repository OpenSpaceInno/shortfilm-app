import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ChoiceOptionId } from "@/lib/interactive";

/**
 * Mock persistence for audience choices. Swap the read/write pair for a real
 * API later without changing any component.
 */

type ChoiceRecord = {
  choiceId: string;
  seriesSlug: string;
  episodeNumber: number;
  option: ChoiceOptionId;
  label: string;
  at: number;
};

type StoryState = {
  choices: ChoiceRecord[];
  recordChoice: (r: Omit<ChoiceRecord, "at">) => void;
  choiceFor: (choiceId: string) => ChoiceRecord | undefined;
  pathFor: (seriesSlug: string) => ChoiceOptionId | null;
  seriesWithChoices: string[];
  reset: () => void;
};

const KEY = "shortreel.story.choices.v1";
const Ctx = createContext<StoryState | null>(null);

export function StoryStateProvider({ children }: { children: ReactNode }) {
  const [choices, setChoices] = useState<ChoiceRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setChoices(JSON.parse(raw) as ChoiceRecord[]);
    } catch {
      /* ignore corrupt local state */
    }
  }, []);

  const persist = useCallback((next: ChoiceRecord[]) => {
    setChoices(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<StoryState>(
    () => ({
      choices,
      recordChoice: (r) =>
        persist([...choices.filter((c) => c.choiceId !== r.choiceId), { ...r, at: Date.now() }]),
      choiceFor: (id) => choices.find((c) => c.choiceId === id),
      pathFor: (slug) => {
        const forSeries = choices
          .filter((c) => c.seriesSlug === slug)
          .sort((a, b) => a.episodeNumber - b.episodeNumber);
        return forSeries.length ? (forSeries[forSeries.length - 1]!.option) : null;
      },
      seriesWithChoices: Array.from(new Set(choices.map((c) => c.seriesSlug))),
      reset: () => persist([]),
    }),
    [choices, persist],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStoryState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStoryState must be used inside StoryStateProvider");
  return ctx;
}
