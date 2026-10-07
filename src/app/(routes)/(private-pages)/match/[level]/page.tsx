"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArtifactTile } from "@/components/match/artifact-tile";
import { CountdownBar } from "@/components/ui/countdown-bar";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import { useBlockBackNavigation } from "@/hooks/use-block-back-navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { isSoundMuted, setSoundMuted, playSuccessSound, playWrongSound } from "@/lib/sound";
import type {
  MatchAnswerResponse,
  MatchAttempt,
  MatchAttemptResponse,
  MatchFinishResponse,
  MatchLevelsResponse,
  MatchQuestion,
  MatchQuestionResponse,
  MatchResult,
} from "@/types";
import { Lock, Volume2, VolumeX, Check, X, Clock3, Trophy, RotateCcw, ArrowRight } from "lucide-react";

const TIMER_STORAGE_KEY = "pazzell_match_timer_seconds";

type Feedback = {
  kind: "correct" | "wrong" | "timeout";
  selectedOptionId?: string;
  correctOptionId?: string;
} | null;

export default function MatchLevelPage() {
  const params = useParams<{ level: string }>();
  const level = Number(params.level);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useGameSettings();
  const reducedMotion = useReducedMotion();

  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(isSoundMuted()), []);

  const [timerSeconds, setTimerSeconds] = useState(settings.timer.matchDefaultSeconds);
  useEffect(() => {
    const stored = Number(localStorage.getItem(TIMER_STORAGE_KEY));
    const clamp = (v: number) =>
      Math.min(settings.timer.maxSeconds, Math.max(settings.timer.minSeconds, v));
    setTimerSeconds(clamp(stored || settings.timer.matchDefaultSeconds));
  }, [settings.timer.matchDefaultSeconds, settings.timer.minSeconds, settings.timer.maxSeconds]);

  const [attempt, setAttempt] = useState<MatchAttempt | null>(null);
  const [question, setQuestion] = useState<MatchQuestion | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  // Mirrors `locked` synchronously so a tap and a timer expiry can't both settle a question.
  const lockedRef = useRef(false);
  const lock = (value: boolean) => {
    lockedRef.current = value;
    setLocked(value);
  };

  useBlockBackNavigation(Boolean(attempt && !result));

  // Presence pings feed the live-activity widget; failures are not worth surfacing.
  const playing = Boolean(attempt && !result);
  useEffect(() => {
    if (!playing) return;
    api.post(ENDPOINTS.ANALYTICS_GAME_START, { game: "match" }).catch(() => {});
    return () => {
      api.post(ENDPOINTS.ANALYTICS_GAME_STOP).catch(() => {});
    };
  }, [playing]);

  // A finished attempt changes lock/progress state on the level map.
  useEffect(() => {
    if (result) queryClient.invalidateQueries({ queryKey: ["match-levels"] });
  }, [result, queryClient]);

  const { data: levelsData, isLoading: loadingLevels, error: levelsError } = useQuery({
    queryKey: ["match-levels"],
    queryFn: () => api.get<MatchLevelsResponse>(ENDPOINTS.MATCH_LEVELS).then((res) => res.data),
  });

  const levelInfo = levelsData?.levels.find((l) => l.level === level);

  const fetchQuestion = useMutation({
    mutationFn: (attemptId: string) =>
      api
        .get<MatchQuestionResponse>(ENDPOINTS.MATCH_ATTEMPT_QUESTION(attemptId))
        .then((res) => res.data),
    onSuccess: (data) => {
      setAttempt(data.attempt);
      if (data.completed) {
        setQuestion(null);
        if (data.result) {
          setResult(data.result);
        } else {
          finishAttempt.mutate(data.attempt.id);
        }
      } else {
        setQuestion(data.question ?? null);
        lock(false);
        setFeedback(null);
      }
    },
    onError: () => {
      toast.error("Couldn't load the next question. Please try again.");
      setQuestion(null);
      setAttempt(null);
    },
  });

  const finishAttempt = useMutation({
    mutationFn: (attemptId: string) =>
      api.post<MatchFinishResponse>(ENDPOINTS.MATCH_ATTEMPT_FINISH(attemptId)).then((res) => res.data),
    onSuccess: (data) => setResult(data.result),
    onError: () => {
      toast.error("Couldn't load your result. Please try again.");
      setQuestion(null);
      setAttempt(null);
    },
  });

  const startAttempt = useMutation({
    mutationFn: (payload: { timerSeconds: number; restart: boolean }) =>
      api
        .post<MatchAttemptResponse>(ENDPOINTS.MATCH_LEVEL_ATTEMPTS(level), payload)
        .then((res) => res.data),
    onSuccess: (data) => {
      setAttempt(data.attempt);
      setResult(null);
      fetchQuestion.mutate(data.attempt.id);
      queryClient.invalidateQueries({ queryKey: ["match-levels"] });
    },
    onError: (error: { response?: { data?: { code?: string; message?: string } } }) => {
      if (error.response?.data?.code === "LEVEL_LOCKED") {
        queryClient.invalidateQueries({ queryKey: ["match-levels"] });
      }
      toast.error(error.response?.data?.message || "Couldn't start this level. Please try again.");
    },
  });

  // Auto-resume a level that already has an attempt in progress.
  useEffect(() => {
    if (levelInfo?.activeAttemptId && !attempt && !startAttempt.isPending) {
      startAttempt.mutate({ timerSeconds, restart: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelInfo?.activeAttemptId]);

  const submitAnswer = useMutation({
    mutationFn: (payload: { attemptId: string; questionIndex: number; optionId: string }) =>
      api
        .post<MatchAnswerResponse>(ENDPOINTS.MATCH_ATTEMPT_ANSWER(payload.attemptId), {
          questionIndex: payload.questionIndex,
          optionId: payload.optionId,
        })
        .then((res) => res.data),
    onSuccess: (data, variables) => {
      setFeedback({
        kind: data.outcome,
        selectedOptionId: variables.optionId,
        correctOptionId: data.correctOptionId,
      });
      if (data.outcome === "correct") {
        playSuccessSound();
        if (!reducedMotion) {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        playWrongSound();
      }
      setTimeout(() => {
        if (data.completed) {
          if (data.result) {
            setResult(data.result);
          } else {
            finishAttempt.mutate(variables.attemptId);
          }
        } else {
          fetchQuestion.mutate(variables.attemptId);
        }
      }, 1200);
    },
    // Whatever went wrong (stale index, expired attempt, network), the server knows the
    // current question — re-sync from it rather than leaving the board locked.
    onError: (_error, variables) => fetchQuestion.mutate(variables.attemptId),
  });

  const handleTap = (optionId: string) => {
    if (lockedRef.current || !attempt || !question) return;
    lock(true);
    submitAnswer.mutate({ attemptId: attempt.id, questionIndex: question.index, optionId });
  };

  const handleExpire = () => {
    if (lockedRef.current || !attempt) return;
    lock(true);
    setFeedback({ kind: "timeout" });
    playWrongSound();
    setTimeout(() => fetchQuestion.mutate(attempt.id), 1100);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  const handleStart = () => {
    localStorage.setItem(TIMER_STORAGE_KEY, String(timerSeconds));
    startAttempt.mutate({ timerSeconds, restart: false });
  };

  const handleRetry = () => {
    setResult(null);
    setQuestion(null);
    startAttempt.mutate({ timerSeconds: attempt?.timerSeconds ?? timerSeconds, restart: true });
  };

  const handleNextLevel = () => {
    router.push(routes.USER.MATCH_LEVEL(result?.nextLevel ?? level + 1));
  };

  const muteButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleMute}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      className="text-white/60 hover:text-white"
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </Button>
  );

  if (loadingLevels) {
    return <PageLoader message="Loading level..." />;
  }

  if (levelsError || !levelInfo) {
    return <PageError title="Level not found" message="This level does not exist." />;
  }

  if (!levelInfo.unlocked) {
    return (
      <MainLayout maxWidth="3xl">
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <Lock className="h-12 w-12 text-white/40" />
          <h1 className="text-2xl font-bold text-white font-fredoka">Level Locked</h1>
          <p className="text-white/60 max-w-sm">
            Answer every question in the previous level correctly to unlock this one.
          </p>
          <Button onClick={() => router.push(routes.USER.MATCH)} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
            Back to Levels
          </Button>
        </div>
      </MainLayout>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────
  if (result) {
    return (
      <MainLayout maxWidth="3xl">
        <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
          <div
            className={`p-5 rounded-full ${
              result.passed ? "bg-green-500/20" : "bg-yellow-500/20"
            }`}
          >
            <Trophy
              className={`h-12 w-12 ${result.passed ? "text-green-400" : "text-yellow-400"}`}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white font-fredoka mb-2">
              {result.passed ? "Level Complete!" : "Nice Try!"}
            </h1>
            <p className="text-white/70">
              You got {result.correct} out of {result.total} correct.
            </p>
          </div>
          <div className="flex gap-4 flex-wrap justify-center">
            <Button
              onClick={handleRetry}
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            {result.nextLevelUnlocked && (
              <Button
                onClick={handleNextLevel}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                Next Level
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Setup screen ───────────────────────────────────────────────────────
  if (!attempt || !question) {
    const isResuming = Boolean(levelInfo.activeAttemptId);
    return (
      <MainLayout maxWidth="2xl">
        <div className="flex flex-col items-center gap-8 py-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white font-fredoka mb-2">
              Level {levelInfo.level}
              {levelInfo.name ? `: ${levelInfo.name}` : ""}
            </h1>
            <p className="text-white/70">
              {isResuming
                ? "Resuming your attempt..."
                : `${levelInfo.questionCount} matches to complete`}
            </p>
          </div>

          {isResuming || startAttempt.isPending || fetchQuestion.isPending ? (
            <PageLoader message="Loading..." withLayout={false} />
          ) : (
            <div className="w-full max-w-sm space-y-6 bg-card/50 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <Clock3 className="h-4 w-4" />
                Time per question
              </div>
              <div className="flex items-center justify-center">
                <span className="text-5xl font-bold text-white font-fredoka">
                  {timerSeconds}
                </span>
                <span className="text-white/60 ml-2">sec</span>
              </div>
              <Slider
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
              <Button
                onClick={handleStart}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg py-6"
              >
                Start
              </Button>
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // ── Question screen ────────────────────────────────────────────────────
  return (
    <MainLayout maxWidth="3xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm font-medium">
            Question {question.index + 1} of {question.total}
          </span>
          {muteButton}
        </div>

        <CountdownBar
          key={question.index}
          deadlineAt={question.deadlineAt}
          servedAt={question.servedAt}
          serverTime={question.serverTime}
          timerSeconds={question.timerSeconds}
          onExpire={handleExpire}
        />

        <div className="flex flex-col items-center gap-4 py-4">
          <span className="text-white/60 text-sm uppercase tracking-wider">Match this</span>
          <ArtifactTile artifact={question.target} size="lg" />
        </div>

        {feedback && (
          <div
            className={`flex items-center justify-center gap-2 font-semibold text-lg ${
              feedback.kind === "correct" ? "text-green-400" : "text-red-400"
            }`}
            aria-live="polite"
          >
            {feedback.kind === "correct" ? (
              <>
                <Check className="h-5 w-5" /> Correct!
              </>
            ) : feedback.kind === "timeout" ? (
              <>
                <X className="h-5 w-5" /> Time is up!
              </>
            ) : (
              <>
                <X className="h-5 w-5" /> Not quite
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          {question.options.map((option) => {
            const tileFeedback =
              feedback && option.id === feedback.correctOptionId
                ? "correct"
                : feedback && option.id === feedback.selectedOptionId
                ? "wrong"
                : null;
            return (
              <ArtifactTile
                key={option.id}
                artifact={option}
                onClick={() => handleTap(option.id)}
                disabled={locked}
                feedback={tileFeedback}
                reducedMotion={reducedMotion}
              />
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
