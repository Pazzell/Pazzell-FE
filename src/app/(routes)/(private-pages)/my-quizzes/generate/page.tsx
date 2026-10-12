"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
import {
  DocumentForm,
  documentRequestBody,
  type DocumentSource,
} from "@/components/cards/document-form";
import {
  DraftCardList,
  draftCardsPayload,
  firstDraftProblem,
  toReviewCards,
  type ReviewCard,
} from "@/components/cards/draft-card-list";
import { useGameSettings } from "@/hooks/use-game-settings";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type {
  CustomQuizResponse,
  CustomQuizzesResponse,
  GenerateCardsResponse,
  GenerateInfoResponse,
} from "@/types";

const NEW_QUIZ = "new";

export default function GenerateQuizPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useGameSettings();

  const [cards, setCards] = useState<ReviewCard[] | null>(null);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState<string | null>(null);
  // Set once the quiz exists, so a failed card save is retried on the same quiz.
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  const info = useQuery({
    queryKey: ["custom-quiz-generate"],
    queryFn: () =>
      api.get<GenerateInfoResponse>(ENDPOINTS.CUSTOM_QUIZ_GENERATE).then((res) => res.data.generate),
  });
  const quizzes = useQuery({
    queryKey: ["custom-quizzes"],
    queryFn: () =>
      api.get<CustomQuizzesResponse>(ENDPOINTS.CUSTOM_QUIZZES).then((res) => res.data),
  });

  const owned = quizzes.data?.quizzes ?? [];
  const limit = quizzes.data?.limit ?? null;
  const canCreate = limit === null || owned.length < limit;

  // Opened from a quiz's editor (?quiz=<id>): the cards go to that quiz. Otherwise a new
  // quiz, unless the free plan has no room for one.
  useEffect(() => {
    if (destination !== null || !quizzes.data) return;
    const mine = quizzes.data.quizzes;
    const wanted = new URLSearchParams(window.location.search).get("quiz");
    if (wanted && mine.some((quiz) => quiz.id === wanted)) setDestination(wanted);
    else setDestination(canCreate || mine.length === 0 ? NEW_QUIZ : mine[0].id);
  }, [destination, quizzes.data, canCreate]);

  const generate = useMutation({
    mutationFn: (source: DocumentSource) =>
      api
        .post<GenerateCardsResponse>(ENDPOINTS.CUSTOM_QUIZ_GENERATE, documentRequestBody(source))
        .then((res) => res.data),
    onSuccess: (data) => {
      setCards(toReviewCards(data.cards));
      setTitle((current) => current || data.suggestedTitle || "");
      queryClient.invalidateQueries({ queryKey: ["custom-quiz-generate"] });
      if (data.cards.length < data.requested) {
        toast.info(`${data.cards.length} of ${data.requested} cards could be backed by your document.`);
      }
    },
    onError: (error) => {
      const body = getApiError(error);
      if (body?.code === "GENERATION_LIMIT_REACHED" && body.details?.isPro === false) {
        setUpgradeMessage(`${body.message} Pro players can use more documents each day.`);
        return;
      }
      toast.error(body?.message || "Couldn't read the document. Please try again.");
    },
  });

  const save = useMutation({
    mutationFn: async (kept: ReviewCard[]) => {
      let quizId = destination === NEW_QUIZ ? createdQuizId : destination;
      if (!quizId) {
        const created = await api.post<CustomQuizResponse>(ENDPOINTS.CUSTOM_QUIZZES, {
          title: title.trim(),
          description: "",
          defaultTimerSeconds: settings.timer.defaultSeconds,
          defaultCardCount: Math.min(
            Math.max(kept.length, settings.customQuiz.minCardsToPublish),
            settings.trivia.maxCards
          ),
        });
        quizId = created.data.quiz.id;
        setCreatedQuizId(quizId);
      }
      await api.post(ENDPOINTS.CUSTOM_QUIZ_CARDS_BULK(quizId), { cards: draftCardsPayload(kept) });
      return quizId;
    },
    onSuccess: (quizId, kept) => {
      queryClient.invalidateQueries({ queryKey: ["custom-quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["custom-quiz", quizId] });
      toast.success(`${kept.length} ${kept.length === 1 ? "card" : "cards"} added.`);
      router.replace(routes.USER.MY_QUIZ_EDIT(quizId));
    },
    onError: (error) => {
      const body = getApiError(error);
      if (body?.code === "UPGRADE_REQUIRED") {
        setUpgradeMessage(body.message);
        return;
      }
      toast.error(body?.message || "Couldn't save the cards. Please try again.");
    },
  });

  const handleSave = () => {
    const kept = cards ?? [];
    if (kept.length === 0) {
      toast.error("Keep at least one card.");
      return;
    }
    if (destination === NEW_QUIZ && !title.trim()) {
      toast.error("Give your quiz a title.");
      return;
    }
    const problem = firstDraftProblem(kept);
    if (problem) {
      toast.error(problem);
      return;
    }
    save.mutate(kept);
  };

  const outOfDocuments = info.data ? info.data.remaining <= 0 : false;

  return (
    <MainLayout maxWidth="3xl">
      <div className="space-y-6">
        <Link
          href={routes.USER.MY_QUIZZES}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          My Quizzes
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-secondary" />
            Quiz from a document
          </h1>
          <p className="text-white/70 mt-1">
            Upload your study material. We write the questions and answers from it, and you check
            them before anything is saved.
          </p>
        </div>

        {info.isLoading && <Skeleton className="h-64 rounded-2xl" />}
        {info.error && (
          <PageError
            title="Couldn't load this page"
            message="Please check your connection and try again."
            onRetry={() => info.refetch()}
            withLayout={false}
          />
        )}

        {info.data && !info.data.enabled && (
          <p className="text-white/70 text-center py-12 rounded-2xl border border-dashed border-white/10">
            Making a quiz from a document is not available yet. You can still add cards by hand.
          </p>
        )}

        {info.data?.enabled && (
          // Kept mounted during review so "Start over" comes back to the same document.
          <div hidden={cards !== null}>
            <DocumentForm
              count={info.data.count}
              maxFileBytes={info.data.maxFileBytes}
              pending={generate.isPending}
              disabled={outOfDocuments}
              onSubmit={(source) => generate.mutate(source)}
              note={
                <span className="text-white/50 text-sm">
                  {info.data.remaining} of {info.data.dailyLimit} documents left today
                </span>
              }
            >
              {outOfDocuments && (
                <p className="text-yellow-300 text-sm">
                  You have used today&apos;s documents. Come back tomorrow
                  {quizzes.data?.limit !== null && (
                    <>
                      , or{" "}
                      <Link href={routes.USER.PRO} className="underline">
                        go Pro
                      </Link>{" "}
                      for more
                    </>
                  )}
                  .
                </p>
              )}
            </DocumentForm>
          </div>
        )}

        {cards !== null && (
          <div className="space-y-6">
            <div className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white font-fredoka">
                Check your cards ({cards.length})
              </h2>
              <p className="text-white/60 text-sm">
                Edit anything that looks off, pick the correct option, and remove cards you
                don&apos;t want. Each card shows the sentence it came from.
              </p>
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-white/80">
                  Save to
                </Label>
                <select
                  id="destination"
                  value={destination ?? NEW_QUIZ}
                  onChange={(event) => setDestination(event.target.value)}
                  className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
                >
                  <option value={NEW_QUIZ} disabled={!canCreate && !createdQuizId} className="text-black">
                    A new quiz{!canCreate && !createdQuizId ? " (free plan limit reached)" : ""}
                  </option>
                  {owned.map((quiz) => (
                    <option key={quiz.id} value={quiz.id} className="text-black">
                      {quiz.title}
                    </option>
                  ))}
                </select>
              </div>
              {destination === NEW_QUIZ && (
                <div className="space-y-2">
                  <Label htmlFor="quiz-title" className="text-white/80">
                    Title
                  </Label>
                  <Input
                    id="quiz-title"
                    value={title}
                    maxLength={80}
                    onChange={(event) => setTitle(event.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}
            </div>

            <DraftCardList cards={cards} onChange={setCards} />

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                type="button"
                onClick={handleSave}
                disabled={save.isPending || save.isSuccess}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save {cards.length} {cards.length === 1 ? "card" : "cards"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCards(null)}
                disabled={save.isPending}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                Start over
              </Button>
            </div>
          </div>
        )}
      </div>

      <UpgradePrompt
        open={upgradeMessage !== null}
        onOpenChange={(open) => !open && setUpgradeMessage(null)}
        message={upgradeMessage ?? undefined}
      />
    </MainLayout>
  );
}
