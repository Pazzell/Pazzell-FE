"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { CampaignData } from "@/types";
import {
  Play,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { routes } from "@/app/_utils/routes";

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

type GamePhase = "idle" | "playing" | "quiz" | "success";

interface Props {
  campaignDetails: CampaignData;
  campaignId: string;
  previewMode?: boolean;
  availableCampaigns?: any[];
}

export function SpotTheDifferenceGame({
  campaignDetails,
  campaignId,
  previewMode = false,
}: Props) {
  const user = useAtomValue(userAtom);
  const router = useRouter();

  const [phase, setPhase] = useState<GamePhase>("idle");
  const [marks, setMarks] = useState<{ x: number; y: number }[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerStatus, setAnswerStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);

  const puzzleRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer - runs only during "playing" phase
  useEffect(() => {
    if (phase === "playing" && startedAt !== null) {
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 1000);
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

  const handleStartGame = () => {
    const now = Date.now();
    setStartedAt(now);
    setElapsedMs(0);
    setMarks([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerStatus("idle");
    setQuizAnswers([]);
    setPhase("playing");
  };

  const handleBackClick = () => {
    setShowBackWarning(true);
  };

  const handleConfirmBack = () => {
    setShowBackWarning(false);
    setPhase("idle");
    setMarks([]);
    setElapsedMs(0);
    setStartedAt(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerStatus("idle");
    setQuizAnswers([]);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (!puzzleRef.current || phase !== "playing") return;
    const rect = puzzleRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 1000;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 1000;
    setMarks((m) => [...m, { x, y }]);
  };

  const handleProceed = () => {
    setPhase("quiz");
  };

  const handleAnswerSelect = (choiceIndex: number) => {
    if (answerStatus === "correct") return;
    setSelectedAnswer(choiceIndex);
    setAnswerStatus("idle");
  };

  const handleCheckAnswer = () => {
    const questions = campaignDetails.questions || [];
    const current = questions[currentQuestionIndex];
    if (!current || selectedAnswer === null) return;

    if (selectedAnswer === current.correctIndex) {
      setAnswerStatus("correct");
      const newAnswers = [...quizAnswers, selectedAnswer];
      setQuizAnswers(newAnswers);

      setTimeout(() => {
        if (currentQuestionIndex + 1 < questions.length) {
          setCurrentQuestionIndex((i) => i + 1);
          setSelectedAnswer(null);
          setAnswerStatus("idle");
        } else {
          // All answered correctly — advance index past end to reveal submit
          setCurrentQuestionIndex((i) => i + 1);
        }
      }, 800);
    } else {
      setAnswerStatus("wrong");
      setTimeout(() => {
        setSelectedAnswer(null);
        setAnswerStatus("idle");
      }, 1200);
    }
  };

  const handleSubmit = async () => {
    if (submitting || previewMode) return;
    setSubmitting(true);
    try {
      const response = await axios.post(
        endpointUrl(ENDPOINTS.SUBMIT_PUZZLE_ANSWER(campaignId)),
        {
          timeTaken: elapsedMs,
          movesTaken: marks.length,
          solved: true,
          answers: quizAnswers,
          differencesFound: marks.map((p) => ({
            x: p.x,
            y: p.y,
            width: 0.03,
            height: 0.03,
          })),
        },
        { headers: { Authorization: `Bearer ${user?.accessToken}` } }
      );
      setSubmitResult(response.data);
      setPhase("success");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const questions = campaignDetails.questions || [];
  const allQuestionsAnswered =
    questions.length === 0 || currentQuestionIndex >= questions.length;

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16 gap-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white font-fredoka">
              Spot the Difference
            </h2>
            <p className="text-white/70 max-w-md">
              Find all the differences between the two images. Click on each
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
    const points =
      submitResult?.attempt?.pointsEarned ??
      submitResult?.attempt?.points ??
      submitResult?.points ??
      0;

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
            <p className="text-white/70">
              Great job! Here&apos;s your summary:
            </p>

            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold text-white font-mono">
                  {points}
                </span>
                <span className="text-xs text-white/60">Points</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                <Target className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold text-white font-mono">
                  {marks.length}
                </span>
                <span className="text-xs text-white/60">Moves</span>
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
    if (allQuestionsAnswered) {
      return (
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            {questions.length > 0 && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white font-fredoka">
                    Quiz Complete!
                  </h2>
                  <p className="text-white/70 mt-2">
                    You answered all questions correctly. Submit to save your
                    results.
                  </p>
                </div>
              </>
            )}
            {questions.length === 0 && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white font-fredoka">
                  Ready to Submit
                </h2>
                <p className="text-white/70 mt-2">
                  You&apos;ve completed the puzzle!
                </p>
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-10 py-5 text-lg font-fredoka bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      );
    }

    const current = questions[currentQuestionIndex];

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
                    i < currentQuestionIndex
                      ? "bg-green-400"
                      : i === currentQuestionIndex
                      ? "bg-secondary"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white font-fredoka">
            {current.question}
          </h3>

          <div className="space-y-3">
            {current.choices.map((choice, idx) => {
              let cls =
                "w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 text-white ";
              if (answerStatus === "correct" && idx === current.correctIndex) {
                cls += "bg-green-500/20 border-green-500/60 text-green-300";
              } else if (answerStatus === "wrong" && idx === selectedAnswer) {
                cls += "bg-red-500/20 border-red-500/60 text-red-300";
              } else if (selectedAnswer === idx) {
                cls += "bg-secondary/20 border-secondary";
              } else {
                cls +=
                  "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30";
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={answerStatus === "correct"}>
                  <span className="font-semibold">
                    {String.fromCharCode(65 + idx)}.
                  </span>{" "}
                  {choice}
                </button>
              );
            })}
          </div>

          {answerStatus === "wrong" && (
            <p className="text-red-400 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              Incorrect answer, please try again.
            </p>
          )}

          <Button
            onClick={handleCheckAnswer}
            disabled={selectedAnswer === null || answerStatus === "correct"}
            className="w-full py-3 font-fredoka text-base">
            Check Answer
          </Button>
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto">
      {/* Back warning dialog */}
      {showBackWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3 text-yellow-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold font-fredoka">Restart Game?</h3>
            </div>
            <p className="text-white/70">
              Going back will restart the game from the beginning. All your
              progress, marks, and time will be lost.
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

      {/* Game header bar */}
      <div className="flex items-center justify-between mb-4 bg-card/30 rounded-xl px-4 py-3 border border-white/10">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white/80">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-mono">Marks: {marks.length}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-mono">{formatTime(elapsedMs)}</span>
          </div>
        </div>

        <Button
          onClick={handleProceed}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-2 text-sm font-fredoka">
          Proceed
        </Button>
      </div>

      {/* Images grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card/50 rounded-xl overflow-hidden border border-white/10">
          <div className="px-3 py-2 text-sm text-white/70 font-medium border-b border-white/10">
            Original
          </div>
          {campaignDetails.originalImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaignDetails.originalImageUrl}
              alt="original"
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-white/50">
              No original image provided
            </div>
          )}
        </div>

        <div className="bg-card/50 rounded-xl overflow-hidden border border-white/10">
          <div className="px-3 py-2 text-sm text-white/70 font-medium border-b border-white/10">
            Find the differences
          </div>
          <div
            ref={puzzleRef}
            onClick={handleImageClick}
            className="relative cursor-crosshair">
            {campaignDetails.puzzleImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaignDetails.puzzleImageUrl}
                alt="puzzle"
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-white/50">
                No puzzle image provided
              </div>
            )}
            {marks.map((m, idx) => (
              <div
                key={idx}
                style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                className="absolute w-8 h-8 rounded-full border-2 border-red-400 bg-red-500/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                <span className="text-white text-xs font-bold">{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpotTheDifferenceGame;
