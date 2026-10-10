"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { CampaignGate } from "@/components/trivia/campaign-gate";
import { SessionSetup, type SessionChoice } from "@/components/trivia/session-setup";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useStartTriviaSession } from "@/hooks/use-start-trivia-session";
import type { TriviaTopicsResponse } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function TriviaTopicSetupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { start, isStarting, gate } = useStartTriviaSession();
  // Kept so the sponsored trivia, if one is owed, uses what the player just picked.
  const [choice, setChoice] = useState<SessionChoice | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["trivia-topics"],
    queryFn: () =>
      api.get<TriviaTopicsResponse>(ENDPOINTS.TRIVIA_TOPICS).then((res) => res.data),
  });
  const topic = data?.topics.find((t) => t.id === id);

  if (isLoading) {
    return <PageLoader message="Loading topic..." />;
  }

  if (error || !topic) {
    return (
      <PageError
        title="Topic not found"
        message="This topic does not exist or is no longer available."
        onRetry={() => router.push(routes.USER.TRIVIA)}
      />
    );
  }

  return (
    <MainLayout maxWidth="2xl">
      <div className="flex flex-col items-center gap-8 py-6">
        <button
          type="button"
          onClick={() => router.push(routes.USER.TRIVIA)}
          className="self-start text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          All topics
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white font-fredoka mb-2">{topic.name}</h1>
          {topic.description && <p className="text-white/70">{topic.description}</p>}
        </div>

        {gate ? (
          <CampaignGate
            campaign={gate}
            timerSeconds={choice?.timerSeconds}
            cardCount={choice?.cardCount}
            practice={choice?.practice}
          />
        ) : (
          <SessionSetup
            bounds={topic.cardCountBounds}
            isStarting={isStarting}
            onStart={(picked) => {
              setChoice(picked);
              start({ sourceType: "topic", sourceId: topic.id, ...picked });
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
