"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PencilLine } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { CampaignGate } from "@/components/trivia/campaign-gate";
import { SessionSetup, type SessionChoice } from "@/components/trivia/session-setup";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { rememberPersonalTrivia } from "@/lib/return-path";
import { useStartTriviaSession } from "@/hooks/use-start-trivia-session";
import type { CustomQuizResponse } from "@/types";

/** Playing a personal trivia: the usual setup (timer, cards, picture mix, practice). */
export default function PlayPersonalTriviaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { start, isStarting, gate } = useStartTriviaSession();
  // Kept so the sponsored trivia, if one is owed, uses what the player just picked.
  const [choice, setChoice] = useState<SessionChoice | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["custom-quiz", id],
    queryFn: () => api.get<CustomQuizResponse>(ENDPOINTS.CUSTOM_QUIZ(id)).then((res) => res.data),
  });

  if (isLoading) {
    return <PageLoader message="Loading trivia..." />;
  }

  if (error || !data || data.quiz.origin !== "personal") {
    return (
      <PageError
        title="Trivia not found"
        message="This trivia does not exist or isn't yours."
        onRetry={() => router.push(routes.USER.MY_TRIVIA)}
      />
    );
  }

  const { quiz } = data;
  const cardCount = data.cards?.length ?? quiz.cardCount;

  return (
    <MainLayout maxWidth="2xl">
      <div className="flex flex-col items-center gap-8 py-6">
        <Link
          href={routes.USER.MY_TRIVIA}
          className="self-start text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          My Trivia
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white font-fredoka break-words">{quiz.title}</h1>
          {quiz.description && <p className="text-white/70">{quiz.description}</p>}
          <Link
            href={routes.USER.MY_TRIVIA_EDIT(id)}
            className="text-secondary hover:text-secondary/80 text-sm inline-flex items-center gap-1"
          >
            <PencilLine className="h-3.5 w-3.5" />
            Edit questions
          </Link>
        </div>

        {cardCount === 0 ? (
          <p className="text-white/60 text-center">
            This trivia has no questions yet.{" "}
            <Link href={routes.USER.MY_TRIVIA_EDIT(id)} className="text-secondary font-semibold">
              Add some
            </Link>
          </p>
        ) : gate ? (
          <CampaignGate
            campaign={gate}
            timerSeconds={choice?.timerSeconds}
            cardCount={choice?.cardCount}
            practice={choice?.practice}
          />
        ) : (
          <SessionSetup
            bounds={data.cardCountBounds ?? { min: 1, max: cardCount }}
            cardMix={data.cardMix}
            defaultTimerSeconds={quiz.defaultTimerSeconds}
            defaultCardCount={quiz.defaultCardCount}
            isStarting={isStarting}
            onStart={(picked) => {
              setChoice(picked);
              rememberPersonalTrivia(quiz.id);
              start({ sourceType: "custom", sourceId: quiz.id, ...picked });
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
