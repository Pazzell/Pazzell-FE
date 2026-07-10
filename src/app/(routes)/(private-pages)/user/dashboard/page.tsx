"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Clock,
  CheckCircle2,
  Users,
  Share2,
  Copy,
  ExternalLink,
  Crown,
  Medal,
  Award,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { useQuery } from "@tanstack/react-query";
import {
  GamerProfileData,
  AnyCampaignsResponse,
  AnyCampaign,
  isV2Campaign,
  WeeklyLeaderboardResponse,
} from "@/types";
import axios from "axios";
import { endpointUrl, formatPuzzleType } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import Image from "next/image";
import { EligibilityProgress } from "@/components/raffle/EligibilityProgress";

// // Mock user stats data
// const userStats = {
//   puzzlesSolved: 24,
//   totalPoints: 1850,
//   totalTime: 145, // minutes
//   totalMoves: 892,
//   attempts: 31,
//   successRate: 77.4,
//   totalEarnings: 125.50
// }

// Helper function to get puzzle route
const getGameRoute = (gameType: string, campaignId: string): string => {
  const routeMap: { [key: string]: string } = {
    sliding_puzzle: `${routes.PUZZLE.SLIDING_PUZZLE}?campaign=${campaignId}`,
    word_hunt: `${routes.PUZZLE.WORD_HUNT}?campaign=${campaignId}`,
    card_matching: `${routes.PUZZLE.CARD_MATCHING}?campaign=${campaignId}`,
    spot_the_difference: `${routes.PUZZLE.SPOT_THE_DIFFERENCE}?campaign=${campaignId}`,
  };
  return routeMap[gameType] || `/puzzle/${gameType}?campaign=${campaignId}`;
};

const getCampaignPlayHref = (campaign: AnyCampaign): string =>
  isV2Campaign(campaign)
    ? routes.USER.CAMPAIGN_PLAY(campaign._id)
    : getGameRoute(campaign.gameType, campaign._id);

// Helper function to get initials from full name
const getInitials = (fullName: string): string => {
  return fullName
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
};

