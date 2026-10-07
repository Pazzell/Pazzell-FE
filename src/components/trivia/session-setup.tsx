"use client";

import { useEffect, useState } from "react";
import { Clock3, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useGameSettings } from "@/hooks/use-game-settings";
import { TRIVIA_TIMER_STORAGE_KEY } from "@/hooks/use-start-trivia-session";

const DEFAULT_CARD_COUNT = 10;

interface SessionSetupProps {
  bounds: { min: number; max: number };
  /** Preferred starting values (e.g. a quiz creator's defaults); clamped to the allowed range. */
  defaultTimerSeconds?: number;
  defaultCardCount?: number;
  startLabel?: string;
  isStarting: boolean;
  onStart: (choice: { timerSeconds: number; cardCount: number }) => void;
}

/** The "time per question" and "number of cards" pickers shown before any trivia starts. */
export function SessionSetup({
  bounds,
  defaultTimerSeconds,
  defaultCardCount,
  startLabel = "Start Studying",
  isStarting,
  onStart,
}: SessionSetupProps) {
  const { settings } = useGameSettings();
  const { minSeconds, maxSeconds, matchDefaultSeconds } = settings.timer;

  const [timerSeconds, setTimerSeconds] = useState(defaultTimerSeconds ?? matchDefaultSeconds);
  useEffect(() => {
    const stored = Number(localStorage.getItem(TRIVIA_TIMER_STORAGE_KEY));
    const preferred = defaultTimerSeconds ?? (stored || matchDefaultSeconds);
    setTimerSeconds(Math.min(maxSeconds, Math.max(minSeconds, preferred)));
  }, [defaultTimerSeconds, matchDefaultSeconds, minSeconds, maxSeconds]);

  const [cardCount, setCardCount] = useState(defaultCardCount ?? DEFAULT_CARD_COUNT);
  useEffect(() => {
    const preferred = defaultCardCount ?? DEFAULT_CARD_COUNT;
    setCardCount(Math.min(bounds.max, Math.max(bounds.min, preferred)));
  }, [defaultCardCount, bounds.min, bounds.max]);

  const handleStart = () => {
    localStorage.setItem(TRIVIA_TIMER_STORAGE_KEY, String(timerSeconds));
    onStart({ timerSeconds, cardCount });
  };

  return (
    <div className="w-full max-w-sm space-y-8 bg-card/50 border border-white/10 rounded-2xl p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-white/80 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            Time per question
          </span>
          <span className="text-white font-fredoka text-xl">{timerSeconds} sec</span>
        </div>
        <Slider
          aria-label="Time per question"
          min={minSeconds}
          max={maxSeconds}
          step={1}
          value={[timerSeconds]}
          onValueChange={([v]) => setTimerSeconds(v)}
        />
        <div className="flex justify-between text-xs text-white/40">
          <span>{minSeconds}s</span>
          <span>{maxSeconds}s</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-white/80 text-sm font-medium">
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Number of cards
          </span>
          <span className="text-white font-fredoka text-xl">{cardCount}</span>
        </div>
        {bounds.max > bounds.min && (
          <>
            <Slider
              aria-label="Number of cards"
              min={bounds.min}
              max={bounds.max}
              step={1}
              value={[cardCount]}
              onValueChange={([v]) => setCardCount(v)}
            />
            <div className="flex justify-between text-xs text-white/40">
              <span>{bounds.min}</span>
              <span>{bounds.max}</span>
            </div>
          </>
        )}
      </div>

      <Button
        onClick={handleStart}
        disabled={isStarting}
        className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg py-6"
      >
        {isStarting ? <Loader2 className="h-5 w-5 animate-spin" /> : startLabel}
      </Button>
    </div>
  );
}
