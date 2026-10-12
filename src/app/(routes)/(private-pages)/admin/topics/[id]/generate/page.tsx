"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
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
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type {
  AdminGenerateCardsResponse,
  AdminGenerateInfoResponse,
  AdminTriviaTopic,
} from "@/types";

/** Definition cards for a topic, written from a document and checked by the admin. */
export default function AdminGenerateCardsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<ReviewCard[] | null>(null);

  const info = useQuery({
    queryKey: ["admin-trivia-generate"],
    queryFn: () =>
      api
        .get<AdminGenerateInfoResponse>(ENDPOINTS.ADMIN_TRIVIA_GENERATE)
        .then((res) => res.data.generate),
  });
  const topic = useQuery({
    queryKey: ["admin-topic", id],
    queryFn: () =>
      api.get<{ topic: AdminTriviaTopic }>(ENDPOINTS.ADMIN_TRIVIA_TOPIC(id)).then((res) => res.data),
  });
  const topicName = topic.data?.topic.name ?? "the topic";

  const generate = useMutation({
    mutationFn: (source: DocumentSource) =>
      api
        .post<AdminGenerateCardsResponse>(
          ENDPOINTS.ADMIN_TRIVIA_GENERATE,
          // The topic is sent so questions it already has are not written again.
          documentRequestBody(source, { topicId: id })
        )
        .then((res) => res.data),
    onSuccess: (data) => {
      setCards(toReviewCards(data.cards));
      if (data.cards.length < data.requested) {
        toast.info(`${data.cards.length} of ${data.requested} cards could be backed by the document.`);
      }
    },
    onError: (error) => {
      toast.error(getApiError(error)?.message || "Couldn't read the document. Please try again.");
    },
  });

  const save = useMutation({
    mutationFn: (kept: ReviewCard[]) =>
      api.post(ENDPOINTS.ADMIN_TRIVIA_TOPIC_CARDS_BULK(id), { cards: draftCardsPayload(kept) }),
    onSuccess: (_data, kept) => {
      queryClient.invalidateQueries({ queryKey: ["admin-topic", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["trivia-topics"] });
      toast.success(`${kept.length} ${kept.length === 1 ? "card" : "cards"} added.`);
      router.replace(routes.ADMIN.TOPIC(id));
    },
    onError: (error) => {
      toast.error(getApiError(error)?.message || "Couldn't save the cards. Please try again.");
    },
  });

  const handleSave = () => {
    const kept = cards ?? [];
    if (kept.length === 0) {
      toast.error("Keep at least one card.");
      return;
    }
    const problem = firstDraftProblem(kept);
    if (problem) {
      toast.error(problem);
      return;
    }
    save.mutate(kept);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={routes.ADMIN.TOPIC(id)}
        className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        {topic.data ? topic.data.topic.name : "Back to the topic"}
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-secondary" />
          Cards from a document
        </h1>
        <p className="text-white/70 mt-1">
          Upload a document about this topic. Text questions with two options are written from
          it, and you check them before anything is saved. Pictures in the document are not read.
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
          Writing cards from a document is not available: the server has no AI key set. You can
          still add cards by hand.
        </p>
      )}

      {info.data?.enabled && (
        // Kept mounted during review so "Start over" comes back to the same document.
        <div hidden={cards !== null}>
          <DocumentForm
            count={info.data.count}
            maxFileBytes={info.data.maxFileBytes}
            pending={generate.isPending}
            onSubmit={(source) => generate.mutate(source)}
            note={
              <span className="text-white/50 text-sm">
                Questions already in {topicName} are not written again.
              </span>
            }
          />
        </div>
      )}

      {cards !== null && (
        <div className="space-y-6">
          <div className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-2">
            <h2 className="text-xl font-bold text-white font-fredoka">
              Check the cards ({cards.length})
            </h2>
            <p className="text-white/60 text-sm">
              Edit anything that looks off, pick the correct option, and remove cards you
              don&apos;t want. Each card shows the sentence it came from. Saved cards are added to{" "}
              <span className="text-white font-semibold">{topicName}</span> and are live for
              players straight away.
            </p>
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
  );
}