export default function UserDashboardPage() {
  const [referralCopied, setReferralCopied] = useState(false);
  const user = useAtomValue(userAtom);
  console.log("userData", user);
  const referralLink =
    user?.username && typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${user.username}`
      : "";

  const {
    data: profiletData,
    error: profileError,
    isLoading: loadingProfile,
  } = useQuery<GamerProfileData>({
    queryKey: ["profile"],
    queryFn: () =>
      axios
        .get(endpointUrl(`${ENDPOINTS.GAMER_PROFILE}`), {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        })
        .then((res) => {
          return res.data.profile;
        }),
  });

  const {
    data: campaigns,
    error: campaignError,
    isLoading: loadingCampaigns,
  } = useQuery<AnyCampaign[]>({
    queryKey: ["campaigns"],
    queryFn: () =>
      axios
        .get<AnyCampaignsResponse>(endpointUrl(`${ENDPOINTS.CAMPAIGNS}`), {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        })
        .then((res) => {
          return res.data.campaigns;
        }),
  });

  const {
    data: leaderboard,
    error: leaderboardError,
    isLoading: loadingLeaderboard,
  } = useQuery<WeeklyLeaderboardResponse["leaderboard"]>({
    queryKey: ["leaderboard"],
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
        .then((res) => {
          return res.data.leaderboard;
        }),
  });


  const userStats = profiletData?.analytics?.lifetime;
  const weeklyUserStats = profiletData?.analytics?.weekly;

  // Weekly points come directly from profile.points (computed live server-side,
  // same source as the leaderboard — guaranteed to match).
  const weeklyPoints = profiletData?.points?.totalPoints ?? 0;
  const weeklyEarnings = weeklyPoints / 20;

  const currentUser = {
    name: "You",
    points: weeklyUserStats?.totalPoints || 0,
    rank: weeklyUserStats?.leaderboardPosition || null,
  };

  const formatTime = (milliseconds: number): string => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  // Helper function to check if campaign is not expired
  const isNotExpired = (campaign: AnyCampaign) => {
    const now = new Date();
    const endDate = new Date(campaign.endDate);
    return endDate > now;
  };

  // Get featured campaigns (show all premium campaigns that are not expired)
  const premiumCampaigns =
    campaigns?.filter(
      (campaign) =>
        campaign.packageName?.toLowerCase() === "premium" &&
        isNotExpired(campaign) &&
        campaign.paymentStatus === "paid"
    ) || [];

  const basicCampaigns =
    campaigns?.filter(
      (campaign) =>
        campaign.packageName?.toLowerCase() === "basic" &&
        isNotExpired(campaign) &&
        campaign.paymentStatus === "paid"
    ) || [];

  const featuredCampaigns =
    premiumCampaigns.length > 0 ? premiumCampaigns : basicCampaigns.slice(0, 6); // Show max 6 basic if no premium

  const StatsCardSkeleton = () => (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout maxWidth="6xl">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka">
            Welcome back!
          </h1>
          <p className="text-white/70">
            Track your lifetime progress and discover new puzzle challenges
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingProfile ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-fredoka">
                        {userStats?.puzzlesSolved || 0}
                      </p>
                      <p className="text-xs text-white/60 uppercase tracking-wider">
                        Solved
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <Trophy className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-fredoka">
                        {weeklyPoints}
                      </p>
                      <p className="text-xs text-white/60 uppercase tracking-wider">
                        Points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-fredoka">
                        {userStats?.totalTime
                          ? formatTime(userStats.totalTime)
                          : "0m"}
                      </p>
                      <p className="text-xs text-white/60 uppercase tracking-wider">
                        Time
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white font-fredoka">
                        ${weeklyEarnings.toFixed(2)}
                      </p>
                      <p className="text-xs text-white/60 uppercase tracking-wider">
                        Earned
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        </div>

        {/* Raffle Eligibility */}
        <EligibilityProgress />

        {/* Featured Campaigns */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            {/* Mobile: Stacked layout */}
            <div className="flex flex-col space-y-4 sm:hidden">
              <div>
                <CardTitle className="text-white font-fredoka text-xl">
                  Featured Campaigns
                </CardTitle>
                <CardDescription className="text-white/70 text-sm mt-1">
                  Exciting puzzle challenges from top brands
                </CardDescription>
              </div>
              <Link href={routes.CAMPAIGNS} className="self-start">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white/70 hover:bg-white/90">
                  View All
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Desktop: Side-by-side layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-fredoka text-2xl">
                  Featured Campaigns
                </CardTitle>
                <CardDescription className="text-white/70">
                  Exciting puzzle challenges from top brands
                </CardDescription>
              </div>
              <Link href={routes.CAMPAIGNS}>
                <Button
                  variant="outline"
                  className="border-white/20 text-white/70 hover:bg-white/90">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCampaigns ? (
              <div className="hidden md:block">
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex-none w-80">
                      <Skeleton className="w-full h-32 rounded-lg mb-3" />
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Desktop: Horizontal scrolling layout */}
                <div className="hidden md:block">
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                    {featuredCampaigns.length > 0 ? (
                      featuredCampaigns.map((campaign) => (
                        <Link
                          key={campaign._id}
                          href={getCampaignPlayHref(campaign)}
                          className="group cursor-pointer flex-none w-80 snap-start">
                          <div className="relative overflow-hidden rounded-lg mb-3">
                            <Image
                              src={
                                campaign.puzzleImageUrl ||
                                "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1000"
                              }
                              alt={campaign.title}
                              width={400}
                              height={200}
                              unoptimized
                              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 right-3 flex gap-2">
                              {campaign.packageName?.toLowerCase() ===
                              "premium" ? (
                                <Badge className="bg-yellow-500/90 text-black border-0 text-xs backdrop-blur-sm font-semibold">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Premium
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-500/90 text-white border-0 text-xs backdrop-blur-sm font-semibold">
                                  Basic
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold mb-1 group-hover:text-secondary transition-colors">
                              {campaign.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60 text-sm">
                                {campaign.brandName}
                              </span>
                              {!isV2Campaign(campaign) && (
                                <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                                  {formatPuzzleType(campaign.gameType)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="w-full text-center py-12">
                        <p className="text-white/70 text-lg">
                          No campaigns available
                        </p>
                        <p className="text-white/50 text-sm mt-2">
                          Check back soon for new exciting campaigns!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Mobile: Horizontal scroll */}
            {loadingCampaigns ? (
              <div className="md:hidden">
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex-none w-64">
                      <Skeleton className="w-full h-32 rounded-lg mb-3" />
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="md:hidden">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                  {featuredCampaigns.length > 0 ? (
                    featuredCampaigns.map((campaign) => (
                      <Link
                        key={campaign._id}
                        href={getCampaignPlayHref(campaign)}
                        className="group cursor-pointer flex-none w-64 snap-start">
                        <div className="relative overflow-hidden rounded-lg mb-3">
                          <Image
                            src={
                              campaign.puzzleImageUrl ||
                              "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1000"
                            }
                            alt={campaign.title}
                            width={400}
                            height={200}
                            unoptimized
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3 flex gap-2">
                            {campaign.packageName?.toLowerCase() ===
                            "premium" ? (
                              <Badge className="bg-yellow-500/90 text-black border-0 text-xs backdrop-blur-sm font-semibold">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500/90 text-white border-0 text-xs backdrop-blur-sm font-semibold">
                                Basic
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-white font-semibold mb-1 group-hover:text-secondary transition-colors">
                            {campaign.title}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-white/60 text-sm">
                              {campaign.brandName}
                            </span>
                            {!isV2Campaign(campaign) && (
                              <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                                {formatPuzzleType(campaign.gameType)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-12 w-full">
                      <p className="text-white/70 text-lg">
                        No campaigns available
                      </p>
                      <p className="text-white/50 text-sm mt-2">
                        Check back soon for new exciting campaigns!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1">
          {/* Leaderboard Preview */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white font-fredoka text-xl flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    Leaderboard
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Top performers this week
                  </CardDescription>
                </div>
                <Link href={routes.LEADERBOARD}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/70 hover:bg-white/90">
                    View All
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingLeaderboard ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))
                ) : leaderboard?.entries && leaderboard.entries.length > 0 ? (
                  leaderboard.entries.slice(0, 3).map((player, index) => (
                    <div
                      key={player.userId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative">
                          {index === 0 && (
                            <Crown className="h-4 w-4 text-yellow-400 absolute -top-2 -right-1" />
                          )}
                          {index === 1 && (
                            <Medal className="h-4 w-4 text-gray-300 absolute -top-2 -right-1" />
                          )}
                          {index === 2 && (
                            <Award className="h-4 w-4 text-amber-600 absolute -top-2 -right-1" />
                          )}
                          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden">
                            {player.avatar ? (
                              <img
                                src={player.avatar}
                                alt={player.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-secondary font-semibold text-sm">
                                {getInitials(player.fullName)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            @{player.username}
                          </p>
                          <p className="text-white/60 text-sm">
                            {(player.points ?? 0).toLocaleString()} points
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-secondary font-semibold font-fredoka">
                          {(player.points ?? 0).toLocaleString()} pts
                        </p>
                        <p className="text-white/60 text-sm">
                          #{player.position}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60">
                      No leaderboard data available
                    </p>
                    <p className="text-white/50 text-sm mt-2">
                      Be the first to complete a puzzle!
                    </p>
                  </div>
                )}

                {/* Current User Position */}
                <div className="border-t border-white/10 pt-4">
                  {currentUser.rank ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center overflow-hidden">
                          {profiletData?.avatar ? (
                            <img
                              src={profiletData.avatar}
                              alt={profiletData.username || "Your avatar"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-secondary font-semibold text-sm">
                              {profiletData?.firstName && profiletData?.lastName
                                ? getInitials(
                                    `${profiletData.firstName} ${profiletData.lastName}`
                                  )
                                : "You"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {currentUser.name}
                          </p>
                          <p className="text-white/60 text-sm">
                            {currentUser.points.toLocaleString()} points
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-secondary font-semibold font-fredoka">
                          {currentUser.points.toLocaleString()} pts
                        </p>
                        <p className="text-white/60 text-sm">
                          #{currentUser.rank}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                          {profiletData?.avatar ? (
                            <img
                              src={profiletData.avatar}
                              alt={profiletData.username || "Your avatar"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white/60 font-semibold text-sm">
                              {profiletData?.firstName && profiletData?.lastName
                                ? getInitials(
                                    `${profiletData.firstName} ${profiletData.lastName}`
                                  )
                                : "You"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {currentUser.name}
                          </p>
                          <p className="text-white/60 text-sm">
                            No games played yet
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 font-semibold">0 pts</p>
                        <p className="text-white/60 text-sm">Unranked</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Section */}
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white font-fredoka text-xl flex items-center gap-2">
                    <Users className="h-5 w-5 text-secondary" />
                    Refer Friends
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Invite friends and earn bonus points for each successful referral
                  </CardDescription>
                </div>
                <Link href={routes.USER.REFERRALS}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/70 hover:bg-white/90">
                    Leaderboard
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Earn Bonus Points</h4>
                  <p className="text-white/70 text-sm mb-3">
                    Earn +5 points once your friend reaches 21 lifetime points (about 3
                    campaigns completed).
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-white/5 rounded border border-white/10 overflow-hidden">
                      <code className="text-white/80 text-sm break-all">
                        {referralLink || "Loading your referral link..."}
                      </code>
                    </div>
                    <Button
                      onClick={copyReferralLink}
                      disabled={!referralLink}
                      size="sm"
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    >
                      {referralCopied ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {referralCopied && (
                    <p className="text-green-400 text-xs mt-2">Link copied to clipboard!</p>
                  )}
                </div>

                <Button
                  onClick={() => {
                    if (navigator.share && referralLink) {
                      navigator
                        .share({
                          title: "Join me on Pazzell",
                          text: "Play puzzles from top brands and earn real rewards. Sign up with my link!",
                          url: referralLink,
                        })
                        .catch(() => {});
                    } else {
                      copyReferralLink();
                    }
                  }}
                  disabled={!referralLink}
                  className="w-full bg-gradient-to-r from-secondary to-[#FF6B9D] text-white font-fredoka">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
