"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileText, Loader2, MessageSquareText, Sparkles } from "lucide-react";
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
import { PromptForm, type PromptSource } from "@/components/cards/prompt-form";
import { QuizModePicker } from "@/components/quizzes/quiz-mode-picker";
import { cn } from "@/lib/utils";
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
  CustomQuizMode,
  CustomQuizResponse,
  CustomQuizzesResponse,
  GenerateCardsResponse,
  GenerateInfoResponse,
} from "@/types";

const NEW_QUIZ = "new";

/** What the cards are written from: the owner's description, or their document. */
type Request = { kind: "prompt"; source: PromptSource } | { kind: "document"; source: DocumentSource };

export default function GenerateQuizPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useGameSettings();

  const [cards, setCards] = useState<ReviewCard[] | null>(null);
  const [from, setFrom] = useState<Request["kind"]>("prompt");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<CustomQuizMode>("broadcast");
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

  // The quiz the cards go to, when it already exists: its title tells the AI the subject.
  const target = owned.find((quiz) => quiz.id === destination);

  const generate = useMutation({
    mutationFn: (request: Request) =>
      api
        .post<GenerateCardsResponse>(
          ENDPOINTS.CUSTOM_QUIZ_GENERATE,
          request.kind === "prompt"
            ? { ...request.source, ...(target ? { topic: target.title } : {}) }
            : documentRequestBody(request.source)
        )
        .then((res) => res.data),
    onSuccess: (data) => {
      setCards(toReviewCards(data.cards));
      setTitle((current) => current || data.suggestedTitle || "");
      queryClient.invalidateQueries({ queryKey: ["custom-quiz-generate"] });
      if (data.cards.length < data.requested) {
        toast.info(
          data.prompt !== null
            ? `${data.cards.length} of ${data.requested} questions passed the answer check.`
            : `${data.cards.length} of ${data.requested} cards could be backed by your document.`
        );
      }
    },
    onError: (error) => {
      const body = getApiError(error);
      if (body?.code === "GENERATION_LIMIT_REACHED" && body.details?.isPro === false) {
        setUpgradeMessage(`${body.message} Pro players can generate more each day.`);
        return;
      }
      toast.error(body?.message || "Couldn't write the questions. Please try again.");
    },
  });

  const save = useMutation({
    mutationFn: async (kept: ReviewCard[]) => {
      let quizId = destination === NEW_QUIZ ? createdQuizId : destination;
      if (!quizId) {
        const created = await api.post<CustomQuizResponse>(ENDPOINTS.CUSTOM_QUIZZES, {
          title: title.trim(),
          mode,
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

  const outOfGenerations = info.data ? info.data.remaining <= 0 : false;
  const allowanceNote = info.data && (
    <span className="text-white/50 text-sm">
      {info.data.remaining} of {info.data.dailyLimit} AI generations left today
    </span>
  );
  const outOfGenerationsNote = outOfGenerations && (
    <p className="text-yellow-300 text-sm">
      You have used today&apos;s AI generations. Come back tomorrow
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
  );

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
            Generate with AI
          </h1>
          <p className="text-white/70 mt-1">
            Describe the questions you want, or upload your material. The AI writes the questions
            and answers, and you check and edit them before anything is saved.
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
            Generating questions with AI is not available yet. You can still add cards by hand.
          </p>
        )}

        {info.data?.enabled && (
          // Kept mounted during review so "Start over" comes back to what was entered.
          <div hidden={cards !== null} className="space-y-4">
            <div
              role="tablist"
              aria-label="Write the questions from"
              className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1"
            >
              {(
                [
                  { kind: "prompt", label: "Describe it", icon: MessageSquareText },
                  { kind: "document", label: "From a document", icon: FileText },
                ] as const
              ).map(({ kind, label, icon: Icon }) => (
                <button
                  key={kind}
                  type="button"
                  role="tab"
                  aria-selected={from === kind}
                  onClick={() => setFrom(kind)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    from === kind ? "bg-secondary text-secondary-foreground" : "text-white/70 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            <div hidden={from !== "prompt"}>
              <PromptForm
                maxLength={info.data.prompt.maxLength}
                count={info.data.prompt.count}
                pending={generate.isPending}
                disabled={outOfGenerations}
                onSubmit={(source) => generate.mutate({ kind: "prompt", source })}
                note={allowanceNote}
              >
                {outOfGenerationsNote}
              </PromptForm>
            </div>
            <div hidden={from !== "document"}>
              <DocumentForm
                count={info.data.count}
                maxFileBytes={info.data.maxFileBytes}
                pending={generate.isPending}
                disabled={outOfGenerations}
                onSubmit={(source) => generate.mutate({ kind: "document", source })}
                note={allowanceNote}
              >
                {outOfGenerationsNote}
              </DocumentForm>
            </div>
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
                don&apos;t want. Nothing is saved until you press Save, and you publish the quiz
                when you&apos;re happy with it.
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
                <>
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
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-white/80">How will it be played?</span>
                    <QuizModePicker value={mode} onChange={setMode} />
                  </div>
                </>
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
