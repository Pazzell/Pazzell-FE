"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileText, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { PageError } from "@/components/ui/page-error";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
import { validateCard } from "@/components/cards/card-form-dialog";
import { useGameSettings } from "@/hooks/use-game-settings";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type {
  CustomQuizResponse,
  CustomQuizzesResponse,
  DraftTriviaCard,
  GenerateCardsResponse,
  GenerateInfoResponse,
} from "@/types";

const NEW_QUIZ = "new";
const ACCEPT = ".pdf,.docx,.txt,.md";

interface ReviewCard extends DraftTriviaCard {
  key: number;
}

export default function GenerateQuizPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useGameSettings();
  const fileInput = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [count, setCount] = useState<number | null>(null);
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
    mutationFn: () => {
      const wanted = count ?? info.data?.count.default ?? 10;
      if (file) {
        const form = new FormData();
        form.append("document", file);
        form.append("count", String(wanted));
        return api.post<GenerateCardsResponse>(ENDPOINTS.CUSTOM_QUIZ_GENERATE, form).then((res) => res.data);
      }
      return api
        .post<GenerateCardsResponse>(ENDPOINTS.CUSTOM_QUIZ_GENERATE, { text: pasted, count: wanted })
        .then((res) => res.data);
    },
    onSuccess: (data) => {
      setCards(data.cards.map((card, key) => ({ ...card, key })));
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
      await api.post(ENDPOINTS.CUSTOM_QUIZ_CARDS_BULK(quizId), {
        cards: kept.map(({ type, text, options, correctOptionIndex }) => ({
          type,
          text: text.trim(),
          options: [options[0].trim(), options[1].trim()],
          correctOptionIndex,
        })),
      });
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

  const updateCard = (key: number, change: Partial<DraftTriviaCard>) =>
    setCards((current) =>
      (current ?? []).map((card) => (card.key === key ? { ...card, ...change } : card))
    );

  const handleGenerate = () => {
    if (!file && !pasted.trim()) {
      toast.error("Choose a document or paste your notes.");
      return;
    }
    if (file && info.data && file.size > info.data.maxFileBytes) {
      toast.error("The document is too large (maximum 10MB).");
      return;
    }
    generate.mutate();
  };

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
    for (let i = 0; i < kept.length; i++) {
      const problem = validateCard(kept[i]);
      if (problem) {
        toast.error(`Card ${i + 1}: ${problem}`);
        return;
      }
    }
    save.mutate(kept);
  };

  const wanted = count ?? info.data?.count.default ?? 10;
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

        {info.data?.enabled && cards === null && (
          <div className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="document" className="text-white/80">
                Document (PDF, Word or text, up to 10MB)
              </Label>
              <input
                ref={fileInput}
                id="document"
                type="file"
                accept={ACCEPT}
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInput.current?.click()}
                  className="border-white/20 text-white/80 hover:bg-white/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {file ? "Change document" : "Choose document"}
                </Button>
                {file && (
                  <span className="text-white text-sm inline-flex items-center gap-1 break-all">
                    <FileText className="h-4 w-4 text-secondary shrink-0" />
                    {file.name}
                  </span>
                )}
              </div>
              <p className="text-white/50 text-xs">
                Scanned pages and photos of notes can&apos;t be read. Use a document with real text.
              </p>
            </div>

            {!file && (
              <div className="space-y-2">
                <Label htmlFor="pasted" className="text-white/80">
                  Or paste your notes
                </Label>
                <Textarea
                  id="pasted"
                  rows={6}
                  value={pasted}
                  onChange={(event) => setPasted(event.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/80">Number of cards</Label>
                <span className="text-white font-fredoka">{wanted}</span>
              </div>
              <Slider
                aria-label="Number of cards"
                min={info.data.count.min}
                max={info.data.count.max}
                step={1}
                value={[wanted]}
                onValueChange={([v]) => setCount(v)}
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={generate.isPending || outOfDocuments}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                {generate.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {generate.isPending ? "Writing your cards…" : "Write my cards"}
              </Button>
              <span className="text-white/50 text-sm">
                {info.data.remaining} of {info.data.dailyLimit} documents left today
              </span>
            </div>
            {generate.isPending && (
              <p className="text-white/60 text-sm" role="status">
                This can take up to a minute. Keep this page open.
              </p>
            )}
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

            <ol className="space-y-3">
              {cards.map((card, index) => (
                <li
                  key={card.key}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-white/40 text-sm font-medium w-6 shrink-0 pt-2">
                      {index + 1}
                    </span>
                    <Textarea
                      aria-label={`Card ${index + 1} question`}
                      rows={2}
                      maxLength={300}
                      value={card.text}
                      onChange={(event) => updateCard(card.key, { text: event.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setCards((current) => (current ?? []).filter((c) => c.key !== card.key))
                      }
                      aria-label={`Remove card ${index + 1}`}
                      className="text-white/60 hover:text-red-400 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <fieldset className="pl-9 space-y-2">
                    <legend className="sr-only">Options for card {index + 1}</legend>
                    {([0, 1] as const).map((optionIndex) => (
                      <label key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${card.key}`}
                          checked={card.correctOptionIndex === optionIndex}
                          onChange={() => updateCard(card.key, { correctOptionIndex: optionIndex })}
                          aria-label={`Card ${index + 1} option ${optionIndex + 1} is correct`}
                          className="accent-green-500 h-4 w-4 shrink-0"
                        />
                        <Input
                          aria-label={`Card ${index + 1} option ${optionIndex + 1}`}
                          value={card.options[optionIndex]}
                          maxLength={80}
                          onChange={(event) => {
                            const options: [string, string] = [...card.options];
                            options[optionIndex] = event.target.value;
                            updateCard(card.key, { options });
                          }}
                          className={
                            card.correctOptionIndex === optionIndex
                              ? "bg-green-500/10 border-green-400 text-white"
                              : "bg-white/5 border-white/10 text-white"
                          }
                        />
                      </label>
                    ))}
                  </fieldset>
                  <p className="pl-9 text-white/50 text-xs break-words">
                    From your document: &ldquo;{card.quote}&rdquo;
                  </p>
                </li>
              ))}
            </ol>

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
