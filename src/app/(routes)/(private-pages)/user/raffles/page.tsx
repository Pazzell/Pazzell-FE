"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import {
  AnyCampaignsResponse,
  CampaignV2Data,
  RaffleCampaignCurrentResponse,
  RaffleVerifyResponse,
  WeeklyLeaderboardResponse,
  isV2Campaign,
} from "@/types";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLoader } from "@/components/ui/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Trophy, Medal, Ticket, ShieldCheck, Loader2, Archive } from "lucide-react";
import { useAdminConfig } from "@/hooks/use-admin-config";
import { getRankRewardPercent } from "./raffles-utils";

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

function CampaignRaffleCard({ campaign }: { campaign: CampaignV2Data }) {
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const { data: raffle, isLoading } = useQuery({
    queryKey: ["raffle-campaign-current", campaign._id],
    queryFn: () =>
      axios
        .get<RaffleCampaignCurrentResponse>(
          endpointUrl(ENDPOINTS.RAFFLE_CAMPAIGN_CURRENT(campaign._id))
        )
        .then((res) => res.data),
    retry: false,
  });

  const handleVerify = async () => {
    if (!raffle?.drawId) return;
    setVerifying(true);
    try {
      const res = await axios.get<RaffleVerifyResponse>(
        endpointUrl(ENDPOINTS.RAFFLE_VERIFY(raffle.drawId))
      );
      setVerifyResult({ valid: res.data.verification.valid });
    } catch {
      setVerifyResult(null);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card
      className="bg-card/50 backdrop-blur-sm border-white/10"
      data-testid="campaign-raffle-card">
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-white font-semibold">{campaign.title}</h3>
            <p className="text-white/60 text-xs">{campaign.brandName}</p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
              raffle?.drawStatus === "drawn"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}>
            {isLoading ? "Loading..." : raffle?.drawStatus === "drawn" ? "Drawn" : "Pending"}
          </span>
        </div>
        <p className="text-white/70 text-sm">{campaign.prizeDescription}</p>

        {raffle?.drawStatus === "drawn" && raffle.winner ? (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
            <p className="text-white text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Winner:{" "}
              <span className="font-semibold">
                {raffle.winner.username
                  ? `@${raffle.winner.username}`
                  : raffle.winner.fullName ?? "Player"}
              </span>
            </p>
            {raffle.drawId && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleVerify}
                disabled={verifying}
                className="border-white/20 text-white hover:bg-white/10 text-xs">
                {verifying ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3 w-3 mr-1" />
                )}
                Verify Draw
              </Button>
            )}
            {verifyResult && (
              <p
                className={`text-xs ${
                  verifyResult.valid ? "text-green-400" : "text-red-400"
                }`}>
                {verifyResult.valid
                  ? "Verified — no tampering detected."
                  : "Verification failed."}
              </p>
            )}
          </div>
        ) : (
          <p className="text-white/50 text-xs flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5" />
            {raffle?.ticketCount ?? 0} tickets banked &bull; draws automatically every
            Monday
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function RafflesPage() {
  const user = useAtomValue(userAtom);
  const { get: getConfig } = useAdminConfig();
  const authHeaders = { headers: { Authorization: `Bearer ${user?.accessToken}` } };

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () =>
      axios
        .get<AnyCampaignsResponse>(endpointUrl(ENDPOINTS.CAMPAIGNS), authHeaders)
        .then((res) => res.data.campaigns),
    enabled: !!user?.accessToken,
  });

  const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["leaderboard", "weekly"],
    queryFn: () =>
      axios
        .get<WeeklyLeaderboardResponse>(
          endpointUrl(ENDPOINTS.WEEKLY_LEADERBOARD),
          authHeaders
        )
        .then((res) => res.data.leaderboard),
  });

  const activeV2Campaigns = (campaigns || []).filter(
    (c): c is CampaignV2Data => isV2Campaign(c) && c.status === "active"
  );

  const rankDistribution = getConfig("payout.rankDistribution");
  const playerSharePercent = getConfig("payout.playerSharePercent");
  const topWinners = (leaderboard?.entries || []).slice(0, rankDistribution.length);

  if (loadingCampaigns || loadingLeaderboard) {
    return <PageLoader message="Loading this week's results..." />;
  }

  return (
    <MainLayout maxWidth="6xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-fredoka">
          Weekly Raffle &amp; Rewards
        </h1>
        <p className="text-white/70">
          This week&apos;s top-{rankDistribution.length} cash winners and per-campaign
          product raffle draws.
        </p>
      </div>

      {/* Top cash winners */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 mb-8">
        <CardHeader>
          <CardTitle className="text-white font-fredoka flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Top {rankDistribution.length} Cash Winners
          </CardTitle>
          <p className="text-white/60 text-sm">
            Sharing {playerSharePercent}% of this week&apos;s platform revenue.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {topWinners.length === 0 ? (
            <div className="p-8 text-center text-white/60">
              No leaderboard data yet this week.
            </div>
          ) : (
            <div className="space-y-1">
              {topWinners.map((player) => {
                const rewardPercent = getRankRewardPercent(
                  player.position,
                  rankDistribution
                );
                return (
                  <div
                    key={player.userId}
                    data-testid="top-winner-row"
                    className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 flex items-center justify-center">
                        {getRankIcon(player.position)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">@{player.username}</p>
                        <p className="text-white/50 text-xs">{player.points} pts</p>
                      </div>
                    </div>
                    {rewardPercent !== null && (
                      <span className="text-secondary font-bold font-fredoka">
                        {rewardPercent}% share
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-campaign raffle draws */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white font-fredoka flex items-center gap-2">
          <Ticket className="h-5 w-5 text-secondary" />
          Per-Campaign Raffles
        </h2>
        <p className="text-white/60 text-sm">
          1 product winner drawn weekly, per campaign.
        </p>
      </div>
      {activeV2Campaigns.length === 0 ? (
        <p className="text-white/60 text-sm mb-8">No active campaigns this week.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {activeV2Campaigns.map((campaign) => (
            <CampaignRaffleCard key={campaign._id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Archive placeholder — no backend endpoint exists yet to list
          historical draws (see API_CONTRACT_WEEKLY_MIGRATION.md §6). */}
      <Card className="bg-card/30 border-dashed border-white/10">
        <CardContent className="pt-6 flex items-center gap-3 text-white/50 text-sm">
          <Archive className="h-5 w-5 flex-shrink-0" />
          Archive of past weeks is coming soon — the backend doesn&apos;t yet expose
          historical raffle draws.
        </CardContent>
      </Card>
    </MainLayout>
  );
}
