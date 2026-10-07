"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Eye, FolderKanban, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
import { QuizStatusBadge } from "@/components/quizzes/quiz-status-badge";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { CustomQuiz, CustomQuizzesResponse } from "@/types";

export default function MyQuizzesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [deleting, setDeleting] = useState<CustomQuiz | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["custom-quizzes"],
    queryFn: () =>
      api.get<CustomQuizzesResponse>(ENDPOINTS.CUSTOM_QUIZZES).then((res) => res.data),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.CUSTOM_QUIZ(id)),
    onSuccess: () => {
      toast.success("Quiz deleted.");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["custom-quizzes"] });
    },
    onError: (err) => {
      setDeleting(null);
      toast.error(getApiError(err)?.message || "Couldn't delete the quiz. Please try again.");
    },
  });

  const quizzes = data?.quizzes ?? [];
  const limit = data?.limit ?? null;
  const atLimit = limit !== null && quizzes.length >= limit;

  const handleNew = () => {
    if (atLimit) {
      setUpgradeOpen(true);
    } else {
      router.push(routes.USER.MY_QUIZ_NEW);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-2">
              <FolderKanban className="h-7 w-7 text-secondary" />
              My Quizzes
            </h1>
            <p className="text-white/70">Build your own trivia and share it with a link.</p>
            {data && (
              <p className="text-white/50 text-sm mt-1">
                {limit === null
                  ? `${quizzes.length} ${quizzes.length === 1 ? "quiz" : "quizzes"} · unlimited with Pro`
                  : `${quizzes.length} of ${limit} free ${limit === 1 ? "quiz" : "quizzes"} used`}
              </p>
            )}
          </div>
          <Button
            onClick={handleNew}
            disabled={!data}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Quiz
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
            title="Couldn't load your quizzes"
            message="Please check your connection and try again."
            onRetry={() => refetch()}
            withLayout={false}
          />
        )}

        {data && quizzes.length === 0 && (
          <p className="text-white/60 text-center py-16 rounded-2xl border border-dashed border-white/10">
            You haven&apos;t made a quiz yet. Create one to get started.
          </p>
        )}

        {quizzes.length > 0 && (
          <ul className="space-y-3">
            {quizzes.map((quiz) => (
              <li
                key={quiz.id}
                className="rounded-2xl border border-white/10 bg-card/50 p-5 flex items-center gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-[12rem] space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={routes.USER.MY_QUIZ_EDIT(quiz.id)}
                      className="text-lg font-bold text-white font-fredoka hover:text-secondary"
                    >
                      {quiz.title}
                    </Link>
                    <QuizStatusBadge status={quiz.status} />
                  </div>
                  <p className="text-white/50 text-sm inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {quiz.cardCount} {quiz.cardCount === 1 ? "card" : "cards"}
                  </p>
                  {quiz.status === "locked" && (
                    <p className="text-red-300 text-sm">
                      Locked because Pro ended.{" "}
                      <Link href={routes.USER.PRO} className="underline">
                        Renew Pro
                      </Link>{" "}
                      to publish it again.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {quiz.shareUrl && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyLink(quiz.shareUrl as string)}
                      aria-label={`Copy share link for ${quiz.title}`}
                      className="text-white/60 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                  >
                    <Link
                      href={routes.USER.MY_QUIZ_PREVIEW(quiz.id)}
                      aria-label={`Preview ${quiz.title}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="icon"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                  >
                    <Link href={routes.USER.MY_QUIZ_EDIT(quiz.id)} aria-label={`Edit ${quiz.title}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleting(quiz)}
                    aria-label={`Delete ${quiz.title}`}
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

      <UpgradePrompt
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        message={
          limit !== null
            ? `The free plan includes ${limit} ${limit === 1 ? "quiz" : "quizzes"}. Delete one or go Pro to make more.`
            : undefined
        }
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.title ?? ""}"?`}
        description="The quiz, its cards and its share link are removed. This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </MainLayout>
  );
}
