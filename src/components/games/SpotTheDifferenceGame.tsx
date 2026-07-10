"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { endpointUrl, markPlayedToday } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { CampaignData } from "@/types";
import { useMutation } from "@tanstack/react-query";
import {
  Play,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Trophy,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { routes } from "@/app/_utils/routes";

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const NUM_DIFFS = 10;
// Extra hit area around each zone border (in normalized units)
const HIT_PADDING = 0.02;

interface DiffZone {
  id: string;
  cx: number; // normalized centre x (0–1)
  cy: number; // normalized centre y (0–1)
  w: number;  // normalized width  (0–1)
  h: number;  // normalized height (0–1)
  color: string;
}

const DIFF_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFEAA7", "#DDA0DD",
  "#98D8AA", "#FF8B64", "#C3B1E1", "#F4D35E", "#EE6C4D",
];

// Spread zones across a 4×3 grid (12 cells) so 10 differences are well distributed.
function generateDiffZones(n: number): DiffZone[] {
  const COLS = 4;
  const ROWS = 3;
  const allCells: [number, number][] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      allCells.push([c, r]);

  const cells = allCells.sort(() => Math.random() - 0.5).slice(0, n);

  return cells.map(([col, row], i) => {
    const colStep = 1 / COLS;
    const rowStep = 1 / ROWS;
    const pad = 0.02;
    const w = 0.05 + Math.random() * 0.04; // 0.05–0.09
    const h = 0.05 + Math.random() * 0.03; // 0.05–0.08
    const cx =
      col * colStep + pad + w / 2 + Math.random() * Math.max(0, colStep - w - pad * 2);
    const cy =
      row * rowStep + pad + h / 2 + Math.random() * Math.max(0, rowStep - h - pad * 2);
    return {
      id: `d${i}`,
      cx: Math.min(Math.max(cx, w / 2 + 0.01), 1 - w / 2 - 0.01),
      cy: Math.min(Math.max(cy, h / 2 + 0.01), 1 - h / 2 - 0.01),
      w,
      h,
      color: DIFF_COLORS[i % DIFF_COLORS.length],
    };
  });
}

type GamePhase = "idle" | "playing" | "quiz" | "success";

interface WrongClick {
  id: number;
  x: number;
  y: number;
}

interface Props {
  campaignDetails: CampaignData;
  campaignId: string;
  previewMode?: boolean;
  availableCampaigns?: unknown[];
  hasCompleted?: boolean;
  // v2 session flow: when set, the game reports completion to the session
  // orchestrator instead of showing its own embedded quiz/submit UI.
  sessionMode?: boolean;
  onGameComplete?: (movesTaken: number, timeTakenMs: number) => void;
}

