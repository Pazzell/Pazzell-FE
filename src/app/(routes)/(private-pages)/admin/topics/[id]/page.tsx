"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, DownloadCloud, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardManager } from "@/components/cards/card-manager";
import { ImportCardsDialog } from "@/components/admin/import-cards-dialog";
import { TopicFormDialog } from "@/components/admin/topic-form-dialog";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { AdminTriviaTopic, TriviaCard } from "@/types";

interface AdminTopicDetail {
  topic: AdminTriviaTopic;
  cards?: TriviaCard[];
  stats?: Record<string, unknown>;
}

/** "averageScorePercent" → "Average score percent" */
const humanize = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

export default function AdminTopicPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const topicKey = ["admin-topic", id];
  const { data, isLoading, error } = useQuery({
    queryKey: topicKey,
    queryFn: () =>
      api.get<AdminTopicDetail>(ENDPOINTS.ADMIN_TRIVIA_TOPIC(id)).then((res) => res.data),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: topicKey });
    queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
    queryClient.invalidateQueries({ queryKey: ["trivia-topics"] });
  };

  const remove = useMutation({
    mutationFn: () => api.delete(ENDPOINTS.ADMIN_TRIVIA_TOPIC(id)),
    onSuccess: () => {
      toast.success("Topic deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
      queryClient.invalidateQueries({ queryKey: ["trivia-topics"] });
      router.replace(routes.ADMIN.TOPICS);
    },
    onError: (err) => {
      setConfirmDelete(false);
      toast.error(getApiError(err)?.message || "Couldn't delete the topic. Please try again.");
    },
  });

  if (isLoading) {
    return <PageLoader message="Loading topic..." withLayout={false} />;
  }

  if (error || !data) {
    return (
      <PageError
        title="Topic not found"
        message="This topic does not exist."
        onRetry={() => router.push(routes.ADMIN.TOPICS)}
        withLayout={false}
      />
    );
  }

  const { topic } = data;
  const cards = data.cards ?? [];
  const stats = Object.entries(data.stats ?? {}).filter(
    ([, value]) => typeof value === "number" || typeof value === "string"
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href={routes.ADMIN.TOPICS}
        className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Trivia Topics
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          {topic.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={topic.coverImageUrl}
              alt=""
              className="h-20 w-20 rounded-2xl object-cover shrink-0"
            />
          )}
          <div className="space-y-1 min-w-0">
            <h1 className="text-3xl font-bold text-white font-fredoka break-words">{topic.name}</h1>
            <p className="text-sm">
              {topic.isActive ? (
                <span className="text-green-300">Active</span>
              ) : (
                <span className="text-white/50">Inactive — hidden from players</span>
              )}
            </p>
            {topic.description && <p className="text-white/70">{topic.description}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            asChild
            variant="outline"
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <Link href={routes.ADMIN.TOPIC_GENERATE(id)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Cards from a Document
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setImporting(true)}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <DownloadCloud className="h-4 w-4 mr-2" />
            Import Image Cards
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Topic
          </Button>
        </div>
      </div>

      {stats.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/10 bg-card/50 p-5">
              <p className="text-white/60 text-sm">{humanize(key)}</p>
              <p className="text-2xl font-bold text-white font-fredoka">
                {typeof value === "number" ? Math.round(value * 10) / 10 : String(value)}
              </p>
            </div>
          ))}
        </section>
      )}

      <CardManager
        cards={cards}
        onChanged={refresh}
        endpoints={{
          create: ENDPOINTS.ADMIN_TRIVIA_TOPIC_CARDS(id),
          bulk: ENDPOINTS.ADMIN_TRIVIA_TOPIC_CARDS_BULK(id),
          card: (cardId) => ENDPOINTS.ADMIN_TRIVIA_TOPIC_CARD(id, cardId),
        }}
      />

      <div className="pt-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={() => setConfirmDelete(true)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete topic
        </Button>
      </div>

      <ImportCardsDialog
        open={importing}
        onOpenChange={setImporting}
        topic={{ id: topic.id, name: topic.name }}
        onImported={refresh}
      />
      <TopicFormDialog open={editing} onOpenChange={setEditing} topic={topic} onSaved={refresh} />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${topic.name}"?`}
        description={`The topic and its ${cards.length} ${cards.length === 1 ? "card" : "cards"} are removed for every player. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
