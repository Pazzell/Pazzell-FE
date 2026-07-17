"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import {
  CampaignV2Data,
  GameType,
  RaffleCampaignCurrentResponse,
  SessionCompleteResponse,
  SessionQuizAttemptResponse,
  SessionStartResponse,
  WeeklyLeaderboardResponse,
} from "@/types";
import { SessionTimer, formatElapsed } from "@/components/session/SessionTimer";
import { SlidingPuzzleGame } from "@/components/games/SlidingPuzzleGame";
import { CardMatchingGame } from "@/components/games/CardMatchingGame";
import { SpotTheDifferenceGame } from "@/components/games/SpotTheDifferenceGame";
import { WordHuntGame } from "@/components/games/WordHuntGame";
import { QuizStage } from "./quiz-stage";
import {
  computeWrongIndices,
  extractSessionErrorMessage,
  isAbandonedSessionError,
  toLegacyShapedCampaign,
} from "./session-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Loader2,
  AlertCircle,
  Trophy,
  Ticket,
  Video as VideoIcon,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";

type Step = "intro" | "playing" | "video" | "quiz" | "done";

interface RealSessionFlowProps {
  campaign: CampaignV2Data;
  campaignId: string;
}

function VideoPlayer({ src, onEnded }: { src?: string; onEnded: () => void }) {
  if (!src) {
    return (
      <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center text-white/50">
        Video unavailable
      </div>
    );
  }
  return (
    <video
      src={src}
      controls
      onEnded={onEnded}
      className="w-full rounded-lg border border-white/10 max-h-96"
    />
  );
}

