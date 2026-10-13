"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronRight, DownloadCloud, Layers, Library, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { ImportCardsDialog } from "@/components/admin/import-cards-dialog";
import { LoadStarterDialog } from "@/components/admin/load-starter-dialog";
import { TopicFormDialog } from "@/components/admin/topic-form-dialog";
import { filterTopics, TopicSearch } from "@/components/trivia/topic-search";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { cn } from "@/lib/utils";
import type { AdminTopicsResponse } from "@/types";

export default function AdminTopicsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingStarter, setLoadingStarter] = useState(false);
  const [search, setSearch] = useState("");

  // New cards (and maybe a new topic) are live for players at once.
  const refreshTopics = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
    queryClient.invalidateQueries({ queryKey: ["admin-topic"] });
    queryClient.invalidateQueries({ queryKey: ["trivia-topics"] });
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-topics"],
    queryFn: () =>
      api.get<AdminTopicsResponse>(ENDPOINTS.ADMIN_TRIVIA_TOPICS).then((res) => res.data.topics),
  });

  const topics = filterTopics(data ?? [], search);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka">Trivia Topics</h1>
          <p className="text-white/70">Create and manage topics and their cards</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setLoadingStarter(true)}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <Library className="h-4 w-4 mr-2" />
            Load Starter Questions
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
            onClick={() => setCreating(true)}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Topic
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <PageError
          title="Couldn't load the topics"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
          withLayout={false}
        />
      )}

      {data && data.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 space-y-3">
          <BookOpen className="h-10 w-10 text-secondary mx-auto" />
          <p className="text-white/60">No topics yet. Create the first one.</p>
        </div>
      )}

      {data && data.length > 0 && <TopicSearch value={search} onChange={setSearch} />}

      {data && data.length > 0 && topics.length === 0 && (
        <p className="text-white/60 text-center py-16">No topics match your search.</p>
      )}

      {topics.length > 0 && (
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link
                href={routes.ADMIN.TOPIC(topic.id)}
                className={cn(
                  "rounded-2xl border border-white/10 bg-card/50 hover:border-secondary/40 transition-colors p-4 flex items-center gap-4",
                  !topic.isActive && "opacity-60"
                )}
              >
                {topic.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={topic.coverImageUrl}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <span className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-6 w-6 text-blue-400/60" />
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold break-words">
                    {topic.name}
                    {!topic.isActive && (
                      <span className="text-white/50 font-normal text-sm"> · inactive</span>
                    )}
                  </p>
                  <p className="text-white/50 text-sm inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {topic.cardCount} {topic.cardCount === 1 ? "card" : "cards"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ImportCardsDialog
        open={importing}
        onOpenChange={setImporting}
        onImported={refreshTopics}
      />
      <LoadStarterDialog
        open={loadingStarter}
        onOpenChange={setLoadingStarter}
        onLoaded={refreshTopics}
      />
      <TopicFormDialog
        open={creating}
        onOpenChange={setCreating}
        topic={null}
        onSaved={(topicId) => {
          queryClient.invalidateQueries({ queryKey: ["admin-topics"] });
          // Straight on to adding cards.
          if (topicId) router.push(routes.ADMIN.TOPIC(topicId));
        }}
      />
    </div>
  );
}
