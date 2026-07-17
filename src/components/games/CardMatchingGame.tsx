"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Trophy,
  CheckCircle,
  Play,
  Target,
  Eye,
  Loader2,
  TimerIcon,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { CampaignData } from "@/types";
import axios from "axios";
import { endpointUrl, markPlayedToday } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { getNextCampaignUrl } from "@/app/_utils/campaign-navigation";
import { useMutation } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import Image from "next/image";

interface GameCard {
  id: string;
  imageUrl: string;
  backgroundSize: string; // CSS background-size — same for every card sharing an image
  backgroundPosition: string; // CSS background-position — different per pair, same per match
  isFlipped: boolean;
  isMatched: boolean;
  isBrandCard: boolean;
  pairId: string;
}

// The campaign image is sliced into an 8-cell grid (4 columns x 2 rows) so
// each of the 8 pairs shows a genuinely distinct, non-overlapping region of
// the image — same background-image/background-size/background-position
// tiling technique SlidingPuzzleGame uses, rather than object-position (which
// only shifts the focal point of an object-fit:cover image and tends to look
// like near-identical crops).
const GRID_COLS = 4;
const GRID_ROWS = 2;
const GRID_BACKGROUND_SIZE = `${GRID_COLS * 100}% ${GRID_ROWS * 100}%`;

function gridBackgroundPosition(pairIdx: number): string {
  const col = pairIdx % GRID_COLS;
  const row = Math.floor(pairIdx / GRID_COLS);
  return `-${col * 100}% -${row * 100}%`;
}

interface CardMatchingGameProps {
  campaignDetails: CampaignData;
  campaignId: string;
  previewMode?: boolean;
  availableCampaigns?: CampaignData[];
  // v2 session flow: when set, the game reports completion to the session
  // orchestrator instead of showing its own embedded quiz/submit UI.
  sessionMode?: boolean;
  onGameComplete?: (movesTaken: number, timeTakenMs: number) => void;
}

