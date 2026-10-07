"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { CampaignGate } from "@/components/trivia/campaign-gate";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import {
  TRIVIA_TIMER_STORAGE_KEY,
  useStartTriviaSession,
} from "@/hooks/use-start-trivia-session";
import type { TriviaTopicsResponse } from "@/types";
import { ArrowLeft, Clock3, Layers, Loader2 } from "lucide-react";

const DEFAULT_CARD_COUNT = 10;

export default function TriviaTopicSetupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { settings } = useGameSettings();
  const { start, isStarting, gate } = useStartTriviaSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["trivia-topics"],
    queryFn: () =>
      api.get<TriviaTopicsResponse>(ENDPOINTS.TRIVIA_TOPICS).then((res) => res.data),
  });
  const topic = data?.topics.find((t) => t.id === id);

  const [timerSeconds, setTimerSeconds] = useState(settings.timer.matchDefaultSeconds);
  useEffect(() => {
    const stored = Number(localStorage.getItem(TRIVIA_TIMER_STORAGE_KEY));
    const clamp = (v: number) =>
      Math.min(settings.timer.maxSeconds, Math.max(settings.timer.minSeconds, v));
    setTimerSeconds(clamp(stored || settings.timer.matchDefaultSeconds));
  }, [settings.timer.matchDefaultSeconds, settings.timer.minSeconds, settings.timer.maxSeconds]);

  const bounds = topic?.cardCountBounds;
  const [cardCount, setCardCount] = useState(DEFAULT_CARD_COUNT);
  useEffect(() => {
    if (!bounds) return;
    setCardCount(Math.min(bounds.max, Math.max(bounds.min, DEFAULT_CARD_COUNT)));
  }, [bounds?.min, bounds?.max]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <PageLoader message="Loading topic..." />;
  }

  if (error || !topic || !bounds) {
    return (
      <PageError
        title="Topic not found"
        message="This topic does not exist or is no longer available."
        onRetry={() => router.push(routes.USER.TRIVIA)}
      />
    );
  }

  const handleStart = () => {
    localStorage.setItem(TRIVIA_TIMER_STORAGE_KEY, String(timerSeconds));
    start({ sourceType: "topic", sourceId: topic.id, timerSeconds, cardCount });
  };

  return (
    <MainLayout maxWidth="2xl">
      <div className="flex flex-col items-center gap-8 py-6">
        <button
          type="button"
          onClick={() => router.push(routes.USER.TRIVIA)}
          className="self-start text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          All topics
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white font-fredoka mb-2">{topic.name}</h1>
          {topic.description && <p className="text-white/70">{topic.description}</p>}
        </div>

        {gate ? (
          <CampaignGate campaign={gate} timerSeconds={timerSeconds} cardCount={cardCount} />
        ) : (
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
                min={settings.timer.minSeconds}
                max={settings.timer.maxSeconds}
                step={1}
                value={[timerSeconds]}
                onValueChange={([v]) => setTimerSeconds(v)}
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>{settings.timer.minSeconds}s</span>
                <span>{settings.timer.maxSeconds}s</span>
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
              {isStarting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Studying"}
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
