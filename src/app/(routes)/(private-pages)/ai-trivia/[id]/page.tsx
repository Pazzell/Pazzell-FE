"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { CampaignGate } from "@/components/trivia/campaign-gate";
import { SessionSetup, type SessionChoice } from "@/components/trivia/session-setup";
import { AiReviewBadge } from "@/components/trivia/ai-review-badge";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { rememberAiTrivia } from "@/lib/return-path";
import { useStartTriviaSession } from "@/hooks/use-start-trivia-session";
import type { AiTriviaResponse } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function AiTriviaSetupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { start, isStarting, gate } = useStartTriviaSession();
  // Kept so the sponsored trivia, if one is owed, uses what the player just picked.
  const [choice, setChoice] = useState<SessionChoice | null>(null);

  const { data: trivia, isLoading, error } = useQuery({
    queryKey: ["ai-trivia", id],
    queryFn: () =>
      api.get<AiTriviaResponse>(ENDPOINTS.AI_TRIVIA(id)).then((res) => res.data.trivia),
  });

  if (isLoading) {
    return <PageLoader message="Loading trivia..." />;
  }

  if (error || !trivia) {
    return (
      <PageError
        title="Trivia not found"
        message="This trivia does not exist or is no longer available."
        onRetry={() => router.push(routes.USER.AI_TRIVIA)}
      />
    );
  }

  return (
    <MainLayout maxWidth="2xl">
      <div className="flex flex-col items-center gap-8 py-6">
        <button
          type="button"
          onClick={() => router.push(routes.USER.AI_TRIVIA)}
          className="self-start text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          AI Generated Trivia
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white font-fredoka">{trivia.title}</h1>
          {trivia.topic.name && <p className="text-white/70">{trivia.topic.name}</p>}
          <AiReviewBadge status={trivia.reviewStatus} />
        </div>

        {gate ? (
          <CampaignGate
            campaign={gate}
            timerSeconds={choice?.timerSeconds}
            cardCount={choice?.cardCount}
            practice={choice?.practice}
          />
        ) : (
          // No cardMix: an AI generated trivia has text questions only.
          <SessionSetup
            bounds={trivia.cardCountBounds}
            defaultTimerSeconds={trivia.defaultTimerSeconds}
            defaultCardCount={trivia.defaultCardCount}
            isStarting={isStarting}
            onStart={(picked) => {
              setChoice(picked);
              rememberAiTrivia(trivia.id);
              // The owner plays their trivia by id through the custom-quiz source.
              start({ sourceType: "custom", sourceId: trivia.id, ...picked });
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
