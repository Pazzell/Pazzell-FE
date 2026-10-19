"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Grid2x2, Loader2, Play, RotateCcw, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { BrandCta } from "@/components/trivia/brand-cta";
import { CampaignGate } from "@/components/trivia/campaign-gate";
import { PointsSummary } from "@/components/trivia/points-summary";
import { useGameSettings } from "@/hooks/use-game-settings";
import { noPointMessage, POINTS_QUERY_KEY } from "@/hooks/use-points";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useStartTriviaSession } from "@/hooks/use-start-trivia-session";
import { recallQuizSlug } from "@/lib/return-path";
import { sessionExit } from "@/lib/session-exit";
import type { TriviaResult, TriviaResultResponse, TriviaSession } from "@/types";

const CONFETTI_SIDE_ROUNDS = 5;

interface TriviaResultViewProps {
  session: TriviaSession;
  /** The result handed over by the last answer, when the quiz just finished on this page. */
  initialResult: TriviaResult | null;
}

export function TriviaResultView({ session, initialResult }: TriviaResultViewProps) {
  const router = useRouter();
  const { start, isStarting, gate } = useStartTriviaSession({ replace: true });
  // Which of the two "go again" buttons was pressed, so only that one shows the spinner.
  const [startingPractice, setStartingPractice] = useState<boolean | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trivia-result", session.id],
    queryFn: () =>
      api
        .get<TriviaResultResponse>(ENDPOINTS.TRIVIA_SESSION_RESULT(session.id))
        .then((res) => res.data.result),
    enabled: !initialResult,
  });
  const result = initialResult ?? data;

  // The result carries the player's points after this quiz; keep the cached totals in step.
  const queryClient = useQueryClient();
  const { settings } = useGameSettings();
  useEffect(() => {
    if (result?.points) queryClient.setQueryData(POINTS_QUERY_KEY, result.points);
  }, [result?.points, queryClient]);

  // A clean sweep is celebrated once, when the game ends on this page; coming back to an
  // old result (a refresh, a link) stays quiet.
  const justWonAll =
    !!initialResult && initialResult.total > 0 && initialResult.correct === initialResult.total;
  useEffect(() => {
    if (!justWonAll) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // One big burst from the middle, then cannons from both sides for a couple of seconds,
    // so it can't be missed on a large screen or a small one.
    const colors = ["#22C55E", "#00E676", "#00D9FF", "#FFEAA7", "#FF6B9D", "#FFFFFF"];
    confetti({ particleCount: 220, spread: 110, startVelocity: 50, scalar: 1.2, origin: { y: 0.6 }, colors });
    let rounds = 0;
    const sides = setInterval(() => {
      confetti({ particleCount: 60, angle: 60, spread: 70, scalar: 1.2, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 60, angle: 120, spread: 70, scalar: 1.2, origin: { x: 1, y: 0.7 }, colors });
      if (++rounds >= CONFETTI_SIDE_ROUNDS) clearInterval(sides);
    }, 400);
    return () => clearInterval(sides);
  }, [justWonAll]);

  if (!result) {
    if (isLoading) return <PageLoader message="Loading your result..." withLayout={false} />;
    return (
      <PageError
        title="Couldn't load your result"
        message={error ? "Please check your connection and try again." : undefined}
        onRetry={() => refetch()}
        withLayout={false}
      />
    );
  }

  const perfect = result.correct === result.total;
  const exit = sessionExit(result.source, result.isPreview);
  const isCampaign = result.source.type === "campaign";
  // A sponsored trivia is owed before any other one can start, so offer it right away.
  const owedCampaign =
    gate ?? (!isCampaign && result.campaignGate?.required ? result.campaignGate.campaign : null);

  // Starts the same trivia again with the same timer and number of cards. `replayOf`
  // lets the server hand back the same cards after a practice (in a new order).
  const startAgain = (practice: boolean) => {
    setStartingPractice(practice);
    // A shared custom quiz can only be started by its link; the owner starts it by id.
    const slug = result.source.type === "custom" ? recallQuizSlug(result.source.id) : null;
    start({
      sourceType: result.source.type,
      ...(slug ? { slug } : { sourceId: result.source.id }),
      timerSeconds: session.timerSeconds,
      cardCount: session.cardCount,
      ...(typeof session.imagePercent === "number" ? { imagePercent: session.imagePercent } : {}),
      practice,
      replayOf: session.id,
    });
  };
  const spinnerOn = (practice: boolean) => isStarting && startingPractice === practice;

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-6">
      <div className={`p-5 rounded-full ${perfect ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
        <Trophy className={`h-12 w-12 ${perfect ? "text-green-400" : "text-yellow-400"}`} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka mb-2">
          {session.practice ? "Practice Complete!" : perfect ? "Perfect Score!" : "Quiz Complete!"}
        </h1>
        <p className="text-white/60 mb-1">{result.source.title}</p>
        <p className="text-white/80 text-lg">
          You got {result.correct} out of {result.total} correct.
        </p>
        {session.practice && !owedCampaign && (
          <p className="text-white/60 text-sm mt-2">
            Ready to play it for real, without the pointer?
          </p>
        )}
      </div>

      {!result.isPreview && result.points && (
        <div
          className={`w-full max-w-sm rounded-2xl border p-5 space-y-3 ${
            result.pointEarned ? "border-secondary/40 bg-secondary/10" : "border-white/10 bg-card/50"
          }`}
        >
          {result.pointEarned ? (
            <p className="flex items-center justify-center gap-2 text-secondary font-fredoka text-2xl">
              <Star className="h-6 w-6 fill-current" aria-hidden />
              +1 point
            </p>
          ) : (
            result.noPointReason && (
              <p className="text-white/70 text-sm">
                {noPointMessage(result.noPointReason, settings.points)}
              </p>
            )
          )}
          <PointsSummary points={result.points} />
        </div>
      )}

      {result.brand && (
        <div className="w-full max-w-sm flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-card/50 p-5">
          {result.brand.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.brand.logoUrl}
              alt={`${result.brand.brandName} logo`}
              className="h-14 w-14 rounded-xl object-contain bg-white p-1"
            />
          )}
          <p className="text-white/70 text-sm">Sponsored by {result.brand.brandName}</p>
          <BrandCta brand={result.brand} variant="button" />
        </div>
      )}

      {owedCampaign && (
        <CampaignGate
          campaign={owedCampaign}
          timerSeconds={session.timerSeconds}
          cardCount={session.cardCount}
        />
      )}

      <div className="flex gap-4 flex-wrap justify-center">
        {!owedCampaign && session.practice && (
          <Button
            onClick={() => startAgain(false)}
            disabled={isStarting}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
          >
            {spinnerOn(false) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Play Now
          </Button>
        )}
        {!owedCampaign && (
          <Button
            onClick={() => startAgain(session.practice)}
            disabled={isStarting}
            variant="outline"
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            {spinnerOn(session.practice) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            {session.practice ? "Practise Again" : "Retry"}
          </Button>
        )}
        <Button
          onClick={() => router.push(exit.href)}
          variant={session.practice && !owedCampaign ? "outline" : "default"}
          className={
            session.practice && !owedCampaign
              ? "border-white/20 text-white/80 hover:bg-white/10"
              : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          }
        >
          <Grid2x2 className="h-4 w-4 mr-2" />
          {exit.label}
        </Button>
      </div>
    </div>
  );
}
