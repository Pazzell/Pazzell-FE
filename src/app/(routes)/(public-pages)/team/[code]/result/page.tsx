"use client";

import { useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageError } from "@/components/ui/page-error";
import { PageLoader } from "@/components/ui/page-loader";
import { ShareResultActions, TeamResultCard } from "@/components/team-game/team-result-card";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { TeamGameResultResponse } from "@/types";

/** The public, shareable result card of a finished team game: `resultUrl` points here. */
export default function TeamGameResultPage() {
  const { code } = useParams<{ code: string }>();
  const cardRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["team-game-result", code],
    queryFn: () =>
      api.get<TeamGameResultResponse>(ENDPOINTS.TEAM_GAME_RESULT(code)).then((res) => res.data.result),
    retry: false,
  });

  if (isLoading) return <PageLoader message="Loading the result..." />;
  if (error || !data) {
    return (
      <PageError
        title="This result isn't available"
        message="The game may not have finished yet, or the link is wrong."
        showRetry={false}
      />
    );
  }

  return (
    <MainLayout maxWidth="3xl">
      <div className="space-y-6 py-2">
        <TeamResultCard ref={cardRef} result={data} />
        <ShareResultActions result={data} cardRef={cardRef} />
        <div className="flex justify-center">
          <Button asChild variant="ghost" className="text-white/60 hover:text-white">
            <Link href={routes.USER.MY_QUIZZES}>Host your own team quiz</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