export function RealSessionFlow({ campaign, campaignId }: RealSessionFlowProps) {
  const user = useAtomValue(userAtom);
  const authHeaders = { headers: { Authorization: `Bearer ${user?.accessToken}` } };

  const [step, setStep] = useState<Step>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameIndex, setGameIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [totalMoves, setTotalMoves] = useState(0);
  const [quizResult, setQuizResult] = useState<{
    allCorrect: boolean;
    wrongIndices: number[];
  } | null>(null);
  const [completion, setCompletion] = useState<SessionCompleteResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const gameTypes = campaign.gameTypes;
  const currentGameType = gameTypes[gameIndex];

  const startSessionMutation = useMutation({
    mutationFn: () =>
      axios
        .post<SessionStartResponse>(
          endpointUrl(ENDPOINTS.SESSION_START),
          { campaignId },
          authHeaders
        )
        .then((res) => res.data.session),
  });

  const startGameMutation = useMutation({
    mutationFn: ({
      sessionId: sid,
      gameType,
    }: {
      sessionId: string;
      gameType: GameType;
    }) =>
      axios.post(
        endpointUrl(ENDPOINTS.SESSION_GAME_START(sid, gameType)),
        {},
        authHeaders
      ),
  });

  const completeGameMutation = useMutation({
    mutationFn: (payload: {
      gameType: GameType;
      movesTaken: number;
      timeTakenMs: number;
    }) =>
      axios.post(
        endpointUrl(ENDPOINTS.SESSION_GAME_COMPLETE(sessionId!, payload.gameType)),
        { movesTaken: payload.movesTaken, timeTakenMs: payload.timeTakenMs },
        authHeaders
      ),
  });

  const startVideoMutation = useMutation({
    mutationFn: () =>
      axios.post(endpointUrl(ENDPOINTS.SESSION_VIDEO_START(sessionId!)), {}, authHeaders),
  });

  const completeVideoMutation = useMutation({
    mutationFn: () =>
      axios.post(
        endpointUrl(ENDPOINTS.SESSION_VIDEO_COMPLETE(sessionId!)),
        {},
        authHeaders
      ),
  });

  const quizAttemptMutation = useMutation({
    mutationFn: (answers: number[]) =>
      axios
        .post<SessionQuizAttemptResponse>(
          endpointUrl(ENDPOINTS.SESSION_QUIZ_ATTEMPT(sessionId!)),
          { answers },
          authHeaders
        )
        .then((res) => res.data),
  });

  const completeSessionMutation = useMutation({
    mutationFn: (movesTaken: number) =>
      axios
        .post<SessionCompleteResponse>(
          endpointUrl(ENDPOINTS.SESSION_COMPLETE(sessionId!)),
          { totalMoves: movesTaken },
          authHeaders
        )
        .then((res) => res.data),
  });

  const { data: weeklyLeaderboard } = useQuery({
    queryKey: ["weekly-leaderboard-for-completion"],
    queryFn: () =>
      axios
        .get<WeeklyLeaderboardResponse>(
          endpointUrl(ENDPOINTS.WEEKLY_LEADERBOARD),
          authHeaders
        )
        .then((res) => res.data.leaderboard),
    enabled: step === "done",
    retry: false,
  });

  const myRank = weeklyLeaderboard?.entries?.find((e) => e.userId === user?.id)
    ?.position;

  const { data: raffleStatus } = useQuery({
    queryKey: ["raffle-campaign-current", campaignId],
    queryFn: () =>
      axios
        .get<RaffleCampaignCurrentResponse>(
          endpointUrl(ENDPOINTS.RAFFLE_CAMPAIGN_CURRENT(campaignId))
        )
        .then((res) => res.data),
    retry: false,
  });

  // A dead (abandoned) session can't be resumed — drop back to the intro
  // screen so "Start Playing" begins a fresh session instead of retrying
  // the expired sessionId.
  const resetForNewSession = () => {
    setSessionId(null);
    setGameIndex(0);
    setStartedAt(null);
    setTotalMoves(0);
    setQuizResult(null);
    setCompletion(null);
    setStep("intro");
  };

  const handleSessionError = (error: unknown, fallback: string) => {
    const message = extractSessionErrorMessage(error, fallback);
    if (isAbandonedSessionError(message)) {
      resetForNewSession();
    }
    setErrorMessage(message);
  };

  // Guards against a fast double-click on "Next Game"/etc. firing the same
  // stage-completion request twice — the game components don't disable
  // their buttons while the parent's mutation is in flight, so a second
  // click would otherwise send a duplicate /complete call that 400s
  // ("game already completed") on the backend.
  const isTransitioningRef = useRef(false);

  const withTransitionGuard =
    <Args extends unknown[]>(fn: (...args: Args) => Promise<void>) =>
    async (...args: Args) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      try {
        await fn(...args);
      } finally {
        isTransitioningRef.current = false;
      }
    };

  const handleStart = withTransitionGuard(async () => {
    setErrorMessage("");
    try {
      const session = await startSessionMutation.mutateAsync();
      setSessionId(session._id);
      await startGameMutation.mutateAsync({
        sessionId: session._id,
        gameType: gameTypes[0],
      });
      setStartedAt(Date.now());
      setStep("playing");
    } catch (error) {
      handleSessionError(error, "Couldn't start the session. Please try again.");
    }
  });

  const handleGameComplete = withTransitionGuard(
    async (movesTaken: number, timeTakenMs: number) => {
      setErrorMessage("");
      try {
        await completeGameMutation.mutateAsync({
          gameType: currentGameType,
          movesTaken,
          timeTakenMs,
        });
        setTotalMoves((prev) => prev + movesTaken);
        const nextIndex = gameIndex + 1;
        if (nextIndex < gameTypes.length) {
          await startGameMutation.mutateAsync({
            sessionId: sessionId!,
            gameType: gameTypes[nextIndex],
          });
          setGameIndex(nextIndex);
        } else {
          await startVideoMutation.mutateAsync();
          setStep("video");
        }
      } catch (error) {
        handleSessionError(error, "Couldn't save your progress. Please try again.");
      }
    }
  );

  const handleVideoContinue = withTransitionGuard(async () => {
    setErrorMessage("");
    try {
      await completeVideoMutation.mutateAsync();
      setStep("quiz");
    } catch (error) {
      handleSessionError(error, "Couldn't continue past the video. Please try again.");
    }
  });

  const handleQuizSubmit = withTransitionGuard(async (answers: number[]) => {
    setErrorMessage("");
    try {
      const result = await quizAttemptMutation.mutateAsync(answers);
      const wrongIndices = computeWrongIndices(campaign.questions, answers);
      setQuizResult({ allCorrect: result.allCorrect, wrongIndices });
      if (result.allCorrect) {
        const done = await completeSessionMutation.mutateAsync(totalMoves);
        setCompletion(done);
        setStep("done");
      }
    } catch (error) {
      handleSessionError(error, "Couldn't check your answers. Please try again.");
    }
  });

  if (step === "intro") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        <h2 className="text-3xl font-bold text-white font-fredoka">Ready to Play?</h2>
        <p className="text-white/70">
          Play all {gameTypes.length} games, watch the brand video, then answer 3
          quiz questions. A timer runs for the whole session.
        </p>
        {raffleStatus && (
          <p
            data-testid="raffle-status"
            className="flex items-center justify-center gap-2 text-secondary text-sm">
            <Ticket className="h-4 w-4" />
            {raffleStatus.ticketCount} ticket{raffleStatus.ticketCount !== 1 ? "s" : ""}{" "}
            banked this week &bull; 1 winner drawn weekly
          </p>
        )}
        <Button
          onClick={handleStart}
          disabled={startSessionMutation.isPending || startGameMutation.isPending}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-10 py-6 text-lg font-fredoka">
          {startSessionMutation.isPending || startGameMutation.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start Playing
            </>
          )}
        </Button>
        {errorMessage && (
          <p className="text-red-400 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-card/30 rounded-xl px-4 py-3 border border-white/10">
        <span className="text-white/60 text-sm" data-testid="session-stage-label">
          {step === "playing" && `Game ${gameIndex + 1} of ${gameTypes.length}`}
          {step === "video" && "Brand video"}
          {step === "quiz" && "Quiz"}
          {step === "done" && "Complete"}
        </span>
        {startedAt !== null && step !== "done" && (
          <SessionTimer startedAt={startedAt} />
        )}
      </div>

      {errorMessage && (
        <p className="text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {errorMessage}
        </p>
      )}

      {step === "playing" && currentGameType === "sliding_puzzle" && (
        <SlidingPuzzleGame
          campaignDetails={toLegacyShapedCampaign(campaign, currentGameType)}
          campaignId={campaignId}
          sessionMode
          onGameComplete={handleGameComplete}
        />
      )}
      {step === "playing" && currentGameType === "card_matching" && (
        <CardMatchingGame
          campaignDetails={toLegacyShapedCampaign(campaign, currentGameType)}
          campaignId={campaignId}
          sessionMode
          onGameComplete={handleGameComplete}
        />
      )}
      {step === "playing" && currentGameType === "spot_the_difference" && (
        <SpotTheDifferenceGame
          campaignDetails={toLegacyShapedCampaign(campaign, currentGameType)}
          campaignId={campaignId}
          sessionMode
          onGameComplete={handleGameComplete}
        />
      )}
      {step === "playing" && currentGameType === "word_hunt" && (
        <WordHuntGame
          campaignDetails={toLegacyShapedCampaign(campaign, currentGameType)}
          campaignId={campaignId}
          sessionMode
          onGameComplete={handleGameComplete}
        />
      )}

      {step === "video" && (
        <div className="max-w-3xl mx-auto space-y-4">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white font-fredoka flex items-center gap-2">
                <VideoIcon className="h-5 w-5 text-secondary" />
                Watch to continue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <VideoPlayer src={campaign.videoUrl} onEnded={handleVideoContinue} />
              <Button
                onClick={handleVideoContinue}
                disabled={completeVideoMutation.isPending}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                {completeVideoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Continuing...
                  </>
                ) : (
                  "Continue to Quiz"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "quiz" && (
        <QuizStage
          questions={campaign.questions}
          onSubmit={handleQuizSubmit}
          submitting={quizAttemptMutation.isPending || completeSessionMutation.isPending}
          lastResult={quizResult}
          onRewatchVideo={() => setStep("video")}
          brandName={campaign.brandName}
        />
      )}

      {step === "done" && completion && (
        <div className="max-w-2xl mx-auto py-8">
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 text-center">
            <CardContent className="pt-10 pb-10 space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white font-fredoka">
                {completion.voided ? "Session Not Counted" : "Campaign Complete!"}
              </h2>

              {completion.voided ? (
                <p className="text-yellow-300/90 bg-yellow-500/15 border border-yellow-500/40 rounded-xl px-4 py-3 text-sm">
                  This session couldn&apos;t be verified and wasn&apos;t counted. No
                  points or raffle ticket were awarded.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                      <span className="text-2xl font-bold text-white font-mono">
                        {completion.pointsAwarded}
                      </span>
                      <span className="text-xs text-white/60">Points</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                      <RotateCcw className="w-6 h-6 text-blue-400" />
                      <span className="text-2xl font-bold text-white font-mono">
                        {totalMoves}
                      </span>
                      <span className="text-xs text-white/60">Moves</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2">
                      <span className="text-2xl font-bold text-white font-mono">
                        {formatElapsed(completion.totalCompletionTimeMs)}
                      </span>
                      <span className="text-xs text-white/60">Total Time</span>
                    </div>
                  </div>
                  {completion.isFirstCompletion && completion.pointsAwarded > 0 && (
                    <p className="flex items-center justify-center gap-2 text-secondary font-semibold">
                      <Ticket className="h-5 w-5" />
                      Raffle ticket earned for this campaign!
                    </p>
                  )}
                  {myRank && (
                    <p className="text-white/70 text-sm">
                      You&apos;re currently ranked{" "}
                      <span className="text-white font-semibold">#{myRank}</span> on
                      the weekly leaderboard.
                    </p>
                  )}
                </>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <Link href={routes.USER.DASHBOARD}>
                  <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka">
                    Dashboard
                  </Button>
                </Link>
                <Link href={routes.CAMPAIGNS}>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/90">
                    More Campaigns
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
