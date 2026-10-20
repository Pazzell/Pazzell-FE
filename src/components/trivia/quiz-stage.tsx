"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Check, Square, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CountdownBar } from "@/components/ui/countdown-bar";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useBlockBackNavigation } from "@/hooks/use-block-back-navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { isSoundMuted, setSoundMuted, playSuccessSound, playWrongSound } from "@/lib/sound";
import { sessionExit } from "@/lib/session-exit";
import { BrandCta } from "@/components/trivia/brand-cta";
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
 * The quiz. The server only ever serves the current question and owns the
 * clock, so this just renders what it is given: a refresh lands on the same
 * question with the remaining time. In practice mode the server also says which
 * option is right, and a pointer marks it; answering works the same either way.
 * With a timer of 0 there is no countdown: after each answer the player moves on
 * with Next. End cancels the session.
 */
export function QuizStage({ session, onCompleted }: QuizStageProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [muted, setMuted] = useState(false);
  useEffect(() => setMuted(isSoundMuted()), []);

  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  // Without a countdown, the step after an answer waits for the Next button.
  const [nextStep, setNextStep] = useState<(() => void) | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
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
      setNextStep(null);
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
      } else {
        playWrongSound();
      }
      const next = () => {
        if (data.completed) {
          onCompleted(data.result);
        } else {
          fetchQuestion.mutate();
        }
      };
      if (question?.deadlineAt) {
        afterFeedback(next);
      } else {
        setNextStep(() => next);
      }
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

  const abandon = useMutation({
    mutationFn: () => api.post(ENDPOINTS.TRIVIA_SESSION_ABANDON(session.id)),
    onSuccess: () => router.push(sessionExit(session.source, session.isPreview).href),
    onError: () => toast.error("Couldn't end the quiz. Please try again."),
  });

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

  const brand = session.brand;
  // The pointer is shown only while the question is open; after an answer the usual
  // green and red feedback takes over.
  const pointerIndex = feedback ? undefined : question.correctOptionIndex;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white font-fredoka truncate">
            {session.source.title}
          </h1>
          {brand && (
            <p className="text-white/60 text-sm flex items-center gap-2 flex-wrap">
              {brand.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt="" className="h-5 w-5 rounded object-contain bg-white" />
              )}
              Sponsored by {brand.brandName}
              <BrandCta brand={brand} />
            </p>
          )}
        </div>
        <div className="flex items-center shrink-0">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmEnd(true)}
            disabled={abandon.isPending}
            className="ml-1 border-red-400/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />
            End
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title="End this quiz?"
        description="The quiz is cancelled. Your answers so far are not saved or scored."
        confirmLabel="End quiz"
        onConfirm={() => abandon.mutate()}
        pending={abandon.isPending}
        destructive
      />

      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm font-medium">
          Question {question.index + 1} of {question.total}
        </span>
        {session.practice && (
          <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-medium text-secondary">
            Practice
          </span>
        )}
      </div>

      {question.deadlineAt && (
        <CountdownBar
          key={question.index}
          deadlineAt={question.deadlineAt}
          servedAt={question.servedAt}
          serverTime={question.serverTime}
          timerSeconds={question.timerSeconds}
          onExpire={handleExpire}
        />
      )}

      <div className="flex flex-col items-center gap-5 py-2">
        {question.imageUrl && (
          // A light backdrop, so dark or transparent pictures stay readable on the dark page.
          <div className="rounded-2xl bg-gray-100 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt={question.text ?? "Question image"}
              className="max-h-56 w-auto max-w-full rounded-xl object-contain"
            />
          </div>
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
                  : selected === option.index || pointerIndex === option.index
                  ? "border-secondary bg-secondary/10"
                  : "border-white/10 bg-white/5 hover:border-white/30",
                locked ? "cursor-default" : "cursor-pointer active:scale-[0.98]"
              )}
            >
              <span className="flex items-center gap-2">
                {pointerIndex === option.index && (
                  <>
                    <span
                      aria-hidden="true"
                      data-testid="practice-pointer"
                      className={cn("text-xl leading-none", !reducedMotion && "animate-pulse")}
                    >
                      👉
                    </span>
                    <span className="sr-only">Correct answer: </span>
                  </>
                )}
                {option.text}
              </span>
              {isCorrect && <Check className="h-5 w-5 shrink-0 text-green-400" />}
              {isWrongPick && <X className="h-5 w-5 shrink-0 text-red-400" />}
            </button>
          );
        })}
      </div>

      {nextStep && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={() => {
              setNextStep(null);
              nextStep();
            }}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg px-10 py-6"
          >
            {question.index + 1 >= question.total ? "See result" : "Next"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
