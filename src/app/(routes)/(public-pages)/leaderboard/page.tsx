"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Crown, Medal, Info, Clock, Gift, Ticket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { WeeklyLeaderboardResponse, WeeklyLeaderboardEntry } from "@/types";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { useAdminConfig } from "@/hooks/use-admin-config";
import { msUntilNextMonday, formatCountdown, formatAvgTime } from "./leaderboard-utils";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";

const getInitials = (fullName: string): string => {
  return fullName
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Trophy className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />;
    default:
      return (
        <span className="text-2xl font-bold text-muted-foreground">
          #{rank}
        </span>
      );
  }
};

function WeekCountdown() {
  const [remaining, setRemaining] = useState(() => msUntilNextMonday());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(msUntilNextMonday()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-white/10 rounded-full px-3 sm:px-4 py-2">
      <Clock className="h-4 w-4 text-secondary" />
      <span className="text-white/80 text-xs sm:text-sm" data-testid="week-countdown">
        Resets in {formatCountdown(remaining)}
      </span>
    </div>
  );
}

export default function LeaderboardPage() {
  const user = useAtomValue(userAtom);
  const { get: getConfig } = useAdminConfig();

  const {
    data: leaderboardResponse,
    error: leaderboardError,
    isLoading: loadingLeaderboard,
  } = useQuery<WeeklyLeaderboardResponse>({
    queryKey: ["leaderboard", "weekly"],
    queryFn: () =>
      axios
        .get<WeeklyLeaderboardResponse>(
          endpointUrl(`${ENDPOINTS.WEEKLY_LEADERBOARD}`),
          {
            headers: {
              Authorization: `Bearer ${user?.accessToken}`,
            },
          }
        )
        .then((res) => res.data),
  });

  const leaderboardData: (WeeklyLeaderboardEntry & { initials?: string })[] =
    leaderboardResponse?.leaderboard?.entries?.map((entry) => ({
      ...entry,
      initials: entry.fullName ? getInitials(entry.fullName) : undefined,
    })) || [];

  const weekLabel = leaderboardResponse?.leaderboard?.weekKey || "";

  const playerSharePercent = getConfig("payout.playerSharePercent");
  const rankDistribution = getConfig("payout.rankDistribution");
  const topRankCount = rankDistribution.length;

  if (loadingLeaderboard || !leaderboardResponse) {
    return <PageLoader message="Loading leaderboard..." />;
  }

  if (leaderboardError) {
    return (
      <PageError
        title="Failed to Load Leaderboard"
        message="Unable to load leaderboard data. Please check your connection and try again."
      />
    );
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2 font-fredoka">
            No Leaderboard Data
          </h3>
          <p className="text-white/60">
            Check back soon to see this week&apos;s top performers!
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header Section */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-fredoka">
          Weekly Leaderboard
        </h1>
        <p className="text-white/70 text-base sm:text-lg mb-4 sm:mb-6 px-4">
          Compete with players worldwide and top the weekly rankings
        </p>
        {weekLabel && (
          <p className="text-white/60 text-xs sm:text-sm mb-4 px-4">
            Week: {weekLabel} &bull;{" "}
            {leaderboardResponse?.leaderboard?.totalPlayers ?? leaderboardData.length}{" "}
            players
          </p>
        )}

        <WeekCountdown />
      </div>

      {/* Tiebreaker explainer */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-start gap-2 bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-3 max-w-xl">
          <Info className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
          <p className="text-white/70 text-xs sm:text-sm">
            Tiebreaker: when two players have equal points, the one with the{" "}
            <span className="text-white font-medium">
              faster average first-completion time
            </span>{" "}
            ranks higher.
          </p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboardData.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* 1st Place */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 sm:order-2 sm:h-52 h-44 flex flex-col justify-between">
            <CardContent className="p-4 text-center flex flex-col justify-between h-full">
              <div className="flex justify-center mb-2">{getRankIcon(1)}</div>
              <div>
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  {leaderboardData[0].avatar ? (
                    <img
                      src={leaderboardData[0].avatar}
                      alt={leaderboardData[0].fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {leaderboardData[0].initials}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold text-base mb-1 truncate px-1">
                  {leaderboardData[0].fullName}
                </h3>
                <p className="text-secondary font-bold text-xl font-fredoka">
                  {leaderboardData[0].points} pts
                </p>
                <p className="text-white/50 text-xs mt-1">
                  avg {formatAvgTime(leaderboardData[0].avgCompletionTimeSec)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2nd Place */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 sm:order-1 sm:h-44 h-40 flex flex-col justify-between">
            <CardContent className="p-3 text-center flex flex-col justify-between h-full">
              <div className="flex justify-center mb-2">{getRankIcon(2)}</div>
              <div>
                <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  {leaderboardData[1].avatar ? (
                    <img
                      src={leaderboardData[1].avatar}
                      alt={leaderboardData[1].fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {leaderboardData[1].initials}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 truncate px-1">
                  {leaderboardData[1].fullName}
                </h3>
                <p className="text-secondary font-bold text-lg font-fredoka">
                  {leaderboardData[1].points} pts
                </p>
                <p className="text-white/50 text-xs mt-1">
                  avg {formatAvgTime(leaderboardData[1].avgCompletionTimeSec)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 sm:order-3 sm:h-40 h-36 flex flex-col justify-between">
            <CardContent className="p-3 text-center flex flex-col justify-between h-full">
              <div className="flex justify-center mb-2">{getRankIcon(3)}</div>
              <div>
                <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  {leaderboardData[2].avatar ? (
                    <img
                      src={leaderboardData[2].avatar}
                      alt={leaderboardData[2].fullName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {leaderboardData[2].initials}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1 truncate px-1">
                  {leaderboardData[2].fullName}
                </h3>
                <p className="text-secondary font-bold text-lg font-fredoka">
                  {leaderboardData[2].points} pts
                </p>
                <p className="text-white/50 text-xs mt-1">
                  avg {formatAvgTime(leaderboardData[2].avgCompletionTimeSec)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-fredoka">
            Top {leaderboardData.length} Player
            {leaderboardData.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[auto_1fr_auto] gap-4 px-4 pb-2 border-b border-white/5">
            <div className="w-8" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Player</span>
            <div className="flex gap-6 text-white/40 text-xs uppercase tracking-wider">
              <span className="w-24 text-right">Avg Time</span>
              <span className="w-20 text-right">Points</span>
            </div>
          </div>

          <div className="space-y-1">
            {leaderboardData.map((player) => (
              <div
                key={player.userId}
                data-testid="leaderboard-row"
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    {player.position <= 3 ? (
                      getRankIcon(player.position)
                    ) : (
                      <span className="text-lg font-bold text-white/60">
                        #{player.position}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold">
                        {player.initials}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold truncate">
                      @{player.username}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {player.puzzlesSolved} campaign
                      {player.puzzlesSolved !== 1 ? "s" : ""} completed
                    </p>
                  </div>
                </div>

                {/* Points / avg time */}
                <div className="flex items-center gap-3 sm:gap-6 justify-end">
                  <div className="sm:hidden flex items-center gap-2">
                    <span className="text-white/60 text-xs">
                      avg {formatAvgTime(player.avgCompletionTimeSec)}
                    </span>
                    <span className="text-secondary font-bold font-fredoka">
                      {player.points} pts
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-6">
                    <div className="w-24 text-right">
                      <p className="text-white/70 font-mono">
                        {formatAvgTime(player.avgCompletionTimeSec)}
                      </p>
                    </div>
                    <div className="w-20 text-right">
                      <p className="text-secondary font-bold text-lg font-fredoka">
                        {player.points}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reward structure */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 mt-6 sm:mt-8">
        <CardHeader>
          <CardTitle className="text-white font-fredoka flex items-center gap-2 text-lg sm:text-xl">
            <Gift className="h-5 w-5 text-secondary" />
            How Rewards Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <h3 className="text-white font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-purple-300" />
                Cash Pool
              </h3>
              <p className="text-white/70 text-sm">
                The top {topRankCount} players each week share{" "}
                <span className="text-purple-300 font-semibold">
                  {playerSharePercent}%
                </span>{" "}
                of Pazzell&apos;s weekly revenue.
              </p>
            </div>
            <div className="p-3 sm:p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <h3 className="text-white font-semibold mb-2 text-sm sm:text-base flex items-center gap-2">
                <Ticket className="h-4 w-4 text-green-400" />
                Per-Campaign Raffles
              </h3>
              <p className="text-white/70 text-sm">
                Every campaign also runs its own weekly raffle draw with{" "}
                <span className="text-green-400 font-semibold">1 product winner</span>.
              </p>
            </div>
          </div>
          <p className="text-center text-white/50 text-xs sm:text-sm mt-4 px-4">
            Points reset every week &bull; earn 7 points per campaign completed.
          </p>
          {user && (
            <div className="text-center mt-4">
              <Link
                href={routes.USER.RAFFLES}
                className="inline-flex items-center gap-2 text-secondary text-sm font-medium hover:underline">
                <Ticket className="h-4 w-4" />
                View this week&apos;s raffle results
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
