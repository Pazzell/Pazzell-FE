"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type { MatchLevelsResponse } from "@/types";
import { routes } from "@/app/_utils/routes";
import Link from "next/link";
import { Lock, CheckCircle2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";

export default function MatchLevelMapPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["match-levels"],
    queryFn: () =>
      api.get<MatchLevelsResponse>(ENDPOINTS.MATCH_LEVELS).then((res) => res.data),
  });

  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-pink-400" />
            Match
          </h1>
          <p className="text-white/70">
            Tap the artifact that matches the target. Complete every question in a level to
            unlock the next one.
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        )}

        {error && (
          <PageError
            title="Couldn't load levels"
            message="Please check your connection and try again."
            withLayout={false}
          />
        )}

        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data.levels.map((level) => {
                const content = (
                  <div
                    className={`relative rounded-2xl border p-5 h-32 flex flex-col items-center justify-center gap-2 transition-all ${
                      level.unlocked
                        ? "bg-card/50 border-white/10 hover:border-secondary/50 hover:-translate-y-1 cursor-pointer"
                        : "bg-white/5 border-white/5 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {level.passed && (
                      <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-green-400" />
                    )}
                    {!level.unlocked && (
                      <Lock className="h-6 w-6 text-white/40" />
                    )}
                    <span className="text-2xl font-bold text-white font-fredoka">
                      {level.level}
                    </span>
                    {level.name && (
                      <span className="text-xs text-white/60 text-center line-clamp-1">
                        {level.name}
                      </span>
                    )}
                    {level.activeAttemptId && level.unlocked && (
                      <span className="text-[10px] text-secondary font-medium">In progress</span>
                    )}
                  </div>
                );

                return level.unlocked ? (
                  <Link key={level.level} href={routes.USER.MATCH_LEVEL(level.level)}>
                    {content}
                  </Link>
                ) : (
                  <div key={level.level}>{content}</div>
                );
              })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
