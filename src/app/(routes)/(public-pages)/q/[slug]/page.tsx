"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai/react";
import { LogIn } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { CampaignGate } from "@/components/trivia/campaign-gate";
import { SessionSetup, type SessionChoice } from "@/components/trivia/session-setup";
import { userAtom } from "@/atom/user";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useStartTriviaSession } from "@/hooks/use-start-trivia-session";
import { clearReturnPath, rememberQuizSlug, setReturnPath } from "@/lib/return-path";
import type { CustomQuizPlayInfo, CustomQuizShareLanding } from "@/types";

/** The public landing for a shared custom quiz: `shareUrl` points here. */
export default function SharedQuizPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useAtomValue(userAtom);
  const { start, isStarting, gate } = useStartTriviaSession();
  const [choice, setChoice] = useState<SessionChoice | null>(null);

  // The stored user is only known in the browser; wait for it to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loggedIn = mounted && Boolean(user);

  // Back from login or sign-up: the return trip is done.
  useEffect(() => {
    if (loggedIn) clearReturnPath();
  }, [loggedIn]);

  const landing = useQuery({
    queryKey: ["quiz-link", slug],
    queryFn: () =>
      api.get<CustomQuizShareLanding>(ENDPOINTS.CUSTOM_QUIZ_LINK(slug)).then((res) => res.data.quiz),
    retry: false,
  });

  const playInfo = useQuery({
    queryKey: ["quiz-link-play-info", slug],
    queryFn: () =>
      api
        .get<CustomQuizPlayInfo>(ENDPOINTS.CUSTOM_QUIZ_LINK_PLAY_INFO(slug))
        .then((res) => res.data.quiz),
    enabled: loggedIn && landing.isSuccess,
    retry: false,
  });

  if (!mounted || landing.isLoading) {
    return <PageLoader message="Loading quiz..." />;
  }

  if (landing.error || !landing.data) {
    return (
      <PageError
        title="This quiz isn't available"
        message="The link may have been changed or switched off by its creator."
        showRetry={false}
      />
    );
  }

  const quiz = landing.data;
  const info = playInfo.data;

  const goTo = (path: string) => {
    setReturnPath(routes.QUIZ_SHARE(slug));
    router.push(path);
  };

  return (
    <MainLayout maxWidth="2xl">
      <div className="flex flex-col items-center gap-8 py-6 text-center">
        {quiz.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={quiz.coverImageUrl}
            alt=""
            className="max-h-56 w-full max-w-md rounded-2xl object-cover"
          />
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white font-fredoka break-words">{quiz.title}</h1>
          <p className="text-white/60 text-sm flex items-center justify-center gap-2">
            {quiz.creator.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={quiz.creator.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
            )}
            A trivia by {quiz.creator.name}
          </p>
          {quiz.description && <p className="text-white/70 max-w-md mx-auto">{quiz.description}</p>}
        </div>

        {!loggedIn && (
          <div className="w-full max-w-sm space-y-3">
            <Button
              onClick={() => goTo(routes.LOGIN)}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg py-6"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Log in to play
            </Button>
            <Button
              variant="outline"
              onClick={() => goTo(routes.REGISTER)}
              className="w-full border-white/20 text-white/80 hover:bg-white/10"
            >
              Create a free account
            </Button>
          </div>
        )}

        {loggedIn && playInfo.isLoading && <PageLoader message="Loading..." withLayout={false} />}

        {loggedIn && playInfo.error && (
          <PageError
            title="Couldn't load this quiz"
            message="Please check your connection and try again."
            onRetry={() => playInfo.refetch()}
            withLayout={false}
          />
        )}

        {loggedIn && info && gate && (
          <CampaignGate
            campaign={gate}
            timerSeconds={choice?.timerSeconds}
            cardCount={choice?.cardCount}
            practice={choice?.practice}
          />
        )}

        {loggedIn && info && !gate && (
          <SessionSetup
            bounds={info.cardCountBounds}
            defaultTimerSeconds={info.defaultTimerSeconds}
            defaultCardCount={info.defaultCardCount}
            isStarting={isStarting}
            onStart={(picked) => {
              setChoice(picked);
              rememberQuizSlug(info.id, slug);
              start({ sourceType: "custom", slug, ...picked });
            }}
          />
        )}
      </div>
    </MainLayout>
  );
}
