"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Grid2x2, Loader2, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { CampaignGate } from "@/components/trivia/campaign-gate";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useStartTriviaSession } from "@/hooks/use-start-trivia-session";
import type { TriviaResult, TriviaResultResponse, TriviaSession } from "@/types";

interface TriviaResultViewProps {
  session: TriviaSession;
  /** The result handed over by the last answer, when the quiz just finished on this page. */
  initialResult: TriviaResult | null;
}

export function TriviaResultView({ session, initialResult }: TriviaResultViewProps) {
  const router = useRouter();
  const { start, isStarting, gate } = useStartTriviaSession({ replace: true });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trivia-result", session.id],
    queryFn: () =>
      api
        .get<TriviaResultResponse>(ENDPOINTS.TRIVIA_SESSION_RESULT(session.id))
        .then((res) => res.data.result),
    enabled: !initialResult,
  });
  const result = initialResult ?? data;

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
  const isCampaign = result.source.type === "campaign";
  // A sponsored trivia is owed before any other one can start, so offer it right away.
  const owedCampaign =
    gate ?? (!isCampaign && result.campaignGate.required ? result.campaignGate.campaign : null);

  const handleRetry = () => {
    start({
      sourceType: result.source.type,
      sourceId: result.source.id,
      timerSeconds: session.timerSeconds,
      cardCount: session.cardCount,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-6">
      <div className={`p-5 rounded-full ${perfect ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
        <Trophy className={`h-12 w-12 ${perfect ? "text-green-400" : "text-yellow-400"}`} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka mb-2">
          {perfect ? "Perfect Score!" : "Quiz Complete!"}
        </h1>
        <p className="text-white/60 mb-1">{result.source.title}</p>
        <p className="text-white/80 text-lg">
          You got {result.correct} out of {result.total} correct.
        </p>
      </div>

      {result.brand && (
        <p className="text-white/60 text-sm flex items-center gap-2">
          {result.brand.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.brand.logoUrl}
              alt=""
              className="h-6 w-6 rounded object-contain bg-white"
            />
          )}
          Sponsored by {result.brand.brandName}
        </p>
      )}

      {owedCampaign && (
        <CampaignGate
          campaign={owedCampaign}
          timerSeconds={session.timerSeconds}
          cardCount={session.cardCount}
        />
      )}

      <div className="flex gap-4 flex-wrap justify-center">
        {!owedCampaign && (
          <Button
            onClick={handleRetry}
            disabled={isStarting}
            variant="outline"
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            {isStarting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Retry
          </Button>
        )}
        <Button
          onClick={() => router.push(routes.USER.TRIVIA)}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          <Grid2x2 className="h-4 w-4 mr-2" />
          Pick Another Topic
        </Button>
      </div>
    </div>
  );
}
