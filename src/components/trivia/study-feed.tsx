"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { ApiErrorBody, TriviaSession, TriviaStudyResponse } from "@/types";

interface StudyFeedProps {
  session: TriviaSession;
  /** Called once the server has moved the session into the quiz phase. */
  onQuizBegun: () => void;
}

/**
 * The study phase: one card per screen in a vertical scroll-snap feed, answers
 * shown. The player can move up and down freely until they start the quiz.
 */
export function StudyFeed({ session, onQuizBegun }: StudyFeedProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const feedRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const { data, isLoading, error, refetch } = useQuery<
    TriviaStudyResponse,
    AxiosError<ApiErrorBody>
  >({
    queryKey: ["trivia-study", session.id],
    queryFn: () =>
      api.get<TriviaStudyResponse>(ENDPOINTS.TRIVIA_SESSION_STUDY(session.id)).then((res) => res.data),
    retry: false,
    staleTime: Infinity,
  });
  const cards = data?.cards ?? [];

  // The quiz was already begun elsewhere (another tab, a stale page): follow the server.
  const studyOver = error?.response?.data?.code === "STUDY_PHASE_OVER";
  useEffect(() => {
    if (studyOver) onQuizBegun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyOver]);

  const goTo = useCallback(
    (target: number) => {
      const feed = feedRef.current;
      if (!feed) return;
      const clamped = Math.max(0, Math.min(cards.length - 1, target));
      feed.scrollTo({
        top: clamped * feed.clientHeight,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [cards.length, reducedMotion]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        goTo(index - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, index]);

  const handleScroll = () => {
    const feed = feedRef.current;
    if (!feed || feed.clientHeight === 0) return;
    setIndex(Math.round(feed.scrollTop / feed.clientHeight));
  };

  const beginQuiz = useMutation({
    mutationFn: () => api.post(ENDPOINTS.TRIVIA_SESSION_QUIZ_BEGIN(session.id)),
    onSuccess: onQuizBegun,
    onError: () => toast.error("Couldn't start the quiz. Please try again."),
  });

  const abandon = useMutation({
    mutationFn: () => api.post(ENDPOINTS.TRIVIA_SESSION_ABANDON(session.id)),
    onSuccess: () => router.push(routes.USER.TRIVIA),
    onError: () => toast.error("Couldn't leave the session. Please try again."),
  });

  if (isLoading || studyOver) {
    return <PageLoader message="Loading cards..." withLayout={false} />;
  }

  if (error || cards.length === 0) {
    return (
      <PageError
        title="Couldn't load the cards"
        message="Please check your connection and try again."
        onRetry={() => refetch()}
        withLayout={false}
      />
    );
  }

  const brand = session.brand;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white font-fredoka truncate">
            {session.source.title}
          </h1>
          {brand ? (
            <p className="text-white/60 text-sm flex items-center gap-2">
              {brand.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoUrl}
                  alt=""
                  className="h-5 w-5 rounded object-contain bg-white"
                />
              )}
              Sponsored by {brand.brandName}
            </p>
          ) : (
            <p className="text-white/60 text-sm">Study the cards, then start the quiz.</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/80 text-sm font-medium" aria-live="polite">
            {cards[index]?.position ?? index + 1} of {cards.length}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => abandon.mutate()}
            disabled={abandon.isPending}
            aria-label="Leave this trivia"
            className="text-white/60 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={feedRef}
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Study cards"
          className="h-[calc(100dvh-20rem)] min-h-[22rem] overflow-y-auto snap-y snap-mandatory rounded-2xl border border-white/10 bg-card/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cards.map((card) => (
            <article
              key={card.position}
              className="h-full snap-start snap-always flex flex-col items-center justify-center gap-6 p-6 pr-16"
            >
              {card.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.imageUrl}
                  alt={card.text ?? "Card image"}
                  className="max-h-[45%] w-auto max-w-full rounded-xl object-contain"
                />
              )}
              {card.text && (
                <p className="text-white text-lg sm:text-xl text-center font-medium max-w-md">
                  {card.text}
                </p>
              )}
              <ul className="w-full max-w-md space-y-3">
                {card.options.map((option) => (
                  <li
                    key={option.text}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
                      option.isCorrect
                        ? "border-green-400 bg-green-500/10 text-green-300 font-bold"
                        : "border-white/10 bg-white/5 text-white/70"
                    )}
                  >
                    <span>{option.text}</span>
                    {option.isCorrect && (
                      <>
                        <Check className="h-5 w-5 shrink-0" aria-hidden />
                        <span className="sr-only">(correct answer)</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous card"
            className="rounded-full border-white/20 bg-background/80 text-white hover:bg-white/10"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goTo(index + 1)}
            disabled={index >= cards.length - 1}
            aria-label="Next card"
            className="rounded-full border-white/20 bg-background/80 text-white hover:bg-white/10"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="sticky bottom-4">
        <Button
          onClick={() => beginQuiz.mutate()}
          disabled={beginQuiz.isPending}
          className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg py-6 shadow-lg"
        >
          {beginQuiz.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Quiz"}
        </Button>
      </div>
    </div>
  );
}
