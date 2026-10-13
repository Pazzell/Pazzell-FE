"use client";

import { useEffect, useState } from "react";
import { Clock3, Image as ImageIcon, Layers, Loader2, Pointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useGameSettings } from "@/hooks/use-game-settings";
import {
  TRIVIA_IMAGE_PERCENT_STORAGE_KEY,
  TRIVIA_PRACTICE_STORAGE_KEY,
  TRIVIA_TIMER_STORAGE_KEY,
} from "@/hooks/use-start-trivia-session";
import { cn } from "@/lib/utils";
import type { CardMix } from "@/types";

const DEFAULT_CARD_COUNT = 10;
const IMAGE_PERCENT_STEP = 10;

interface SessionSetupProps {
  bounds: { min: number; max: number };
  /** Preferred starting values (e.g. a quiz creator's defaults); clamped to the allowed range. */
  defaultTimerSeconds?: number;
  defaultCardCount?: number;
  /** The source's pictures and definitions; the mix picker shows only when it has both. */
  cardMix?: CardMix;
  startLabel?: string;
  isStarting: boolean;
  onStart: (choice: SessionChoice) => void;
}

export interface SessionChoice {
  timerSeconds: number;
  cardCount: number;
  /** Share of picture cards; absent when the trivia has only one kind of card. */
  imagePercent?: number;
  practice: boolean;
}

/**
 * The choices made before any trivia starts: time per question, number of cards, the mix
 * of picture and short-definition questions, and whether to practise (the correct option is pointed at on every question).
 */
export function SessionSetup({
  bounds,
  defaultTimerSeconds,
  defaultCardCount,
  cardMix,
  startLabel = "Start Quiz",
  isStarting,
  onStart,
}: SessionSetupProps) {
  const { settings } = useGameSettings();
  const { minSeconds, maxSeconds, defaultSeconds } = settings.timer;

  const [timerSeconds, setTimerSeconds] = useState(defaultTimerSeconds ?? defaultSeconds);
  useEffect(() => {
    const stored = Number(localStorage.getItem(TRIVIA_TIMER_STORAGE_KEY));
    const preferred = defaultTimerSeconds ?? (stored || defaultSeconds);
    setTimerSeconds(Math.min(maxSeconds, Math.max(minSeconds, preferred)));
  }, [defaultTimerSeconds, defaultSeconds, minSeconds, maxSeconds]);

  const [cardCount, setCardCount] = useState(defaultCardCount ?? DEFAULT_CARD_COUNT);
  useEffect(() => {
    const preferred = defaultCardCount ?? DEFAULT_CARD_COUNT;
    setCardCount(Math.min(bounds.max, Math.max(bounds.min, preferred)));
  }, [defaultCardCount, bounds.min, bounds.max]);

  // The player's own last choice wins; until they make one, the trivia's default applies.
  const canMix = !!cardMix && cardMix.imageCards > 0 && cardMix.definitionCards > 0;
  const defaultImagePercent = cardMix?.defaultImagePercent ?? 0;
  const [imagePercent, setImagePercent] = useState(defaultImagePercent);
  const [mixChanged, setMixChanged] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem(TRIVIA_IMAGE_PERCENT_STORAGE_KEY);
    const preferred = stored === null || stored === "" ? defaultImagePercent : Number(stored);
    setImagePercent(Math.min(100, Math.max(0, Number.isFinite(preferred) ? preferred : defaultImagePercent)));
  }, [defaultImagePercent]);

  const [practice, setPractice] = useState(false);
  useEffect(() => {
    setPractice(localStorage.getItem(TRIVIA_PRACTICE_STORAGE_KEY) === "on");
  }, []);

  const handleStart = () => {
    localStorage.setItem(TRIVIA_TIMER_STORAGE_KEY, String(timerSeconds));
    localStorage.setItem(TRIVIA_PRACTICE_STORAGE_KEY, practice ? "on" : "off");
    if (canMix && mixChanged) {
      localStorage.setItem(TRIVIA_IMAGE_PERCENT_STORAGE_KEY, String(imagePercent));
    }
    onStart({ timerSeconds, cardCount, practice, ...(canMix ? { imagePercent } : {}) });
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

      {canMix && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-white/80 text-sm font-medium">
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Picture questions
            </span>
            <span className="text-white font-fredoka text-xl">{imagePercent}%</span>
          </div>
          <Slider
            aria-label="Picture questions"
            min={0}
            max={100}
            step={IMAGE_PERCENT_STEP}
            value={[imagePercent]}
            onValueChange={([v]) => {
              setImagePercent(v);
              setMixChanged(true);
            }}
          />
          <div className="flex justify-between text-xs text-white/40">
            <span>All short definitions</span>
            <span>All pictures</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <span
            id="practice-label"
            className="flex items-center gap-2 text-white/80 text-sm font-medium"
          >
            <Pointer className="h-4 w-4" />
            Practice
          </span>
          <p id="practice-hint" className="text-xs text-white/50">
            {practice
              ? "A pointer shows the correct option on every question."
              : "No hints: answer from what you know."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={practice}
          aria-labelledby="practice-label"
          aria-describedby="practice-hint"
          onClick={() => setPractice((on) => !on)}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
            practice ? "bg-secondary" : "bg-white/20"
          )}
        >
          <span
            className={cn(
              "absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform",
              practice && "translate-x-5"
            )}
          />
        </button>
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
