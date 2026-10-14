"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AiReviewBadge } from "@/components/trivia/ai-review-badge";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { cn } from "@/lib/utils";
import type {
  AdminAiTriviaApproveResponse,
  AdminAiTriviaResponse,
  AdminTopicsResponse,
} from "@/types";

// Where approved cards go, besides an existing topic's id.
const PLAYER_TOPIC = "player";
const NEW_TOPIC = "new";

export default function AdminAiTriviaReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [destination, setDestination] = useState(PLAYER_TOPIC);
  const [newTopicName, setNewTopicName] = useState("");
  const [note, setNote] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);

  const triviaKey = ["admin-ai-trivia", id];
  const { data, isLoading, error } = useQuery({
    queryKey: triviaKey,
    queryFn: () =>
      api.get<AdminAiTriviaResponse>(ENDPOINTS.ADMIN_AI_TRIVIA(id)).then((res) => res.data),
  });
  const topics = useQuery({
    queryKey: ["admin-topics"],
    queryFn: () =>
      api.get<AdminTopicsResponse>(ENDPOINTS.ADMIN_TRIVIA_TOPICS).then((res) => res.data.topics),
  });

  // Every card starts selected; the admin unticks the ones to leave out.
  useEffect(() => {
    if (data && selected === null) setSelected(new Set(data.cards.map((card) => card.id)));
  }, [data, selected]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: triviaKey });
    queryClient.invalidateQueries({ queryKey: ["admin-ai-trivias"] });
  };
  const onReviewError = (err: unknown) => {
    const body = getApiError(err);
    // Someone else reviewed it since this page loaded: show what it is now.
    if (body?.code === "ALREADY_REVIEWED") refresh();
    setConfirmReject(false);
    toast.error(body?.message || "That didn't work. Please try again.");
  };

  const approve = useMutation({
    mutationFn: () => {
      const cards = data?.cards ?? [];
      const picked = cards.filter((card) => selected?.has(card.id)).map((card) => card.id);
      return api
        .post<AdminAiTriviaApproveResponse>(ENDPOINTS.ADMIN_AI_TRIVIA_APPROVE(id), {
          ...(destination === NEW_TOPIC
            ? { topicName: newTopicName.trim() }
            : destination === PLAYER_TOPIC
              ? {}
              : { topicId: destination }),
          ...(picked.length < cards.length ? { cardIds: picked } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        })
        .then((res) => res.data);
    },
    onSuccess: (res) => {
      toast.success(
        `${res.added} ${res.added === 1 ? "question" : "questions"} added to ${res.topic.name}` +
          (res.skipped > 0 ? `; ${res.skipped} already there.` : ".")
      );
      refresh();
      // New cards (and maybe a new topic) are live for players at once.
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-topic"] });
      queryClient.invalidateQueries({ queryKey: ["trivia-topics"] });
    },
    onError: onReviewError,
  });

  const reject = useMutation({
    mutationFn: () =>
      api.post(ENDPOINTS.ADMIN_AI_TRIVIA_REJECT(id), note.trim() ? { note: note.trim() } : {}),
    onSuccess: () => {
      toast.success("Rejected. Its questions stay out of General Trivia.");
      setConfirmReject(false);
      refresh();
    },
    onError: onReviewError,
  });

  if (isLoading) {
    return <PageLoader message="Loading trivia..." withLayout={false} />;
  }

  if (error || !data) {
    return (
      <PageError
        title="Trivia not found"
        message="This trivia does not exist or was deleted by its owner."
        onRetry={() => router.push(routes.ADMIN.AI_TRIVIA)}
        withLayout={false}
      />
    );
  }

  const { trivia, cards } = data;
  const pending = trivia.reviewStatus === "pending";
  const pickedCount = selected?.size ?? cards.length;
  const publishedTopic = topics.data?.find((topic) => topic.id === trivia.publishedTopicId);
  const busy = approve.isPending || reject.isPending;

  const toggle = (cardId: string) => {
    const next = new Set(selected);
    if (next.has(cardId)) next.delete(cardId);
    else next.add(cardId);
    setSelected(next);
  };

  const handleApprove = () => {
    if (pickedCount === 0) {
      toast.error("Select at least one question to approve.");
      return;
    }
    if (destination === NEW_TOPIC && !newTopicName.trim()) {
      toast.error("Name the new topic.");
      return;
    }
    approve.mutate();
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href={routes.ADMIN.AI_TRIVIA}
        className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        AI Trivia Review
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white font-fredoka break-words">{trivia.title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <AiReviewBadge status={trivia.reviewStatus} audience="admin" />
          {trivia.owner.name && <span className="text-white/60 text-sm">by {trivia.owner.name}</span>}
          {trivia.topic.name && (
            <span className="text-white/60 text-sm">Topic: {trivia.topic.name}</span>
          )}
        </div>
      </div>

      {trivia.prompt && (
        <div className="rounded-2xl border border-white/10 bg-card/50 p-5 space-y-1">
          <p className="text-white/50 text-xs uppercase tracking-wide">What the player asked for</p>
          <p className="text-white/90 whitespace-pre-wrap break-words">{trivia.prompt}</p>
        </div>
      )}

      {!pending && (
        <div className="rounded-2xl border border-white/10 bg-card/50 p-5 space-y-1 text-sm">
          {trivia.reviewStatus === "approved" ? (
            <p className="text-white/80">
              {trivia.publishedCardCount ?? 0} of its questions were added to{" "}
              {trivia.publishedTopicId ? (
                <Link
                  href={routes.ADMIN.TOPIC(trivia.publishedTopicId)}
                  className="text-secondary underline"
                >
                  {publishedTopic?.name ?? "the topic"}
                </Link>
              ) : (
                "General Trivia"
              )}
              . Edit or remove them there.
            </p>
          ) : (
            <p className="text-white/80">Rejected. Its questions were not added to General Trivia.</p>
          )}
          {trivia.reviewNote && <p className="text-white/60">Note: {trivia.reviewNote}</p>}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white font-fredoka">
          Questions ({cards.length})
          {pending && <span className="text-white/50 text-sm font-normal"> · {pickedCount} selected</span>}
        </h2>
        {pending && (
          <p className="text-white/60 text-sm">
            Check each marked answer. Untick any question that is wrong, unclear or out of place;
            only ticked questions are added.
          </p>
        )}
        <ol className="space-y-3">
          {cards.map((card, index) => {
            const included = selected?.has(card.id) ?? true;
            return (
              <li
                key={card.id}
                className={cn(
                  "flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 items-start",
                  pending && !included && "opacity-50"
                )}
              >
                {pending ? (
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={() => toggle(card.id)}
                    disabled={busy}
                    aria-label={`Include question ${index + 1}`}
                    className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--secondary))]"
                  />
                ) : (
                  <span className="text-white/40 text-sm font-medium w-6 shrink-0 pt-0.5">
                    {index + 1}
                  </span>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  {card.text && <p className="text-white break-words">{card.text}</p>}
                  <div className="flex flex-wrap gap-2">
                    {card.options.map((option, optionIndex) => {
                      const correct = optionIndex === card.correctOptionIndex;
                      return (
                        <span
                          key={optionIndex}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm break-words",
                            correct
                              ? "border-green-400/50 bg-green-500/10 text-green-200"
                              : "border-white/15 text-white/70"
                          )}
                        >
                          {correct && <Check className="h-3.5 w-3.5 shrink-0" />}
                          {option}
                          {correct && <span className="sr-only"> (marked correct)</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {pending && (
        <div className="rounded-2xl border border-white/10 bg-card/50 p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-white/80">
              Add the questions to
            </Label>
            <select
              id="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              disabled={busy}
              className="w-full rounded-md bg-white/5 border border-white/10 text-white px-3 py-2 text-sm"
            >
              <option value={PLAYER_TOPIC} className="text-black">
                {trivia.topic.id
                  ? `${trivia.topic.name} (the player's choice)`
                  : `"${trivia.topic.name}" (the player's topic; created if it doesn't exist)`}
              </option>
              {(topics.data ?? [])
                .filter((topic) => topic.id !== trivia.topic.id)
                .map((topic) => (
                  <option key={topic.id} value={topic.id} className="text-black">
                    {topic.name}
                    {topic.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              <option value={NEW_TOPIC} className="text-black">
                A new topic…
              </option>
            </select>
          </div>
          {destination === NEW_TOPIC && (
            <div className="space-y-2">
              <Label htmlFor="new-topic" className="text-white/80">
                New topic name
              </Label>
              <Input
                id="new-topic"
                value={newTopicName}
                maxLength={60}
                onChange={(event) => setNewTopicName(event.target.value)}
                disabled={busy}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="review-note" className="text-white/80">
              Note (optional)
            </Label>
            <Textarea
              id="review-note"
              value={note}
              rows={2}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <p className="text-white/50 text-sm">
            Approved questions are live for all players at once. The player keeps their own trivia
            either way.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="button"
              onClick={handleApprove}
              disabled={busy}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
            >
              {approve.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve {pickedCount} {pickedCount === 1 ? "question" : "questions"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmReject(true)}
              disabled={busy}
              className="border-red-400/40 text-red-300 hover:bg-red-500/10"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmReject}
        onOpenChange={setConfirmReject}
        title="Reject this trivia?"
        description="None of its questions are added to General Trivia. The player keeps their own trivia. A trivia is reviewed only once."
        confirmLabel="Reject"
        destructive
        pending={reject.isPending}
        onConfirm={() => reject.mutate()}
      />
    </div>
  );
}
