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
import {
  Users,
  Share2,
  Copy,
  CheckCircle2,
  Crown,
  Trophy,
  Medal,
  Gift,
  UserPlus,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import {
  ReferralEventsResponse,
  ReferralSummaryResponse,
  GamerProfileResponse,
} from "@/types";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { PageLoader } from "@/components/ui/page-loader";

const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

const getInitials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Trophy className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-white/60">#{rank}</span>;
  }
};

export default function ReferralsPage() {
  const user = useAtomValue(userAtom);
  const [copied, setCopied] = useState(false);

  // Referral link is built purely on the frontend from the player's username.
  // No backend call needed — the backend resolves ?ref=<username> at register time.
  const referralLink =
    user?.username && typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${user.username}`
      : "";

  // Own referral stats for the current month
  const { data: userMeData, isLoading: loadingMe } = useQuery({
    queryKey: ["gamer-profile"],
    queryFn: () =>
      axios
        .get<GamerProfileResponse>(endpointUrl(ENDPOINTS.GAMER_PROFILE), {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        })
        .then((res) => res.data),
    enabled: !!user?.accessToken,
  });

  // Global leaderboard — public endpoint, no auth required
  const { data: summaryData, isLoading: loadingSummary } = useQuery({
    queryKey: ["referrals-summary", currentMonth],
    queryFn: () =>
      axios
        .get<ReferralSummaryResponse>(
          endpointUrl(`${ENDPOINTS.REFERRALS_SUMMARY}?month=${currentMonth}`)
        )
        .then((res) => res.data),
  });

  // Referral event log — public endpoint, no auth required
  const { data: eventsData } = useQuery({
    queryKey: ["referrals-events", currentMonth],
    queryFn: () =>
      axios
        .get<ReferralEventsResponse>(
          endpointUrl(`${ENDPOINTS.REFERRALS_EVENTS}?month=${currentMonth}`)
        )
        .then((res) => res.data),
  });

  const referralStats = userMeData?.profile?.analytics?.referral;
  const myReferralCount = referralStats?.successfulReferrals ?? 0;
  const myPointsEarned = referralStats?.totalPointsEarned ?? 0;
  const myRank = referralStats?.leaderboardPosition ?? null;

  const leaderboard = [...(summaryData?.summary || [])].sort(
    (a, b) => (b.successfulCount ?? 0) - (a.successfulCount ?? 0)
  );

  const events = eventsData?.events || [];

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Pazzell",
          text: "Play puzzles from top brands and earn real rewards. Sign up with my link!",
          url: referralLink,
        });
      } catch {
        // user cancelled — no action needed
      }
    } else {
      copyReferralLink();
    }
  };

  if (loadingMe && loadingSummary) {
    return <PageLoader message="Loading your referrals..." />;
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-fredoka flex items-center gap-3">
            <Gift className="h-8 w-8 text-secondary" />
            Refer & Earn
          </h1>
          <p className="text-white/70">
            Invite friends to Pazzell and earn bonus points when they complete
            their first puzzle.
          </p>
        </div>

        {/* Referral Link Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka text-xl flex items-center gap-2">
              <Share2 className="h-5 w-5 text-secondary" />
              Your Referral Link
            </CardTitle>
            <CardDescription className="text-white/70">
              Share this link with friends. You&apos;ll earn points once they
              sign up and complete their first puzzle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user?.username ? (
              <p className="text-white/50 text-sm">
                Set a username on your profile to generate your referral link.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 p-3 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <code className="text-white/80 text-sm break-all">
                    {referralLink}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={copyReferralLink}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10">
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    onClick={shareReferralLink}
                    className="bg-gradient-to-r from-secondary to-[#FF6B9D] text-white font-fredoka">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <UserPlus className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white font-fredoka">
                    {myReferralCount}
                  </p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">
                    Referrals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Zap className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white font-fredoka">
                    {myPointsEarned.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">
                    Points Earned
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 col-span-2 sm:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Crown className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white font-fredoka">
                    {myRank ? `#${myRank}` : "—"}
                  </p>
                  <p className="text-xs text-white/60 uppercase tracking-wider">
                    Your Rank
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              Top Referrers
            </CardTitle>
            <CardDescription className="text-white/70">
              Players ranked by successful referrals this month
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSummary ? (
              <div className="p-6 text-center text-white/60">
                Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/60">
                  No referrals yet. Be the first to invite a friend!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((row, index) => {
                  const rank = index + 1;
                  const isMe = row.user?._id === user?.id;
                  const fullName =
                    row.user?.firstName && row.user?.lastName
                      ? `${row.user.firstName} ${row.user.lastName}`
                      : row.user?.username || "Player";

                  return (
                    <div
                      key={row.user?._id || rank}
                      className={`flex items-center gap-3 sm:gap-4 p-4 border-b border-white/5 last:border-b-0 transition-colors ${
                        isMe
                          ? "bg-secondary/10 border-secondary/20"
                          : "hover:bg-white/5"
                      }`}>
                      <div className="flex items-center justify-center w-8 flex-shrink-0">
                        {getRankIcon(rank)}
                      </div>
                      <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {row.user?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.user.avatar}
                            alt={fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {getInitials(fullName)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-semibold truncate">
                          {row.user?.username
                            ? `@${row.user.username}`
                            : fullName}
                          {isMe && (
                            <span className="text-secondary text-xs ml-2">
                              (You)
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge className="bg-secondary/20 text-secondary border-secondary/30 border flex-shrink-0">
                        {row.successfulCount}{" "}
                        {row.successfulCount === 1 ? "referral" : "referrals"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {events.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white font-fredoka flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-secondary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {events.slice(0, 10).map((event) => {
                  const name =
                    event.referredUser?.username ||
                    (event.referredUser?.firstName
                      ? `${event.referredUser.firstName} ${
                          event.referredUser.lastName || ""
                        }`.trim()
                      : "A friend");
                  const label =
                    event.type === "first_puzzle"
                      ? `${name} completed their first puzzle`
                      : `${name} signed up using your link`;

                  return (
                    <div
                      key={event._id}
                      className="flex items-center justify-between p-3 border-b border-white/5 last:border-b-0">
                      <span className="text-white/80 text-sm">{label}</span>
                      {event.createdAt && (
                        <span className="text-white/40 text-xs whitespace-nowrap ml-3">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
