"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Crown, Medal, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import {
  MonthlyLeaderboardResponse,
  LeaderboardEntry,
} from "@/types";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";

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

export default function LeaderboardPage() {
  const user = useAtomValue(userAtom);

  const {
    data: leaderboardResponse,
    error: leaderboardError,
    isLoading: loadingLeaderboard,
  } = useQuery<MonthlyLeaderboardResponse>({
    queryKey: ["leaderboard", "monthly"],
    queryFn: () =>
      axios
        .get<MonthlyLeaderboardResponse>(
          endpointUrl(`${ENDPOINTS.MONTHLY_LEADERBOARD}`),
          {
            headers: {
              Authorization: `Bearer ${user?.accessToken}`,
            },
          }
        )
        .then((res) => res.data),
  });

  const leaderboardData: (LeaderboardEntry & { initials?: string })[] =
    leaderboardResponse?.leaderboard?.entries?.map((entry) => ({
      ...entry,
      initials: entry.fullName ? getInitials(entry.fullName) : undefined,
    })) || [];

  const monthLabel = leaderboardResponse?.leaderboard?.monthKey || "";

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
            Check back soon to see this month&apos;s top performers!
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
          Monthly Leaderboard
        </h1>
        <p className="text-white/70 text-base sm:text-lg mb-4 sm:mb-6 px-4">
          Compete with players worldwide and top the monthly rankings
        </p>
        {monthLabel && (
          <p className="text-white/60 text-xs sm:text-sm mb-4 px-4">
            Month: {monthLabel} &bull; {leaderboardResponse?.leaderboard?.totalPlayers ?? leaderboardData.length} players
          </p>
        )}

        {/* Reset notice */}
        <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-white/10 rounded-full px-3 sm:px-4 py-2">
          <Info className="h-4 w-4 text-secondary" />
          <span className="text-white/80 text-xs sm:text-sm">
            Leaderboard resets at the end of each month
          </span>
        </div>
      </div>

      {/* Points legend */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <span className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-xs text-purple-300">
          <Trophy className="h-3 w-3" /> Puzzle Pts
        </span>
        <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 text-xs text-green-300">
          + Referral Bonus
        </span>
        <span className="inline-flex items-center gap-1.5 bg-secondary/10 border border-secondary/20 rounded-full px-3 py-1 text-xs text-secondary">
          = Total Points
        </span>
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
                  {(leaderboardData[0].totalPoints ?? leaderboardData[0].points)} pts
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
                  {(leaderboardData[1].totalPoints ?? leaderboardData[1].points)} pts
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
                  {(leaderboardData[2].totalPoints ?? leaderboardData[2].points)} pts
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
              <span className="w-20 text-right">Puzzle</span>
              <span className="w-20 text-right">Referral</span>
              <span className="w-20 text-right">Total</span>
            </div>
          </div>

          <div className="space-y-1">
            {leaderboardData.map((player) => {
              const puzzlePts = player.puzzlePoints ?? player.points;
              const referralPts = player.referralPoints ?? 0;
              const totalPts = player.totalPoints ?? player.points;

              return (
                <div
                  key={player.userId}
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
                        {player.puzzlesSolved} puzzle{player.puzzlesSolved !== 1 ? "s" : ""} solved
                      </p>
                    </div>
                  </div>

                  {/* Points breakdown */}
                  <div className="flex items-center gap-3 sm:gap-6 justify-end">
                    {/* Mobile: compact */}
                    <div className="sm:hidden flex items-center gap-2">
                      <span className="text-white/60 text-xs">{puzzlePts}+{referralPts}</span>
                      <span className="text-secondary font-bold font-fredoka">{totalPts} pts</span>
                    </div>

                    {/* Desktop: three columns — numbers only */}
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="w-20 text-right">
                        <p className="text-purple-300 font-semibold font-fredoka">{puzzlePts}</p>
                      </div>
                      <div className="w-20 text-right">
                        <p className="text-green-400 font-semibold font-fredoka">+{referralPts}</p>
                      </div>
                      <div className="w-20 text-right">
                        <p className="text-secondary font-bold text-lg font-fredoka">{totalPts}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* How points work */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 mt-6 sm:mt-8">
        <CardHeader>
          <CardTitle className="text-white font-fredoka flex items-center gap-2 text-lg sm:text-xl">
            <Trophy className="h-5 w-5 text-secondary" />
            How Points Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">
                Puzzle Points
              </h3>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>Other game types: <span className="text-purple-300 font-semibold">+1 pt</span></li>
                <li>Sliding Puzzle: <span className="text-purple-300 font-semibold">+2 pts</span></li>
                <li className="text-white/40 text-xs">(first solve per day counts)</li>
              </ul>
            </div>
            <div className="p-3 sm:p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">
                Referral Bonus Points
              </h3>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>Friend signs up with your link: <span className="text-green-400 font-semibold">+1 pt</span> (friend)</li>
                <li>Friend completes first puzzle: <span className="text-green-400 font-semibold">+3 pts</span> (you)</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-white/50 text-xs sm:text-sm mt-4 px-4">
            Total points = Puzzle points + Referral bonus &bull; Resets at the end of each month
          </p>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
