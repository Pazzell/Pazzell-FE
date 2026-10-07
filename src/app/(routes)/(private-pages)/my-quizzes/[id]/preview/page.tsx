"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { CardList } from "@/components/cards/card-manager";
import { QuizStatusBadge } from "@/components/quizzes/quiz-status-badge";
import { SessionSetup } from "@/components/trivia/session-setup";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import { useStartTriviaSession } from "@/hooks/use-start-trivia-session";
import type { CustomQuizResponse } from "@/types";

export default function PreviewQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { settings } = useGameSettings();
  const { start, isStarting } = useStartTriviaSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["custom-quiz", id],
    queryFn: () =>
      api.get<CustomQuizResponse>(ENDPOINTS.CUSTOM_QUIZ_PREVIEW(id)).then((res) => res.data),
  });

  if (isLoading) {
    return <PageLoader message="Loading quiz..." />;
  }

  if (error || !data) {
    return (
      <PageError
        title="Quiz not found"
        message="This quiz does not exist or isn't yours."
        onRetry={() => router.push(routes.USER.MY_QUIZZES)}
      />
    );
  }

  const { quiz } = data;
  const cards = data.cards ?? [];
  const max = Math.min(cards.length, settings.trivia.maxCards);
  const bounds = data.cardCountBounds ?? { min: Math.min(settings.trivia.minCards, max), max };

  return (
    <MainLayout maxWidth="3xl">
      <div className="space-y-8">
        <Link
          href={routes.USER.MY_QUIZZES}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          My Quizzes
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0">
            <h1 className="text-3xl font-bold text-white font-fredoka break-words">{quiz.title}</h1>
            <QuizStatusBadge status={quiz.status} />
            {quiz.description && <p className="text-white/70">{quiz.description}</p>}
          </div>
          <Button
            asChild
            variant="outline"
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <Link href={routes.USER.MY_QUIZ_EDIT(quiz.id)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>

        {cards.length === 0 ? (
          <p className="text-white/60 text-center py-10 rounded-xl border border-dashed border-white/10">
            This quiz has no cards yet. Add some to test it.
          </p>
        ) : (
          <>
            <section className="flex flex-col items-center gap-3">
              <h2 className="text-xl font-bold text-white font-fredoka">Test play</h2>
              <p className="text-white/60 text-sm text-center max-w-sm">
                Play it the way your players will. Test plays are never counted in your stats.
              </p>
              <SessionSetup
                bounds={bounds}
                defaultTimerSeconds={quiz.defaultTimerSeconds}
                defaultCardCount={quiz.defaultCardCount}
                startLabel="Start Test Play"
                isStarting={isStarting}
                onStart={(picked) => start({ sourceType: "custom", sourceId: quiz.id, ...picked })}
              />
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white font-fredoka">
                All cards ({cards.length})
              </h2>
              <CardList cards={cards} />
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}
