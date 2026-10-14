"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Layers, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { AiReviewBadge } from "@/components/trivia/ai-review-badge";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { cn } from "@/lib/utils";
import type { AdminAiTriviasResponse } from "@/types";

const FILTERS = [
  { key: "pending", label: "Waiting" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function AdminAiTriviaPage() {
  const [filter, setFilter] = useState<Filter>("pending");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-ai-trivias", filter],
    queryFn: () =>
      api
        .get<AdminAiTriviasResponse>(ENDPOINTS.ADMIN_AI_TRIVIAS(filter))
        .then((res) => res.data.trivias),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">AI Trivia Review</h1>
        <p className="text-white/70">
          Trivia written by AI for Pro players. Approve one to add its questions to General Trivia.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Review status">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === key
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-white/15 text-white/70 hover:text-white hover:border-white/40"
            )}
          >
            {label}
          </button>
        ))}
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
          title="Couldn't load the trivias"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
          withLayout={false}
        />
      )}

      {data && data.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 space-y-3">
          <Sparkles className="h-10 w-10 text-secondary mx-auto" />
          <p className="text-white/60">
            {filter === "pending" ? "Nothing is waiting for review." : "Nothing here yet."}
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((trivia) => (
            <li key={trivia.id}>
              <Link
                href={routes.ADMIN.AI_TRIVIA_REVIEW(trivia.id)}
                className="rounded-2xl border border-white/10 bg-card/50 hover:border-secondary/40 transition-colors p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold break-words">{trivia.title}</p>
                    <AiReviewBadge status={trivia.reviewStatus} audience="admin" />
                  </div>
                  <p className="text-white/50 text-sm inline-flex items-center gap-1 flex-wrap">
                    <Layers className="h-3.5 w-3.5" />
                    {trivia.cardCount} {trivia.cardCount === 1 ? "card" : "cards"}
                    {trivia.topic.name && <> · {trivia.topic.name}</>}
                    {trivia.owner.name && <> · by {trivia.owner.name}</>}
                    <> · {formatDate(trivia.createdAt)}</>
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/40 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
