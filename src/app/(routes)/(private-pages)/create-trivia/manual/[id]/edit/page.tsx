"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Play, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuizDetailsForm, type QuizDetailsValues } from "@/components/quizzes/quiz-details-form";
import { CardManager } from "@/components/cards/card-manager";
import { QUIZ_CARD_OPTIONS } from "@/components/cards/card-form-dialog";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { CustomQuizResponse } from "@/types";

/** Writing a personal trivia: its details and its cards (pictures or definitions, four options). */
export default function EditPersonalTriviaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const triviaKey = ["custom-quiz", id];
  const { data, isLoading, error } = useQuery({
    queryKey: triviaKey,
    queryFn: () => api.get<CustomQuizResponse>(ENDPOINTS.CUSTOM_QUIZ(id)).then((res) => res.data),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: triviaKey });
    queryClient.invalidateQueries({ queryKey: ["personal-trivias"] });
  };

  const saveDetails = useMutation({
    mutationFn: ({ coverImageUrl, ...values }: QuizDetailsValues) =>
      api.patch(ENDPOINTS.CUSTOM_QUIZ(id), {
        ...values,
        // Only a newly uploaded cover is sent; the stored one is kept otherwise.
        ...(coverImageUrl && coverImageUrl !== data?.quiz.coverImageUrl ? { coverImageUrl } : {}),
      }),
    onSuccess: () => {
      toast.success("Trivia details saved.");
      refresh();
    },
    onError: (err) =>
      toast.error(getApiError(err)?.message || "Couldn't save the trivia. Please try again."),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(ENDPOINTS.CUSTOM_QUIZ(id)),
    onSuccess: () => {
      toast.success("Trivia deleted.");
      queryClient.invalidateQueries({ queryKey: ["personal-trivias"] });
      router.replace(routes.USER.MY_TRIVIA);
    },
    onError: (err) => {
      setConfirmDelete(false);
      toast.error(getApiError(err)?.message || "Couldn't delete the trivia. Please try again.");
    },
  });

  if (isLoading) {
    return <PageLoader message="Loading trivia..." />;
  }

  // Only the owner's personal trivia opens here; anything else is "not found".
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
  const cards = data.cards ?? [];

  return (
    <MainLayout maxWidth="3xl">
      <div className="space-y-8">
        <Link
          href={routes.USER.MY_TRIVIA}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          My Trivia
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-white font-fredoka break-words">{quiz.title}</h1>
            <p className="text-white/60 text-sm mt-1">Only you can play this trivia.</p>
          </div>
          {cards.length > 0 ? (
            <Button
              asChild
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
            >
              <Link href={routes.USER.MY_TRIVIA_PLAY(id)}>
                <Play className="h-4 w-4 mr-2" />
                Play
              </Link>
            </Button>
          ) : (
            <p className="text-white/50 text-sm">Add a card to start playing.</p>
          )}
        </div>

        <section className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white font-fredoka">Details</h2>
          <QuizDetailsForm
            key={quiz.id}
            personal
            quiz={quiz}
            submitLabel="Save Details"
            pending={saveDetails.isPending}
            onSubmit={(values) => saveDetails.mutate(values)}
          />
        </section>

        <CardManager
          cards={cards}
          onChanged={refresh}
          optionCount={QUIZ_CARD_OPTIONS}
          endpoints={{
            create: ENDPOINTS.CUSTOM_QUIZ_CARDS(id),
            bulk: ENDPOINTS.CUSTOM_QUIZ_CARDS_BULK(id),
            card: (cardId) => ENDPOINTS.CUSTOM_QUIZ_CARD(id, cardId),
          }}
        />

        <div className="pt-4 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete trivia
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${quiz.title}"?`}
        description="The trivia and its cards are removed. This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </MainLayout>
  );
}
