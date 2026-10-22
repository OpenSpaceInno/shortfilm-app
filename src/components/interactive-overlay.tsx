import { useEffect, useState } from "react";
import { ChoiceMeta, ChoiceResult, InteractiveChoice } from "@/components/interactive";
import type { ChoiceOptionId, StoryChoice } from "@/lib/interactive";

/**
 * Cinematic decision point shown over the vertical player.
 * Pure presentation — persistence is handled by the caller.
 */
export function InteractiveEpisodeOverlay({
  choice,
  existing,
  onSelect,
  onContinue,
  onDismiss,
}: {
  choice: StoryChoice;
  existing?: ChoiceOptionId | undefined;
  onSelect: (option: ChoiceOptionId) => void;
  onContinue: (option: ChoiceOptionId) => void;
  onDismiss: () => void;
}) {
  const [picked, setPicked] = useState<ChoiceOptionId | null>(existing ?? null);
  const [revealed, setRevealed] = useState(Boolean(existing));
  const [showResult, setShowResult] = useState(Boolean(existing));
  const [left, setLeft] = useState(choice.closesInSec || 58);

  useEffect(() => {
    if (showResult) return;
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [showResult]);

  const choose = (id: ChoiceOptionId) => {
    if (picked) return;
    setPicked(id);
    setRevealed(true);
    onSelect(id);
    setTimeout(() => setShowResult(true), 1100);
  };

  return (
    <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col justify-end bg-background/75 backdrop-blur-md duration-500">
      <button aria-label="Dismiss choice" className="flex-1" onClick={onDismiss} />
      <div className="animate-in slide-in-from-bottom rounded-t-3xl border-t border-primary/30 bg-gradient-to-b from-card to-background px-5 pt-6 pb-8 duration-500">
        {showResult && picked ? (
          <ChoiceResult choice={choice} option={picked} onContinue={() => onContinue(picked)} />
        ) : (
          <>
            <p className="text-center text-[11px] font-semibold tracking-[0.25em] text-primary uppercase">
              You decide what happens next
            </p>
            <h2 className="mt-2 text-center font-display text-3xl leading-tight tracking-wide text-foreground">
              {choice.prompt}
            </h2>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">{choice.setup}</p>

            <div className="mt-5 space-y-3">
              {choice.options.map((o) => (
                <InteractiveChoice
                  key={o.id}
                  option={o}
                  selected={picked === o.id}
                  disabled={picked !== null && picked !== o.id}
                  revealed={revealed}
                  onSelect={choose}
                />
              ))}
            </div>

            <div className="mt-4">
              <ChoiceMeta choice={choice} secondsLeft={left} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
