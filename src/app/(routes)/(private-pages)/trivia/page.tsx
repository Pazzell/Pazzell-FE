"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type { CampaignNextResponse, TriviaTopicsResponse } from "@/types";
import { routes } from "@/app/_utils/routes";
import Link from "next/link";
import { Brain, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { CampaignGate } from "@/components/trivia/campaign-gate";
import { filterTopics, TopicSearch } from "@/components/trivia/topic-search";
import { TriviaKindTabs } from "@/components/trivia/trivia-kind-tabs";

export default function TriviaTopicsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trivia-topics"],
    queryFn: () =>
      api.get<TriviaTopicsResponse>(ENDPOINTS.TRIVIA_TOPICS).then((res) => res.data),
  });

  // Tells a freemium player up front that a sponsored trivia is owed.
  const { data: gate } = useQuery({
    queryKey: ["campaign-next"],
    queryFn: () =>
      api.get<CampaignNextResponse>(ENDPOINTS.CAMPAIGNS_NEXT).then((res) => res.data),
    staleTime: 0,
  });

  const topics = filterTopics(data?.topics ?? [], search);

  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-8">
        <TriviaKindTabs active="general" />
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-2">
            <Brain className="h-7 w-7 text-blue-400" />
            General Trivia
          </h1>
          <p className="text-white/70">
            Pick a topic and start the quiz. Turn on Practice to have the correct option pointed out.
          </p>
        </div>

        {gate?.required && gate.campaign && <CampaignGate campaign={gate.campaign} />}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <PageError
            title="Couldn't load topics"
            message="Please check your connection and try again."
            onRetry={() => refetch()}
            withLayout={false}
          />
        )}

        {data && data.topics.length === 0 && (
          <p className="text-white/60 text-center py-16">
            No topics are available yet. Please check back soon.
          </p>
        )}

        {data && data.topics.length > 0 && <TopicSearch value={search} onChange={setSearch} />}

        {data && data.topics.length > 0 && topics.length === 0 && (
          <p className="text-white/60 text-center py-16">No topics match your search.</p>
        )}

        {topics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {topics.map((topic) => (
              <Link key={topic.id} href={routes.USER.TRIVIA_TOPIC(topic.id)}>
                <div className="rounded-xl border bg-card/50 border-white/10 hover:border-secondary/50 transition-colors h-full px-4 py-3 flex flex-col gap-1">
                  <h2 className="text-base font-bold text-white font-fredoka leading-tight line-clamp-2">
                    {topic.name}
                  </h2>
                  <span className="mt-auto text-xs text-white/50 inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {topic.cardCount} cards
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
