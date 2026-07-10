"use client";

import { useState } from "react";
import { CampaignV2Data } from "@/types";
import { SessionTimer, formatElapsed } from "@/components/session/SessionTimer";
import { SlidingPuzzleGame } from "@/components/games/SlidingPuzzleGame";
import { CardMatchingGame } from "@/components/games/CardMatchingGame";
import { SpotTheDifferenceGame } from "@/components/games/SpotTheDifferenceGame";
import { WordHuntGame } from "@/components/games/WordHuntGame";
import { QuizStage } from "./quiz-stage";
import { computeWrongIndices, toLegacyShapedCampaign } from "./session-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, PartyPopper, Video as VideoIcon } from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";

type Step = "intro" | "playing" | "video" | "quiz" | "done";

interface FunRunFlowProps {
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

// "Fun run" replay flow — for a campaign the player already completed.
// Never calls any /sessions/* endpoint: the game content comes straight
// from the already-fetched campaign, and every "completion" is a purely
// local state transition. No points, no raffle ticket, no recorded time.
export function FunRunFlow({ campaign, campaignId }: FunRunFlowProps) {
  const [step, setStep] = useState<Step>("intro");
  const [gameIndex, setGameIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{
    allCorrect: boolean;
    wrongIndices: number[];
  } | null>(null);

  const gameTypes = campaign.gameTypes;
  const currentGameType = gameTypes[gameIndex];

  const handleStart = () => {
    setStartedAt(Date.now());
    setGameIndex(0);
    setStep("playing");
  };

  const handleGameComplete = () => {
    const nextIndex = gameIndex + 1;
    if (nextIndex < gameTypes.length) {
      setGameIndex(nextIndex);
    } else {
      setStep("video");
    }
  };

  const handleQuizSubmit = (answers: number[]) => {
    const wrongIndices = computeWrongIndices(campaign.questions, answers);
    const allCorrect = wrongIndices.length === 0;
    setQuizResult({ allCorrect, wrongIndices });
    if (allCorrect) setStep("done");
  };

  const FunRunBadge = (
    <div
      data-testid="fun-run-badge"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 text-xs font-semibold uppercase tracking-wider w-fit">
      <PartyPopper className="h-3.5 w-3.5" />
      Fun Run — no points, no raffle ticket, no recorded time
    </div>
  );

  if (step === "intro") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        {FunRunBadge}
        <h2 className="text-3xl font-bold text-white font-fredoka mt-4">
          Play Again for Fun
        </h2>
        <p className="text-white/70">
          You&apos;ve already completed this campaign. This run is just for fun —
          nothing gets submitted.
        </p>
        <Button
          onClick={handleStart}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-10 py-6 text-lg font-fredoka">
          <Play className="h-5 w-5 mr-2" />
          Start Fun Run
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-card/30 rounded-xl px-4 py-3 border border-white/10">
        {FunRunBadge}
        {startedAt !== null && step !== "done" && (
          <SessionTimer startedAt={startedAt} label="Fun timer" />
        )}
      </div>

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
              <VideoPlayer src={campaign.videoUrl} onEnded={() => setStep("quiz")} />
              <Button
                onClick={() => setStep("quiz")}
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                Continue to Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "quiz" && (
        <QuizStage
          questions={campaign.questions}
          onSubmit={handleQuizSubmit}
          submitting={false}
          lastResult={quizResult}
          onRewatchVideo={() => setStep("video")}
          brandName={campaign.brandName}
        />
      )}

      {step === "done" && startedAt !== null && (
        <div className="max-w-2xl mx-auto py-8">
          <Card className="bg-card/80 backdrop-blur-sm border-white/10 text-center">
            <CardContent className="pt-10 pb-10 space-y-6">
              {FunRunBadge}
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mt-4">
                <PartyPopper className="w-10 h-10 text-yellow-400" />
              </div>
              <h2 className="text-3xl font-bold text-white font-fredoka">
                Fun Run Complete!
              </h2>
              <p className="text-white/70">
                Finished in {formatElapsed(Date.now() - startedAt)} — nothing was
                submitted, so no points or raffle ticket were awarded.
              </p>
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
