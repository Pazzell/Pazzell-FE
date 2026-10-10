"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { QuizStage } from "@/components/trivia/quiz-stage";
import { TriviaResultView } from "@/components/trivia/trivia-result";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { TriviaResult, TriviaSession, TriviaSessionStatus } from "@/types";

/**
 * One page for every trivia session (topic, custom quiz or campaign). A session
 * starts straight in the quiz; which screen shows is keyed on the server's
 * `session.status`, so a refresh always lands back in the right place.
 */
export default function TriviaPlayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ["trivia-session", sessionId],
    queryFn: () =>
      api
        .get<{ success: boolean; session: TriviaSession }>(ENDPOINTS.TRIVIA_SESSION(sessionId))
        .then((res) => res.data.session),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  // Phase changes made on this page, ahead of the fetched session.
  const [localStatus, setLocalStatus] = useState<TriviaSessionStatus | null>(null);
  const [result, setResult] = useState<TriviaResult | null>(null);

  if (isLoading) {
    return <PageLoader message="Loading trivia..." />;
  }

  if (error || !session) {
    return (
      <PageError
        title="Trivia not found"
        message="This session does not exist or is no longer available."
        onRetry={() => router.push(routes.USER.TRIVIA)}
      />
    );
  }

  const status = localStatus ?? session.status;

  return (
    <MainLayout maxWidth="3xl" includeFooter={status === "completed"}>
      {status === "quiz" && (
        <QuizStage
          session={session}
          onCompleted={(finalResult) => {
            setResult(finalResult);
            setLocalStatus("completed");
          }}
        />
      )}

      {status === "completed" && <TriviaResultView session={session} initialResult={result} />}

      {status === "abandoned" && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <h1 className="text-2xl font-bold text-white font-fredoka">This trivia was left early</h1>
          <p className="text-white/60 max-w-sm">
            It no longer counts for anything. Pick a topic to start a fresh one.
          </p>
          <Button
            onClick={() => router.push(routes.USER.TRIVIA)}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            Pick a Topic
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
