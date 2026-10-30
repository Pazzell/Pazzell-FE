"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Layers, PencilLine, Play, Plus, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TriviaKindTabs } from "@/components/trivia/trivia-kind-tabs";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { CustomQuiz, CustomQuizzesResponse } from "@/types";

const PERSONAL_TRIVIAS_KEY = ["personal-trivias"];

/** The trivias a player wrote by hand for themselves. */
export default function MyTriviaPage() {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<CustomQuiz | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: PERSONAL_TRIVIAS_KEY,
    queryFn: () =>
      api.get<CustomQuizzesResponse>(ENDPOINTS.PERSONAL_TRIVIAS).then((res) => res.data.quizzes),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.CUSTOM_QUIZ(id)),
    onSuccess: () => {
      toast.success("Trivia deleted.");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: PERSONAL_TRIVIAS_KEY });
    },
    onError: (err) => {
      setDeleting(null);
      toast.error(getApiError(err)?.message || "Couldn't delete the trivia. Please try again.");
    },
  });

  const trivias = data ?? [];

  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-8">
        <TriviaKindTabs active="create" />

        <Link
          href={routes.USER.CREATE_TRIVIA}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Create Trivia
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-2">
              <PencilLine className="h-7 w-7 text-secondary" />
              My Trivia
            </h1>
            <p className="text-white/70">
              Trivia you write yourself, with pictures or short definitions. Only you can play it.
            </p>
          </div>
          <Button
            asChild
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
          >
            <Link href={routes.USER.MY_TRIVIA_NEW}>
              <Plus className="h-4 w-4 mr-2" />
              New Trivia
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        )}

        {error && (
          <PageError
            title="Couldn't load your trivia"
            message="Please check your connection and try again."
            onRetry={() => refetch()}
            withLayout={false}
          />
        )}

        {data && trivias.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 space-y-3">
            <p className="text-white/60">You haven&apos;t written a trivia yet.</p>
            <Link
              href={routes.USER.MY_TRIVIA_NEW}
              className="text-secondary hover:text-secondary/80 font-semibold text-sm"
            >
              Write your first one
            </Link>
          </div>
        )}

        {trivias.length > 0 && (
          <ul className="space-y-3">
            {trivias.map((trivia) => (
              <li
                key={trivia.id}
                className="rounded-2xl border border-white/10 bg-card/50 p-5 flex items-center gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-[12rem] space-y-1.5">
                  <h2 className="text-lg font-bold text-white font-fredoka break-words">
                    {trivia.title}
                  </h2>
                  <p className="text-white/50 text-sm inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {trivia.cardCount} {trivia.cardCount === 1 ? "card" : "cards"}
                  </p>
                  {trivia.description && (
                    <p className="text-white/60 text-sm line-clamp-2">{trivia.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {trivia.cardCount > 0 && (
                    <Button
                      asChild
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
                    >
                      <Link href={routes.USER.MY_TRIVIA_PLAY(trivia.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                  >
                    <Link href={routes.USER.MY_TRIVIA_EDIT(trivia.id)} aria-label={`Edit ${trivia.title}`}>
                      <PencilLine className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleting(trivia)}
                    aria-label={`Delete ${trivia.title}`}
                    className="text-white/60 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.title ?? ""}"?`}
        description="The trivia and its cards are removed. This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </MainLayout>
  );
}
