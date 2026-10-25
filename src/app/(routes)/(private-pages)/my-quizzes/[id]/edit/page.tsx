"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  Copy,
  Eye,
  Link2Off,
  Loader2,
  Play,
  RefreshCw,
  Share2,
  Trash2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardManager } from "@/components/cards/card-manager";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
import { QuizDetailsForm, type QuizDetailsValues } from "@/components/quizzes/quiz-details-form";
import { QuizStatusBadge } from "@/components/quizzes/quiz-status-badge";
import { HostTeamGameDialog } from "@/components/team-game/host-team-game-dialog";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import type { CustomQuizResponse, CustomQuizStatsResponse } from "@/types";

type Confirm = "regenerate" | "revoke" | "delete" | null;

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useGameSettings();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [hosting, setHosting] = useState(false);

  const quizKey = ["custom-quiz", id];
  const { data, isLoading, error } = useQuery({
    queryKey: quizKey,
    queryFn: () => api.get<CustomQuizResponse>(ENDPOINTS.CUSTOM_QUIZ(id)).then((res) => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ["custom-quiz-stats", id],
    queryFn: () =>
      api
        .get<CustomQuizStatsResponse>(ENDPOINTS.CUSTOM_QUIZ_STATS(id))
        .then((res) => res.data.stats),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: quizKey });
    queryClient.invalidateQueries({ queryKey: ["custom-quizzes"] });
  };

  const onActionError = (err: unknown, fallback: string) => {
    setConfirm(null);
    const body = getApiError(err);
    if (body?.code === "UPGRADE_REQUIRED") {
      setUpgradeMessage(
        body.details?.reason === "quiz_locked"
          ? "This quiz is locked because Pro ended. Renew Pro to publish it again."
          : body.message
      );
      return;
    }
    toast.error(body?.message || fallback);
  };

  const saveDetails = useMutation({
    mutationFn: ({ coverImageUrl, ...values }: QuizDetailsValues) =>
      api.patch(ENDPOINTS.CUSTOM_QUIZ(id), {
        ...values,
        // Only a newly uploaded cover is sent; the stored one is kept otherwise.
        ...(coverImageUrl && coverImageUrl !== data?.quiz.coverImageUrl ? { coverImageUrl } : {}),
      }),
    onSuccess: () => {
      toast.success("Quiz details saved.");
      refresh();
    },
    onError: (err) => onActionError(err, "Couldn't save the quiz. Please try again."),
  });

  // Publish, unpublish, regenerate and revoke all change status and/or the share link.
  const linkAction = useMutation({
    mutationFn: (action: "publish" | "unpublish" | "regenerate" | "revoke") => {
      switch (action) {
        case "publish":
          return api.post(ENDPOINTS.CUSTOM_QUIZ_PUBLISH(id));
        case "unpublish":
          return api.post(ENDPOINTS.CUSTOM_QUIZ_UNPUBLISH(id));
        case "regenerate":
          return api.post(ENDPOINTS.CUSTOM_QUIZ_LINK_REGENERATE(id));
        case "revoke":
          return api.delete(ENDPOINTS.CUSTOM_QUIZ_LINK_REVOKE(id));
      }
    },
    onSuccess: (_res, action) => {
      setConfirm(null);
      const team = data?.quiz.mode === "team";
      toast.success(
        {
          publish: team ? "Your team quiz is live. Host a game to get a join link." : "Your quiz is live. Share the link!",
          unpublish: team ? "Quiz unpublished." : "Quiz unpublished. The link no longer works.",
          regenerate: "New link created. The old one no longer works.",
          revoke: "Link revoked. The quiz is unpublished.",
        }[action]
      );
      refresh();
    },
    onError: (err) => onActionError(err, "That didn't work. Please try again."),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(ENDPOINTS.CUSTOM_QUIZ(id)),
    onSuccess: () => {
      toast.success("Quiz deleted.");
      queryClient.invalidateQueries({ queryKey: ["custom-quizzes"] });
      router.replace(routes.USER.MY_QUIZZES);
    },
    onError: (err) => onActionError(err, "Couldn't delete the quiz. Please try again."),
  });

  if (isLoading) {
    return <PageLoader message="Loading quiz..." />;
  }

  if (error || !data) {
    return (
      <PageError
        title="Quiz not found"
        message="This quiz does not exist or isn't yours."
        onRetry={() => router.push(routes.USER.MY_QUIZZES)}
      />
    );
  }

  const { quiz } = data;
  const cards = data.cards ?? [];
  const minCards = data.minCardsToPublish ?? settings.customQuiz.minCardsToPublish;
  const shareUrl = quiz.shareUrl;
  const isTeam = quiz.mode === "team";

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const shareLink = async () => {
    if (!shareUrl) return;
    if (!navigator.share) {
      copyLink();
      return;
    }
    try {
      await navigator.share({ title: quiz.title, url: shareUrl });
    } catch {
      // The share sheet was dismissed.
    }
  };

  return (
    <MainLayout maxWidth="3xl">
      <div className="space-y-8">
        <Link
          href={routes.USER.MY_QUIZZES}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          My Quizzes
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0">
            <h1 className="text-3xl font-bold text-white font-fredoka break-words">{quiz.title}</h1>
            <QuizStatusBadge status={quiz.status} />
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              <Link href={routes.USER.MY_QUIZ_PREVIEW(quiz.id)}>
                <Eye className="h-4 w-4 mr-2" />
                Review &amp; Test
              </Link>
            </Button>
            {quiz.status === "live" ? (
              <Button
                variant="outline"
                onClick={() => linkAction.mutate("unpublish")}
                disabled={linkAction.isPending}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                Unpublish
              </Button>
            ) : (
              <Button
                onClick={() => linkAction.mutate("publish")}
                disabled={linkAction.isPending || cards.length < minCards}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                {linkAction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish
              </Button>
            )}
          </div>
        </div>

        {quiz.status === "locked" && (
          <p className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200 text-sm">
            This quiz is locked because Pro ended. You can still edit it, but it can&apos;t be
            published.{" "}
            <Link href={routes.USER.PRO} className="underline font-medium">
              Renew Pro
            </Link>{" "}
            to bring it back with the same link.
          </p>
        )}

        {quiz.status !== "live" && quiz.status !== "locked" && cards.length < minCards && (
          <p className="text-white/60 text-sm">
            {isTeam
              ? `A team quiz needs at least ${minCards} cards, one for each cell of the board, before it can be published.`
              : `A quiz needs at least ${minCards} cards before it can be published.`}
          </p>
        )}

        {shareUrl && (
          <section className="rounded-2xl border border-secondary/30 bg-card/50 p-5 space-y-3">
            <h2 className="text-white font-semibold">Share link</h2>
            <div className="flex gap-2 flex-wrap">
              <Input
                readOnly
                value={shareUrl}
                aria-label="Share link"
                onFocus={(event) => event.target.select()}
                className="bg-white/5 border-white/10 text-white flex-1 min-w-[12rem]"
              />
              <Button
                onClick={copyLink}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                onClick={shareLink}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirm("regenerate")}
                className="text-white/60 hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                New link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirm("revoke")}
                className="text-white/60 hover:text-red-400"
              >
                <Link2Off className="h-4 w-4 mr-2" />
                Revoke link
              </Button>
            </div>
          </section>
        )}

        {isTeam && quiz.status === "live" && (
          <section className="rounded-2xl border border-secondary/30 bg-card/50 p-5 space-y-3">
            <h2 className="text-white font-semibold">Host a team game</h2>
            <p className="text-white/60 text-sm">
              Open a lobby and share its join link. Players pick a team there; you run the game.
            </p>
            <Button
              onClick={() => setHosting(true)}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
            >
              <Play className="h-4 w-4 mr-2" />
              Host game
            </Button>
          </section>
        )}

        {stats && !isTeam && (
          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-card/50 p-5">
              <p className="text-white/60 text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Plays
              </p>
              <p className="text-2xl font-bold text-white font-fredoka">{stats.plays}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/50 p-5">
              <p className="text-white/60 text-sm">Average score</p>
              <p className="text-2xl font-bold text-white font-fredoka">
                {stats.averageScorePercent !== null
                  ? `${Math.round(stats.averageScorePercent)}%`
                  : "—"}
              </p>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-card/50 p-6 space-y-4">
          <h2 className="text-xl font-bold text-white font-fredoka">Details</h2>
          <QuizDetailsForm
            key={quiz.id}
            quiz={quiz}
            submitLabel="Save Details"
            pending={saveDetails.isPending}
            onSubmit={(values) => saveDetails.mutate(values)}
          />
        </section>

        <CardManager
          cards={cards}
          minCards={minCards}
          onChanged={refresh}
          generateHref={routes.USER.MY_QUIZ_GENERATE_FOR(id)}
          endpoints={{
            create: ENDPOINTS.CUSTOM_QUIZ_CARDS(id),
            bulk: ENDPOINTS.CUSTOM_QUIZ_CARDS_BULK(id),
            card: (cardId) => ENDPOINTS.CUSTOM_QUIZ_CARD(id, cardId),
          }}
        />

        <div className="pt-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={() => setConfirm("delete")}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete quiz
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "regenerate"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Create a new link?"
        description="The current link stops working immediately. Anyone you shared it with will need the new one."
        confirmLabel="Create new link"
        pending={linkAction.isPending}
        onConfirm={() => linkAction.mutate("regenerate")}
      />
      <ConfirmDialog
        open={confirm === "revoke"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Revoke the link?"
        description="The link stops working and the quiz becomes unpublished. You can publish it again later."
        confirmLabel="Revoke link"
        destructive
        pending={linkAction.isPending}
        onConfirm={() => linkAction.mutate("revoke")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Delete "${quiz.title}"?`}
        description="The quiz, its cards and its share link are removed. This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
      <HostTeamGameDialog quiz={hosting ? quiz : null} onOpenChange={setHosting} />
      <UpgradePrompt
        open={upgradeMessage !== null}
        onOpenChange={(open) => !open && setUpgradeMessage(null)}
        message={upgradeMessage ?? undefined}
      />
    </MainLayout>
  );
}
