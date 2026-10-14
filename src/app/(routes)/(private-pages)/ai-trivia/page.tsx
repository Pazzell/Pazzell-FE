"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers, Play, Plus, Sparkles, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
import { TriviaKindTabs } from "@/components/trivia/trivia-kind-tabs";
import { AiReviewBadge } from "@/components/trivia/ai-review-badge";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { AiTrivia, AiTriviaOptionsResponse, AiTriviasResponse } from "@/types";

const PRO_MESSAGE =
  "AI generated trivia is a Pro feature. Go Pro to have trivia written on any topic you choose.";

export default function AiTriviaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [deleting, setDeleting] = useState<AiTrivia | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ai-trivias"],
    queryFn: () => api.get<AiTriviasResponse>(ENDPOINTS.AI_TRIVIAS).then((res) => res.data.trivias),
  });
  const options = useQuery({
    queryKey: ["ai-trivia-options"],
    queryFn: () =>
      api.get<AiTriviaOptionsResponse>(ENDPOINTS.AI_TRIVIA_OPTIONS).then((res) => res.data.options),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.AI_TRIVIA(id)),
    onSuccess: () => {
      toast.success("Trivia deleted.");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["ai-trivias"] });
    },
    onError: (err) => {
      setDeleting(null);
      toast.error(getApiError(err)?.message || "Couldn't delete the trivia. Please try again.");
    },
  });

  const trivias = data ?? [];
  const isPro = options.data?.isPro ?? false;
  const enabled = options.data?.enabled ?? false;

  const handleNew = () => {
    if (isPro) {
      router.push(routes.USER.AI_TRIVIA_NEW);
    } else {
      setUpgradeOpen(true);
    }
  };

  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-8">
        <TriviaKindTabs active="ai" />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-secondary" />
              AI Generated Trivia
            </h1>
            <p className="text-white/70">
              Name any topic, describe the questions you want, and AI writes a trivia just for you.
            </p>
            {options.data && isPro && enabled && (
              <p className="text-white/50 text-sm mt-1">
                {options.data.remaining} of {options.data.dailyLimit} left to create today
              </p>
            )}
          </div>
          {enabled && (
            <Button
              onClick={handleNew}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
            >
              <Plus className="h-4 w-4 mr-2" />
              New AI Trivia
            </Button>
          )}
        </div>

        {options.data && !enabled && (
          <p className="text-white/70 text-center py-6 rounded-2xl border border-dashed border-white/10">
            Creating AI generated trivia is not available yet.
          </p>
        )}

        {options.data && enabled && !isPro && (
          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-white/80 text-sm max-w-xl">
              {trivias.length > 0
                ? "Your Pro plan has ended. You can still play the trivias below; renew Pro to create new ones."
                : "This is a Pro feature. With Pro you choose the exact topic and AI writes the questions."}
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-fredoka"
            >
              <Link href={routes.USER.PRO}>See Pro</Link>
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        )}

        {error && (
          <PageError
            title="Couldn't load your AI trivias"
            message="Please check your connection and try again."
            onRetry={() => refetch()}
            withLayout={false}
          />
        )}

        {data && trivias.length === 0 && (
          <p className="text-white/60 text-center py-16 rounded-2xl border border-dashed border-white/10">
            You don&apos;t have an AI generated trivia yet.
          </p>
        )}

        {trivias.length > 0 && (
          <ul className="space-y-3">
            {trivias.map((trivia) => (
              <li
                key={trivia.id}
                className="rounded-2xl border border-white/10 bg-card/50 p-5 flex items-center gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-[12rem] space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white font-fredoka">{trivia.title}</h2>
                    <AiReviewBadge status={trivia.reviewStatus} />
                  </div>
                  <p className="text-white/50 text-sm inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {trivia.cardCount} {trivia.cardCount === 1 ? "card" : "cards"}
                    {trivia.topic.name && <> · {trivia.topic.name}</>}
                  </p>
                  {trivia.prompt && (
                    <p className="text-white/60 text-sm line-clamp-2">{trivia.prompt}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    asChild
                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
                  >
                    <Link href={routes.USER.AI_TRIVIA_PLAY(trivia.id)}>
                      <Play className="h-4 w-4 mr-2" />
                      Play
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

      <UpgradePrompt open={upgradeOpen} onOpenChange={setUpgradeOpen} message={PRO_MESSAGE} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete "${deleting?.title ?? ""}"?`}
        description={
          deleting?.inGeneralTrivia
            ? "Your trivia is removed. Its questions stay in General Trivia. This can't be undone."
            : "The trivia and its questions are removed. This can't be undone."
        }
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </MainLayout>
  );
}
