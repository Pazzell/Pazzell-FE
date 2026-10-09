"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import confetti from "canvas-confetti";
import { AlertTriangle, Check, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownBar } from "@/components/ui/countdown-bar";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useBlockBackNavigation } from "@/hooks/use-block-back-navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { isSoundMuted, setSoundMuted, playSuccessSound, playWrongSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type {
  AnswerOutcome,
  ApiErrorBody,
  TriviaAnswerResponse,
  TriviaQuestion,
  TriviaQuestionResponse,
  TriviaResult,
  TriviaSession,
} from "@/types";

const FEEDBACK_MS = 1200;

type Feedback = {
  kind: AnswerOutcome;
  selectedIndex?: number;
  correctIndex?: number;
} | null;

interface QuizStageProps {
  session: TriviaSession;
  /** Called when no questions remain; `result` is null if it still has to be fetched. */
  onCompleted: (result: TriviaResult | null) => void;
}

/**
 * The quiz phase. The server only ever serves the current question and owns
 * the clock, so this just renders what it is given: a refresh lands on the
 * same question with the remaining time.
 */
export function QuizStage({ session, onCompleted }: QuizStageProps) {
  const reducedMotion = useReducedMotion();

  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(isSoundMuted()), []);

  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  // Mirrors `locked` synchronously so a tap and a timer expiry can't both settle a question.
  const lockedRef = useRef(false);
  const lock = (value: boolean) => {
    lockedRef.current = value;
    setLocked(value);
  };

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);
  const afterFeedback = (next: () => void) => {
    advanceTimer.current = setTimeout(next, FEEDBACK_MS);
  };

  useBlockBackNavigation(true);

  // Presence pings feed the live-activity widget; failures are not worth surfacing.
  useEffect(() => {
    api.post(ENDPOINTS.ANALYTICS_GAME_START, { game: "trivia" }).catch(() => {});
    return () => {
      api.post(ENDPOINTS.ANALYTICS_GAME_STOP).catch(() => {});
    };
  }, []);

  const fetchQuestion = useMutation<TriviaQuestionResponse, AxiosError<ApiErrorBody>>({
    mutationFn: () =>
      api
        .get<TriviaQuestionResponse>(ENDPOINTS.TRIVIA_SESSION_QUESTION(session.id))
        .then((res) => res.data),
    onSuccess: (data) => {
      if (data.completed || !data.question) {
        onCompleted(data.result ?? null);
        return;
      }
      setQuestion(data.question);
      setSelected(null);
      setFeedback(null);
      lock(false);
    },
    onError: (error) => {
      if (error.response?.data?.code === "SESSION_NOT_ACTIVE") onCompleted(null);
    },
  });

  useEffect(() => {
    fetchQuestion.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitAnswer = useMutation({
    mutationFn: (payload: { questionIndex: number; optionIndex: number }) =>
      api
        .post<TriviaAnswerResponse>(ENDPOINTS.TRIVIA_SESSION_ANSWER(session.id), payload)
        .then((res) => res.data),
    onSuccess: (data, variables) => {
      setFeedback({
        kind: data.outcome,
        selectedIndex: variables.optionIndex,
        correctIndex: data.correctOptionIndex,
      });
      if (data.outcome === "correct") {
        playSuccessSound();
        if (!reducedMotion) {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#22C55E", "#4ADE80", "#86EFAC"],
          });
        }
      } else {
        playWrongSound();
      }
      afterFeedback(() => {
        if (data.completed) {
          onCompleted(data.result);
        } else {
          fetchQuestion.mutate();
        }
      });
    },
    // Whatever went wrong (stale index, finished session, network), the server knows the
    // current question — re-sync from it rather than leaving the board locked.
    onError: () => fetchQuestion.mutate(),
  });

  // One tap answers: the choice is final, like every other question in the app.
  const handlePick = (optionIndex: number) => {
    if (lockedRef.current || !question) return;
    lock(true);
    setSelected(optionIndex);
    submitAnswer.mutate({ questionIndex: question.index, optionIndex });
  };

  // Nothing submitted in time: the server has already failed the question.
  const handleExpire = () => {
    if (lockedRef.current) return;
    lock(true);
    setFeedback({ kind: "timeout" });
    playWrongSound();
    afterFeedback(() => fetchQuestion.mutate());
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  if (!question) {
    if (fetchQuestion.isError) {
      return (
        <PageError
          title="Couldn't load the question"
          message="Please check your connection and try again."
          onRetry={() => fetchQuestion.mutate()}
          withLayout={false}
        />
      );
    }
    return <PageLoader message="Loading question..." withLayout={false} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm font-medium">
          Question {question.index + 1} of {question.total}
        </span>
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
      </div>

      <CountdownBar
        key={question.index}
        deadlineAt={question.deadlineAt}
        servedAt={question.servedAt}
        serverTime={question.serverTime}
        timerSeconds={question.timerSeconds}
        onExpire={handleExpire}
      />

      <div className="flex flex-col items-center gap-5 py-2">
        {question.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.imageUrl}
            alt={question.text ?? "Question image"}
            className="max-h-56 w-auto max-w-full rounded-xl object-contain"
          />
        )}
        {question.imageUrl && question.attribution && (
          <p className="-mt-3 text-white/40 text-[11px] text-center max-w-md break-words">
            {question.attribution}
          </p>
        )}
        {question.text && (
          <p className="text-white text-lg sm:text-xl text-center font-medium max-w-md">
            {question.text}
          </p>
        )}
      </div>

      <div className="min-h-7" aria-live="polite">
        {feedback && (
          <div
            className={cn(
              "flex items-center justify-center gap-2 font-semibold text-lg",
              feedback.kind === "correct" ? "text-green-400" : "text-red-400"
            )}
          >
            {feedback.kind === "correct" ? (
              <>
                <Check className="h-5 w-5" /> Correct!
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5" />
                {feedback.kind === "timeout" ? "Time is up!" : "Not quite"}
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        {question.options.map((option) => {
          const isCorrect = feedback?.correctIndex === option.index;
          const isWrongPick = feedback && !isCorrect && feedback.selectedIndex === option.index;
          return (
            <button
              key={option.index}
              type="button"
              onClick={() => handlePick(option.index)}
              disabled={locked}
              aria-pressed={selected === option.index}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-4 text-left text-white transition-all",
                isCorrect
                  ? "border-green-400 bg-green-500/10 font-bold"
                  : isWrongPick
                  ? cn("border-red-400 bg-red-500/10", !reducedMotion && "animate-shake")
                  : selected === option.index
                  ? "border-secondary bg-secondary/10"
                  : "border-white/10 bg-white/5 hover:border-white/30",
                locked ? "cursor-default" : "cursor-pointer active:scale-[0.98]"
              )}
            >
              <span>{option.text}</span>
              {isCorrect && <Check className="h-5 w-5 shrink-0 text-green-400" />}
              {isWrongPick && <X className="h-5 w-5 shrink-0 text-red-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
