"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Layers, Loader2, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { TriviaKindTabs } from "@/components/trivia/trivia-kind-tabs";
import { filterTopics, TopicSearch } from "@/components/trivia/topic-search";
import { cardsNeeded, TEAM_TIMER_CHOICES } from "@/components/team-game/team-helpers";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { cn } from "@/lib/utils";
import type { TeamGameResponse, TriviaTopicsResponse } from "@/types";

const TEAM_COUNTS = [2, 3, 4, 5, 6];
const DEFAULT_TIMER = 30;

/**
 * A self-serve team game from one of our topics: pick a topic, the number of teams and the
 * time to answer, then share the link. Nobody hosts it: whoever creates it plays too and
 * starts it when the teams are ready.
 */
export default function PlayInTeamsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [teamCount, setTeamCount] = useState(2);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trivia-topics"],
    queryFn: () => api.get<TriviaTopicsResponse>(ENDPOINTS.TRIVIA_TOPICS).then((res) => res.data),
  });

  // A topic can be played in teams once it has a question for every cell of the smallest board.
  const playable = (data?.topics ?? []).filter((t) => t.cardCount >= cardsNeeded(TEAM_COUNTS[0]));
  const topics = filterTopics(playable, search);
  const topic = playable.find((t) => t.id === topicId) ?? null;

  const create = useMutation({
    mutationFn: () =>
      api
        .post<TeamGameResponse>(ENDPOINTS.TEAM_GAMES, { topicId, teamCount, timerSeconds })
        .then((res) => res.data.game),
    onSuccess: (game) => router.push(routes.TEAM_GAME(game.code)),
    onError: (err) => toast.error(getApiError(err)?.message || "Couldn't set up the game. Please try again."),
  });

  const pickTopic = (id: string) => {
    setTopicId(id);
    const cards = playable.find((t) => t.id === id)?.cardCount ?? 0;
    // Keep the team count to one the topic has enough questions for.
    if (cards < cardsNeeded(teamCount)) {
      setTeamCount([...TEAM_COUNTS].reverse().find((n) => cards >= cardsNeeded(n)) ?? 2);
    }
  };

  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-8">
        <TriviaKindTabs active="general" />

        <Link
          href={routes.USER.TRIVIA}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          General Trivia
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-2">
            <Users className="h-7 w-7 text-secondary" />
            Play in teams
          </h1>
          <p className="text-white/70 max-w-2xl">
            Pick a topic, set the teams and the time, then share the link. Teams take turns on a
            tic-tac-toe board, talk it over in their own chat, and the lead passes around the team
            after every turn. You play too, and you start the game when everyone is in.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-fredoka text-lg font-bold text-white">1. Choose a topic</h2>
          <TopicSearch value={search} onChange={setSearch} />

          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          )}

          {error && (
            <PageError
              title="Couldn't load topics"
              message="Please check your connection and try again."
              onRetry={() => refetch()}
              withLayout={false}
            />
          )}

          {data && topics.length === 0 && (
            <p className="text-white/60 text-center py-10 rounded-xl border border-dashed border-white/10">
              {playable.length === 0 ? "No topic has enough questions for a team game yet." : "No topic matches that search."}
            </p>
          )}

          {topics.length > 0 && (
            <div role="radiogroup" aria-label="Topic" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {topics.map((t) => {
                const selected = t.id === topicId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => pickTopic(t.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      selected
                        ? "border-secondary bg-secondary/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 font-fredoka text-white">
                      <span className="truncate">{t.name}</span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-secondary" />}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-white/50">
                      <Layers className="h-3 w-3" />
                      {t.cardCount} cards
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-fredoka text-lg font-bold text-white">2. Teams and time</h2>
          <div className="space-y-2">
            <p className="text-sm text-white/70">Number of teams</p>
            <div role="radiogroup" aria-label="Number of teams" className="flex flex-wrap gap-2">
              {TEAM_COUNTS.map((n) => {
                const enough = !topic || topic.cardCount >= cardsNeeded(n);
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={teamCount === n}
                    disabled={!enough}
                    onClick={() => setTeamCount(n)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      teamCount === n
                        ? "border-secondary bg-secondary/10 text-white"
                        : "border-white/10 text-white/70 hover:border-white/30"
                    )}
                  >
                    {n} teams
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-white/40">
              2 teams play a 3×3 board, 3 teams 4×4, and 4 to 6 teams 5×5. A bigger board needs a topic
              with more questions.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/70">Time to answer each question</p>
            <div role="radiogroup" aria-label="Time to answer" className="flex flex-wrap gap-2">
              {TEAM_TIMER_CHOICES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={timerSeconds === s}
                  onClick={() => setTimerSeconds(s)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
                    timerSeconds === s
                      ? "border-secondary bg-secondary/10 text-white"
                      : "border-white/10 text-white/70 hover:border-white/30"
                  )}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={() => create.mutate()}
            disabled={!topic || create.isPending || create.isSuccess}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg px-8 py-6"
          >
            {(create.isPending || create.isSuccess) && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            Create game and get the link
          </Button>
          <p className="text-sm text-white/50">
            {topic ? `${topic.name} · ${teamCount} teams · ${timerSeconds}s per question` : "Choose a topic to continue."}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