export function CardMatchingGame({
  campaignDetails,
  campaignId,
  previewMode = false,
  availableCampaigns,
  sessionMode = false,
  onGameComplete,
}: CardMatchingGameProps) {
  const user = useAtomValue(userAtom);

  const [gameStarted, setGameStarted] = useState(false);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [questionsCompleted, setQuestionsCompleted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const submitGameMutation = useMutation({
    mutationFn: async (submissionData: {
      timeTaken: number;
      movesTaken: number;
      solved: boolean;
      answers: number[];
    }) => {
      return axios.post(
        endpointUrl(ENDPOINTS.SUBMIT_CAMPAIGN(campaignId!)),
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );
    },
    onSuccess: (response) => {
      if (response.data.success) {
        setPointsEarned(response.data.attempt?.pointsEarned ?? 0);
        markPlayedToday(campaignId);
      }
    },
    onError: (error) => {
      console.error("Failed to submit game results:", error);
    },
  });

  const randomImages = useMemo(
    () => [
      "/icons/chart-icon.png",
      "/icons/crown-icon.png",
      "/icons/flash-icon.png",
      "/icons/gift-icon.png",
      "/icons/medal-icon.png",
      "/icons/money-bag-icon.png",
      "/icons/money-icon.png",
      "/icons/puzzle-icon.png",
      "/icons/rocket-icon.png",
      "/icons/star-icon.png",
      "/icons/target-icon.png",
      "/icons/trophy-icon.png",
      "/icons/palette-flat-icon.png",
      "/icons/trophy-flat-icon.png",
    ],
    []
  );

  const generateCards = useCallback(
    (brandData: CampaignData) => {
      const imageUrl = brandData.puzzleImageUrl;

      // No campaign image — fall back to local icon set
      if (!imageUrl) {
        const shuffled = [...randomImages].sort(() => Math.random() - 0.5);
        const fallback: GameCard[] = [];
        // 1 brand pair (placeholder) + 7 icon pairs
        for (let i = 0; i < 8; i++) {
          const isBrand = i === 0;
          const url = isBrand ? "/icons/puzzle-icon.png" : shuffled[i - 1];
          for (let copy = 0; copy < 2; copy++) {
            fallback.push({
              id: `fb-${i}-${copy}`,
              imageUrl: url,
              backgroundSize: "cover",
              backgroundPosition: "center",
              isFlipped: false,
              isMatched: false,
              isBrandCard: isBrand,
              pairId: `pair-${i}`,
            });
          }
        }
        return fallback.sort(() => Math.random() - 0.5);
      }

      // Primary path: slice the campaign image into an 8-cell grid so each
      // pair shows a genuinely distinct region. Pair 0 is the "brand" card
      // (top-left cell, gets the ★).
      const cards: GameCard[] = [];
      for (let pairIdx = 0; pairIdx < 8; pairIdx++) {
        const backgroundPosition = gridBackgroundPosition(pairIdx);
        for (let copy = 0; copy < 2; copy++) {
          cards.push({
            id: `card-${pairIdx}-${copy}`,
            imageUrl,
            backgroundSize: GRID_BACKGROUND_SIZE,
            backgroundPosition,
            isFlipped: false,
            isMatched: false,
            isBrandCard: pairIdx === 0,
            pairId: `pair-${pairIdx}`,
          });
        }
      }
      return cards.sort(() => Math.random() - 0.5);
    },
    [randomImages]
  );

  useEffect(() => {
    if (campaignDetails) {
      setCards(generateCards(campaignDetails));
    }
  }, [campaignDetails, generateCards]);

  useEffect(() => {
    if (campaignId) {
      setGameStarted(false);
      setSelectedCards([]);
      setMatchedPairs([]);
      setMoves(0);
      setIsGameComplete(false);
      setIsPlaying(false);
      setTimeElapsed(0);
      setShowQuestions(false);
      setCurrentQuestion(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setQuestionsCompleted(false);
      setIsChecking(false);
      setPointsEarned(0);
      setQuizAttempts(0);
      setShowQuizResults(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (isPlaying && !isGameComplete) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameComplete]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      setIsGameComplete(true);
      setIsPlaying(false);
      if (!sessionMode) {
        setTimeout(() => setShowQuestions(true), 2000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const startGame = () => {
    setGameStarted(true);
    setIsPlaying(true);
  };

  const resetGame = () => {
    if (campaignDetails) {
      setCards(generateCards(campaignDetails));
    }
    setSelectedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setIsGameComplete(false);
    setTimeElapsed(0);
    setIsPlaying(false);
    setGameStarted(false);
    setShowQuestions(false);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setQuestionsCompleted(false);
    setIsChecking(false);
    setPointsEarned(0);
    setQuizAttempts(0);
    setShowQuizResults(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleCardClick = (clickedCard: GameCard) => {
    if (
      isChecking ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      selectedCards.length >= 2
    )
      return;

    const newCards = cards.map((card) =>
      card.id === clickedCard.id ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);

    const newSelectedCards = [
      ...selectedCards,
      { ...clickedCard, isFlipped: true },
    ];
    setSelectedCards(newSelectedCards);

    if (newSelectedCards.length === 2) {
      setMoves((prev) => prev + 1);
      setIsChecking(true);
      setTimeout(() => {
        checkForMatch(newSelectedCards);
        setIsChecking(false);
      }, 1000);
    }
  };

  const checkForMatch = (selected: GameCard[]) => {
    const [card1, card2] = selected;
    const isMatch = card1.pairId === card2.pairId;

    if (isMatch) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === card1.id || card.id === card2.id
            ? { ...card, isMatched: true }
            : card
        )
      );
      setMatchedPairs((prev) => [...prev, card1.pairId]);
    } else {
      setCards((prev) =>
        prev.map((card) =>
          card.id === card1.id || card.id === card2.id
            ? { ...card, isFlipped: false }
            : card
        )
      );
    }
    setSelectedCards([]);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowQuizResults(false);
    setQuizAttempts((prev) => prev + 1);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < (campaignDetails?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowQuizResults(true);
    }
  };

  const handleSubmitResults = () => {
    setQuestionsCompleted(true);
    if (!previewMode) {
      submitGameMutation.mutate({
        timeTaken: timeElapsed * 1000,
        movesTaken: moves,
        solved: true,
        answers,
      });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Game Stats & Controls */}
        <div className="xl:order-2">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-secondary" />
                    <span className="font-mono text-xl text-white">
                      {moves}
                    </span>
                    <span className="text-xs text-white/60 uppercase tracking-wider">
                      Moves
                    </span>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <div className="flex items-center gap-2">
                    <TimerIcon className="h-5 w-5 text-green-400" />
                    <span className="font-mono text-xl w-16 text-white">
                      {formatTime(timeElapsed)}
                    </span>
                  </div>
                </div>

                {isGameComplete && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">All Pairs Matched!</span>
                    </div>
                    <p className="text-white/70 text-sm">
                      Completed in {formatTime(timeElapsed)} with {moves} moves
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-secondary" />
                How to Play
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-white/70 text-sm">
                <p>• Click cards to flip them and reveal images</p>
                <p>• Find the 2 matching brand images (marked with ★)</p>
                <p>• Match all identical image pairs to win</p>
                <p>• Complete the game to unlock brand quiz questions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Board */}
        <div className="xl:col-span-3 xl:order-1">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <div className="relative">
                {!gameStarted && cards.length > 0 && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm rounded-lg">
                    <Image
                      src={"/icons/puzzle-icon.png"}
                      alt=""
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                    <h2 className="text-2xl font-bold text-white mb-2 font-fredoka">
                      Ready to Match?
                    </h2>
                    <p className="text-white/70 mb-4 text-center text-sm">
                      Find all matching image pairs in this 4×4 grid!
                    </p>
                    <Button
                      onClick={startGame}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-6 py-2">
                      <Play className="h-4 w-4 mr-2" />
                      Start Game
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      className={`aspect-square relative cursor-pointer transform transition-all duration-300 ${
                        card.isFlipped || card.isMatched
                          ? "scale-105"
                          : "hover:scale-105"
                      } ${
                        isChecking &&
                        selectedCards.find((c) => c.id === card.id)
                          ? "animate-pulse"
                          : ""
                      }`}>
                      <div
                        className="relative w-full h-full preserve-3d transition-transform duration-500"
                        style={{
                          transformStyle: "preserve-3d",
                          transform:
                            card.isFlipped || card.isMatched
                              ? "rotateY(180deg)"
                              : "rotateY(0deg)",
                        }}>
                        <div className="absolute inset-0 w-full h-full backface-hidden rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/40 border border-secondary/30 flex items-center justify-center">
                          <div className="text-secondary text-2xl font-bold">
                            ?
                          </div>
                        </div>
                        <div
                          className={`absolute inset-0 w-full h-full backface-hidden rounded-lg border overflow-hidden ${
                            card.isMatched
                              ? "border-green-500/50 ring-2 ring-green-500/30"
                              : card.isBrandCard
                              ? "border-yellow-500/50 ring-1 ring-yellow-500/20"
                              : "border-white/20"
                          }`}
                          style={{ transform: "rotateY(180deg)" }}>
                          <div
                            role="img"
                            aria-label={
                              card.isBrandCard ? "Brand image" : "Memory card"
                            }
                            className="w-full h-full"
                            style={{
                              backgroundImage: `url(${card.imageUrl})`,
                              backgroundSize: card.backgroundSize,
                              backgroundPosition: card.backgroundPosition,
                              backgroundRepeat: "no-repeat",
                            }}
                          />
                          {card.isBrandCard && (
                            <div className="absolute top-1 right-1">
                              <div className="bg-yellow-500/90 text-black text-xs px-1 py-0.5 rounded font-bold">
                                ★
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Win Overlay */}
      {isGameComplete && moves > 0 && !showQuestions && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold text-white mb-2 font-fredoka">
            All Pairs Matched!
          </h2>
          {sessionMode ? (
            <Button
              onClick={() => onGameComplete?.(moves, timeElapsed * 1000)}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8 py-3 mt-2">
              Next Game
            </Button>
          ) : (
            <p className="text-white/80 mb-6">
              In {formatTime(timeElapsed)} and {moves} moves
            </p>
          )}
        </div>
      )}

      {/* MCQ Modal */}
      {showQuestions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-card/95 border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-white font-fredoka text-2xl mb-2">
                {questionsCompleted ? 'Challenge Complete!' : showQuizResults ? 'Quiz Results' : `Learn About ${campaignDetails?.brandName}`}
              </CardTitle>
              {!showQuizResults && !questionsCompleted && (
                <p className="text-white/70">
                  Question {currentQuestion + 1} of {campaignDetails?.questions.length || 0}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {questionsCompleted ? (
                <div className="text-center space-y-4">
                  <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  {previewMode ? (
                    <>
                      <h3 className="text-2xl font-bold text-white font-fredoka">Preview Complete!</h3>
                      <p className="text-white/80 mb-2">All pairs matched in {formatTime(timeElapsed)} with {moves} moves</p>
                      <p className="text-white/60">This is how players will experience your campaign.</p>
                      <div className="flex gap-3 justify-center pt-4">
                        <Button onClick={resetGame} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Play Again
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {submitGameMutation.isPending && (
                        <div className="flex items-center justify-center gap-2 text-secondary my-4">
                          <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                          <span>Submitting results...</span>
                        </div>
                      )}
                      {submitGameMutation.isSuccess && (
                        <div className="my-4">
                          <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-semibold">Results Submitted!</span>
                          </div>
                          {pointsEarned > 0 ? (
                            <p className="text-2xl font-bold text-secondary font-fredoka">
                              +{pointsEarned} Points Earned!
                            </p>
                          ) : (
                            <p className="text-sm text-yellow-300/90 bg-yellow-500/15 border border-yellow-500/40 rounded-lg px-4 py-2">
                              You already earned points for this campaign today. Come back tomorrow for more!
                            </p>
                          )}
                        </div>
                      )}
                      {submitGameMutation.isError && (
                        <p className="text-red-400 text-sm my-4">Failed to submit results. Please try again.</p>
                      )}
                      <p className="text-white/60">Thanks for learning more about {campaignDetails?.brandName}!</p>
                      <div className="flex gap-3 justify-center pt-4">
                        <Link href={routes.USER.DASHBOARD}>
                          <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka" disabled={submitGameMutation.isPending}>
                            Dashboard
                          </Button>
                        </Link>
                        {(() => {
                          const nextCampaignUrl = getNextCampaignUrl(availableCampaigns, campaignId, "card_matching");
                          return nextCampaignUrl ? (
                            <Link href={nextCampaignUrl}>
                              <Button variant="outline" className="border-white/20 text-white hover:bg-white/90" disabled={submitGameMutation.isPending}>
                                Next Campaign
                              </Button>
                            </Link>
                          ) : (
                            <Link href={routes.CAMPAIGNS}>
                              <Button variant="outline" className="border-white/20 text-white hover:bg-white/90" disabled={submitGameMutation.isPending}>
                                Browse Campaigns
                              </Button>
                            </Link>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              ) : showQuizResults ? (
                (() => {
                  const total = campaignDetails?.questions.length || 0;
                  const score = answers.reduce((acc, a, i) =>
                    acc + (a === campaignDetails?.questions[i]?.correctIndex ? 1 : 0), 0);
                  const allCorrect = score === total;
                  return (
                    <div className="text-center space-y-4">
                      <div className={`text-6xl font-bold font-fredoka mb-2 ${allCorrect ? 'text-green-400' : 'text-secondary'}`}>
                        {score}/{total}
                      </div>
                      {allCorrect ? (
                        <>
                          <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                          <h3 className="text-xl font-bold text-white font-fredoka">Perfect Score!</h3>
                          <p className="text-white/70">You answered all questions correctly. Submit to claim your points!</p>
                          <Button onClick={handleSubmitResults} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-10 h-12 mt-4">
                            Submit &amp; See Results
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-white/80">You need a perfect score to complete the challenge.</p>
                          <p className="text-white/60 text-sm">{quizAttempts > 0 ? `Attempt #${quizAttempts + 1}` : 'Give it another shot!'}</p>
                          <Button onClick={restartQuiz} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8 mt-4">
                            Try Again
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })()
              ) : (
                <>
                  {campaignDetails?.passage && (
                    <div
                      className="bg-white/5 border border-white/10 rounded-lg p-4 mb-2 select-none"
                      onContextMenu={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                    >
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-2 font-semibold">Read the passage</p>
                      <p className="text-white/80 text-sm leading-relaxed">{campaignDetails.passage}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-white text-xl mb-4 font-medium">
                      {campaignDetails?.questions[currentQuestion]?.question}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(campaignDetails?.questions[currentQuestion]?.choices || []).map((option: string, index: number) => (
                      <Button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className={`p-4 text-left justify-start h-auto ${
                          selectedAnswer === index
                            ? "bg-secondary text-secondary-foreground"
                            : "border-white/20 text-white hover:bg-white/90"
                        }`}>
                        <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswer === null}
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka px-8">
                      {currentQuestion < (campaignDetails?.questions.length || 0) - 1 ? "Next Question" : "Finish Quiz"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx global>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </>
  );
}