export function SpotTheDifferenceGame({
  campaignDetails,
  campaignId,
  previewMode = false,
  hasCompleted = false,
  sessionMode = false,
  onGameComplete,
}: Props) {
  const user = useAtomValue(userAtom);
  const router = useRouter();

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [diffZones, setDiffZones] = useState<DiffZone[]>([]);
  const [foundIds, setFoundIds] = useState<Set<string>>(new Set());
  const [wrongClicks, setWrongClicks] = useState<WrongClick[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [showAlreadyPlayedModal, setShowAlreadyPlayedModal] =
    useState(hasCompleted);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState(0);

  const rightPanelRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrongClickCounter = useRef(0);

  useEffect(() => {
    if (hasCompleted) setShowAlreadyPlayedModal(true);
  }, [hasCompleted]);

  useEffect(() => {
    if (phase === "playing" && startedAt !== null) {
      timerRef.current = setInterval(
        () => setElapsedMs(Date.now() - startedAt),
        1000
      );
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, startedAt]);

  const submitMutation = useMutation({
    mutationFn: async (payload: {
      timeTaken: number;
      movesTaken: number;
      solved: boolean;
      answers: number[];
      differencesFound: { x: number; y: number; width: number; height: number }[];
    }) =>
      axios.post(endpointUrl(ENDPOINTS.SUBMIT_CAMPAIGN(campaignId)), payload, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      }),
    onSuccess: (response) => {
      const attempt = response.data?.attempt;
      setPointsEarned(attempt?.pointsEarned ?? 0);
      markPlayedToday(campaignId);
      setPhase("success");
    },
    onError: (err) => console.error("Failed to submit game results:", err),
  });

  const resetPlayState = () => {
    setDiffZones([]);
    setFoundIds(new Set());
    setWrongClicks([]);
    setElapsedMs(0);
    setStartedAt(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizAnswers([]);
    setShowQuizResults(false);
    setQuizAttempts(0);
  };

  const handleStartGame = () => {
    resetPlayState();
    setDiffZones(generateDiffZones(NUM_DIFFS));
    setStartedAt(Date.now());
    setPhase("playing");
  };

  const handleConfirmBack = () => {
    setShowBackWarning(false);
    resetPlayState();
    setPhase("idle");
  };

  const handleRightPanelClick = (e: React.MouseEvent) => {
    if (!rightPanelRef.current || phase !== "playing") return;
    const rect = rightPanelRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const hit = diffZones.find(
      (zone) =>
        !foundIds.has(zone.id) &&
        Math.abs(x - zone.cx) < zone.w / 2 + HIT_PADDING &&
        Math.abs(y - zone.cy) < zone.h / 2 + HIT_PADDING
    );

    if (hit) {
      setFoundIds((prev) => new Set([...prev, hit.id]));
    } else {
      const id = ++wrongClickCounter.current;
      setWrongClicks((prev) => [...prev, { id, x, y }]);
      setTimeout(
        () => setWrongClicks((prev) => prev.filter((c) => c.id !== id)),
        900
      );
    }
  };

  const allFound = foundIds.size >= NUM_DIFFS;

  const handleAnswerSelect = (choiceIndex: number) => {
    setSelectedAnswer(choiceIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    const questions = campaignDetails.questions || [];
    const newAnswers = [...quizAnswers, selectedAnswer];
    setQuizAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      setShowQuizResults(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setQuizAnswers([]);
    setSelectedAnswer(null);
    setShowQuizResults(false);
    setQuizAttempts((prev) => prev + 1);
  };

  const handleSubmit = (finalAnswers: number[]) => {
    if (previewMode) {
      setPhase("success");
      return;
    }
    submitMutation.mutate({
      timeTaken: elapsedMs,
      movesTaken: foundIds.size,
      solved: true,
      answers: finalAnswers,
      differencesFound: Array.from(foundIds).map((id) => {
        const z = diffZones.find((z) => z.id === id)!;
        return { x: z.cx, y: z.cy, width: z.w, height: z.h };
      }),
    });
  };

  const questions = campaignDetails.questions || [];

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="max-w-7xl mx-auto">
        {showAlreadyPlayedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-card border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-5">
              <div className="flex items-center gap-3 text-yellow-400">
                <Info className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-lg font-bold font-fredoka">Already Played</h3>
              </div>
              <p className="text-white/80 leading-relaxed">
                You&apos;ve already completed this puzzle. You can play again for
                fun, but{" "}
                <span className="text-yellow-300 font-semibold">
                  no additional points will be awarded
                </span>{" "}
                for repeat plays.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={() => router.push(routes.CAMPAIGNS)}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  onClick={() => setShowAlreadyPlayedModal(false)}>
                  Play Anyway
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-16 gap-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white font-fredoka">
              Spot the Difference
            </h2>
            <p className="text-white/70 max-w-md">
              Find all {NUM_DIFFS} differences between the two images. Click each
              difference to mark it, then proceed to the quiz.
            </p>
          </div>

          {campaignDetails.puzzleImageUrl && (
            <div className="w-full max-w-2xl rounded-xl overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={campaignDetails.puzzleImageUrl}
                alt={campaignDetails.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <Button
            onClick={handleStartGame}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-12 py-6 text-lg font-semibold rounded-full font-fredoka flex items-center gap-3">
            <Play className="w-6 h-6 fill-current" />
            Play Now
          </Button>
        </div>
      </div>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-card/80 backdrop-blur-sm border border-white/10 rounded-2xl p-10 max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white font-fredoka">
              Puzzle Complete!
            </h2>
            <p className="text-white/70">Great job! Here&apos;s your summary:</p>

            {pointsEarned === 0 && (
              <div className="bg-yellow-500/15 border border-yellow-500/40 rounded-xl px-4 py-3 text-sm text-yellow-200/90 text-center">
                You already earned points for this campaign today. Come back tomorrow for more!
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold text-white font-mono">
                  {pointsEarned}
                </span>
                <span className="text-xs text-white/60">Points</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                <Target className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold text-white font-mono">
                  {foundIds.size}
                </span>
                <span className="text-xs text-white/60">Found</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                <Clock className="w-6 h-6 text-purple-400" />
                <span className="text-2xl font-bold text-white font-mono">
                  {formatTime(elapsedMs)}
                </span>
                <span className="text-xs text-white/60">Time</span>
              </div>
            </div>

            <Button
              onClick={() => router.push(routes.CAMPAIGNS)}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 font-fredoka text-base">
              Back to Campaigns
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    const total = questions.length;
    const score = quizAnswers.reduce((acc, a, i) =>
      acc + (a === questions[i]?.correctIndex ? 1 : 0), 0);
    const allCorrect = score === total;
    const current = questions[currentQuestionIndex];

    if (showQuizResults) {
      return (
        <div className="max-w-2xl mx-auto py-8">
          <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-6 text-center">
            <h2 className="text-2xl font-bold text-white font-fredoka">Quiz Results</h2>
            <div className={`text-6xl font-bold font-fredoka ${allCorrect ? 'text-green-400' : 'text-secondary'}`}>
              {score}/{total}
            </div>
            {allCorrect ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                <p className="text-white font-bold text-xl font-fredoka">Perfect Score!</p>
                <p className="text-white/70">You answered all questions correctly. Submit to claim your points!</p>
                {submitMutation.isError && (
                  <p className="text-red-400 text-sm">Submission failed — please try again.</p>
                )}
                <Button
                  onClick={() => handleSubmit(quizAnswers)}
                  disabled={submitMutation.isPending}
                  className="px-10 py-5 text-lg font-fredoka bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-2 mx-auto">
                  {submitMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
                  ) : (
                    "Submit & See Results"
                  )}
                </Button>
              </>
            ) : (
              <>
                <p className="text-white/80">You need a perfect score to complete the challenge.</p>
                <p className="text-white/60 text-sm">{quizAttempts > 0 ? `Attempt #${quizAttempts + 1}` : 'Give it another shot!'}</p>
                <Button
                  onClick={restartQuiz}
                  className="px-10 py-4 font-fredoka bg-secondary hover:bg-secondary/80 text-secondary-foreground mx-auto">
                  Try Again
                </Button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="flex gap-1.5">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    i < currentQuestionIndex ? "bg-secondary" : i === currentQuestionIndex ? "bg-white" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          {campaignDetails.passage && (
            <div
              className="bg-white/5 border border-white/10 rounded-lg p-4 select-none"
              onContextMenu={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
            >
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2 font-semibold">Read the passage</p>
              <p className="text-white/80 text-sm leading-relaxed">{campaignDetails.passage}</p>
            </div>
          )}

          <h3 className="text-xl font-bold text-white font-fredoka">{current.question}</h3>

          <div className="space-y-3">
            {current.choices.map((choice, idx) => (
              <button
                key={idx}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 text-white ${
                  selectedAnswer === idx
                    ? "bg-secondary/20 border-secondary"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                }`}
                onClick={() => handleAnswerSelect(idx)}>
                <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span>{" "}{choice}
              </button>
            ))}
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="w-full py-3 font-fredoka text-base bg-secondary hover:bg-secondary/80 text-secondary-foreground">
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      {showBackWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold font-fredoka">Restart Game?</h3>
            </div>
            <p className="text-white/70">
              Going back will restart the game. All your progress will be lost.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                onClick={() => setShowBackWarning(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={handleConfirmBack}>
                Restart
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 bg-card/30 rounded-xl px-4 py-3 border border-white/10">
        <button
          onClick={() => setShowBackWarning(true)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white/80">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-mono">
              {foundIds.size}/{NUM_DIFFS} found
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-mono">{formatTime(elapsedMs)}</span>
          </div>
        </div>

        <Button
          onClick={() => {
            if (sessionMode) {
              onGameComplete?.(foundIds.size, elapsedMs);
            } else {
              setPhase("quiz");
            }
          }}
          disabled={!allFound}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-2 text-sm font-fredoka disabled:opacity-40 disabled:cursor-not-allowed">
          {allFound ? "Proceed →" : `Find ${NUM_DIFFS - foundIds.size} more`}
        </Button>
      </div>

      {/* Images grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: original */}
        <div className="bg-card/50 rounded-xl overflow-hidden border border-white/10">
          <div className="px-3 py-2 text-sm text-white/70 font-medium border-b border-white/10">
            Original
          </div>
          <div className="relative">
            {campaignDetails.puzzleImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaignDetails.puzzleImageUrl}
                alt="original"
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-white/50">
                No image available
              </div>
            )}
            {/* Reveal found zones on the original image */}
            {diffZones
              .filter((z) => foundIds.has(z.id))
              .map((zone) => (
                <div
                  key={zone.id}
                  className="absolute border-2 border-green-400 rounded pointer-events-none"
                  style={{
                    left: `${(zone.cx - zone.w / 2) * 100}%`,
                    top: `${(zone.cy - zone.h / 2) * 100}%`,
                    width: `${zone.w * 100}%`,
                    height: `${zone.h * 100}%`,
                  }}>
                  <CheckCircle className="absolute -top-2 -right-2 w-4 h-4 text-green-400 bg-card rounded-full" />
                </div>
              ))}
          </div>
        </div>

        {/* Right: same image + colour-blend overlays as the "differences" */}
        <div className="bg-card/50 rounded-xl overflow-hidden border border-white/10">
          <div className="px-3 py-2 text-sm text-white/70 font-medium border-b border-white/10">
            Find the differences
          </div>
          <div
            ref={rightPanelRef}
            onClick={handleRightPanelClick}
            className="relative cursor-crosshair select-none">
            {campaignDetails.puzzleImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaignDetails.puzzleImageUrl}
                alt="find differences"
                className="w-full h-auto object-contain pointer-events-none"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-white/50">
                No image available
              </div>
            )}

            {/* Colour-blend overlays — create a hue shift visible to the eye */}
            {diffZones.map((zone) => {
              const isFound = foundIds.has(zone.id);
              return (
                <div
                  key={zone.id}
                  className="absolute rounded pointer-events-none transition-opacity duration-300"
                  style={{
                    left: `${(zone.cx - zone.w / 2) * 100}%`,
                    top: `${(zone.cy - zone.h / 2) * 100}%`,
                    width: `${zone.w * 100}%`,
                    height: `${zone.h * 100}%`,
                    backgroundColor: zone.color,
                    opacity: isFound ? 0 : 0.6,
                    mixBlendMode: "hue" as React.CSSProperties["mixBlendMode"],
                  }}
                />
              );
            })}

            {/* Green rings for found zones */}
            {diffZones
              .filter((z) => foundIds.has(z.id))
              .map((zone) => (
                <div
                  key={`found-${zone.id}`}
                  className="absolute border-2 border-green-400 rounded pointer-events-none"
                  style={{
                    left: `${(zone.cx - zone.w / 2) * 100}%`,
                    top: `${(zone.cy - zone.h / 2) * 100}%`,
                    width: `${zone.w * 100}%`,
                    height: `${zone.h * 100}%`,
                  }}>
                  <CheckCircle className="absolute -top-2 -right-2 w-4 h-4 text-green-400 bg-card rounded-full" />
                </div>
              ))}

            {/* Wrong-click indicators (fade out after 900 ms) */}
            {wrongClicks.map((click) => (
              <div
                key={click.id}
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 [animation:ping_0.9s_ease-out_1_forwards]"
                style={{
                  left: `${click.x * 100}%`,
                  top: `${click.y * 100}%`,
                }}>
                <XCircle className="w-8 h-8 text-red-400 drop-shadow-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 bg-card/30 rounded-xl p-3 border border-white/10">
        <div className="flex items-center justify-between mb-2 text-xs text-white/60">
          <span>Progress</span>
          <span>
            {foundIds.size} of {NUM_DIFFS} differences found
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-green-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(foundIds.size / NUM_DIFFS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default SpotTheDifferenceGame;
