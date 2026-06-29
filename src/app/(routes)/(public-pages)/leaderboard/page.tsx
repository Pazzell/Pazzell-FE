"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Calendar } from "lucide-react";
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

// Helper function to get user initials from full name
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

const getRankBadgeColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    case 2:
      return "bg-gray-400/20 text-gray-400 border-gray-400/30";
    case 3:
      return "bg-amber-600/20 text-amber-600 border-amber-600/30";
    default:
      return "bg-secondary/20 text-secondary border-secondary/30";
  }
};

export default function LeaderboardPage() {
  const user = useAtomValue(userAtom);

  // Fetch monthly leaderboard data
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
        .then((res) => {
          return res.data;
        }),
  });

  // Calculate days until next month reset (first day of next month)
  const today = new Date();
  const firstOfNextMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    1
  );
  const daysUntilReset = Math.ceil(
    (firstOfNextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Transform leaderboard entries to include initials
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
            Check back soon to see this month's top performers!
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
          Compete with players worldwide and win monthly prizes
        </p>
        {monthLabel && (
          <p className="text-white/60 text-xs sm:text-sm mb-4 px-4">
            Month: {monthLabel} • {leaderboardResponse?.leaderboard?.totalPlayers ?? leaderboardData.length} players
          </p>
        )}

        {/* Reset Timer */}
        <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-white/10 rounded-full px-3 sm:px-4 py-2">
          <Calendar className="h-4 w-4 text-secondary" />
          <span className="text-white/80 text-xs sm:text-sm">
            Resets in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboardData.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Mobile: 1st Place First */}
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
                  {leaderboardData[0].points}p
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
                  {leaderboardData[1].points}p
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
                  {leaderboardData[2].points}p
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
          <div className="space-y-1">
            {leaderboardData.map((player) => (
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

                  {/* Name and Stats */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold truncate">
                      @{player.username}
                    </h3>
                    <p className="text-white/60 text-sm">
                      <span className="sm:hidden">
                        {player.puzzlesSolved} puzzles • {player.points} pts
                      </span>
                      <span className="hidden sm:inline">
                        {player.puzzlesSolved} puzzles solved • {player.points}{" "}
                        points
                      </span>
                    </p>
                  </div>
                </div>

                {/* Earnings and Badge */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-3">
                  <div className="text-left sm:text-right">
                    <p className="text-white font-bold text-lg font-fredoka">
                      ₦{(player.prizeAmount ?? 0).toLocaleString()}
                    </p>
                    <p className="text-white/60 text-xs">this month</p>
                  </div>

                  {player.position <= 3 && (
                    <Badge
                      className={`${getRankBadgeColor(
                        player.position
                      )} border flex-shrink-0`}>
                      <span className="sm:hidden">#{player.position}</span>
                      <span className="hidden sm:inline">
                        Top {player.position}
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rewards Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 mt-6 sm:mt-8">
        <CardHeader>
          <CardTitle className="text-white font-fredoka flex items-center gap-2 text-lg sm:text-xl">
            <Trophy className="h-5 w-5 text-secondary" />
            Monthly Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">
                1st Place
              </h3>
              <p className="text-yellow-500 font-bold text-lg sm:text-xl font-fredoka">
                ₦500,000
              </p>
              <p className="text-yellow-500/80 text-xs">Bonus</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-400/10 rounded-xl border border-gray-400/20">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">
                2nd Place
              </h3>
              <p className="text-gray-400 font-bold text-lg sm:text-xl font-fredoka">
                ₦300,000
              </p>
              <p className="text-gray-400/80 text-xs">Bonus</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-amber-600/10 rounded-xl border border-amber-600/20">
              <Medal className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">
                3rd Place
              </h3>
              <p className="text-amber-600 font-bold text-lg sm:text-xl font-fredoka">
                ₦200,000
              </p>
              <p className="text-amber-600/80 text-xs">Bonus</p>
            </div>
          </div>
          <p className="text-center text-white/60 text-xs sm:text-sm mt-4 px-4">
            Top 10 players also receive exclusive badges and early access to new
            puzzle campaigns
          </p>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
