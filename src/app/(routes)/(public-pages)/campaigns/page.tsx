"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Clock,
  Search,
  Filter,
  Gamepad2,
  Grid3X3,
  Search as SearchIcon,
  Hammer,
  Copy,
  Trophy,
  ExternalLink,
  Crown,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { formatPuzzleType } from "@/app/_utils/helper";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { AnyCampaignsResponse, AnyCampaign, isV2Campaign } from "@/types";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { routes } from "@/app/_utils/routes";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { EligibilityProgress } from "@/components/raffle/EligibilityProgress";

const getGameRoute = (gameType: string, campaignId: string): string => {
  const routeMap: { [key: string]: string } = {
    sliding_puzzle: `${routes.PUZZLE.SLIDING_PUZZLE}?campaign=${campaignId}`,
    word_hunt: `${routes.PUZZLE.WORD_HUNT}?campaign=${campaignId}`,
    card_matching: `${routes.PUZZLE.CARD_MATCHING}?campaign=${campaignId}`,
    spot_the_difference: `${routes.PUZZLE.SPOT_THE_DIFFERENCE}?campaign=${campaignId}`,
  };
  return routeMap[gameType] || `/puzzle/${gameType}?campaign=${campaignId}`;
};

const getGameIcon = (type: string) => {
  switch (type) {
    case "spot_the_difference":
      return <SearchIcon className="w-4 h-4" />;
    case "word_hunt":
      return <SearchIcon className="w-4 h-4" />;
    case "sliding_puzzle":
      return <Grid3X3 className="w-4 h-4" />;
    case "card_matching":
      return <Copy className="w-4 h-4" />;
    default:
      return <Gamepad2 className="w-4 h-4" />;
  }
};

const getTimeLeft = (endDate: string | undefined) => {
  if (!endDate) return "Unlimited Time";
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  const diff = end - now;

  if (diff < 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1000";

const CampaignCard = ({ campaign }: { campaign: AnyCampaign }) => {
  const isV2 = isV2Campaign(campaign);
  const isPremium = campaign.packageName === "premium";
  const timeLeft = getTimeLeft(campaign.endDate);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(campaign.puzzleImageUrl || FALLBACK_IMG);

  const playHref = isV2
    ? routes.USER.CAMPAIGN_PLAY(campaign._id)
    : getGameRoute(campaign.gameType, campaign._id);

  return (
    <div
      className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl bg-card/50 backdrop-blur-sm border border-white/10 ${
        isPremium ? "border-yellow-500/50 shadow-yellow-500/20" : ""
      }`}>
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-0 right-0 z-20 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
          <Crown className="w-3 h-3" />
          <span>PREMIUM</span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative h-52 overflow-hidden bg-white/5">
        {/* Loading Skeleton */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-white/10 animate-pulse z-10" />
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={campaign.title}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
            isImageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsImageLoaded(true)}
          onError={() => {
            setImgSrc(FALLBACK_IMG);
            setIsImageLoaded(true);
          }}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-80" />

        {/* Game Type Badge (On Image) — legacy only; v2 cards deliberately
            hide game types per the weekly-system spec. */}
        {!isV2 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-xs font-medium z-20">
            {getGameIcon(campaign.gameType)}
            <span>{formatPuzzleType(campaign.gameType)}</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              {campaign.brandName}
            </span>
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                timeLeft === "Ended" ? "text-red-400" : "text-green-500"
              }`}>
              <Clock className="w-3 h-3" />
              {timeLeft}
            </div>
          </div>

          <h3 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-secondary transition-colors font-fredoka">
            {campaign.title}
          </h3>

          {isV2 ? (
            <div className="mb-4">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                What you stand to win
              </p>
              <p
                className="text-sm text-white/80 overflow-hidden text-ellipsis"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: "1.4em",
                  maxHeight: "2.8em",
                }}>
                {campaign.prizeDescription}
              </p>
              <p className="text-white/40 text-[11px] mt-1 flex items-center gap-1">
                <Ticket className="w-3 h-3" />1 winner drawn weekly
              </p>
            </div>
          ) : (
            <p
              className="text-sm text-white/70 mb-4 overflow-hidden text-ellipsis"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: "1.4em",
                maxHeight: "2.8em",
              }}>
              {campaign.description}
            </p>
          )}
        </div>

        {/* Action Area */}
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
          <Link href={playHref} className="flex-1">
            <Button className="w-full bg-[#ffffff] hover:bg-secondary/80 group-hover:bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors font-fredoka">
              <Play className="w-4 h-4 fill-current" />
              Play Now
            </Button>
          </Link>

          {campaign.campaignUrl && (
            <a
              href={campaign.campaignUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 p-2.5 text-white/60 hover:text-secondary bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              title="Visit Campaign">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CampaignsPage() {
  const user = useAtomValue(userAtom);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  console.log(user);
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
        .then((res) => res.data.campaigns.filter((c) => c.status === "active")),
  });

  // Helper function to check if campaign is not expired
  const isNotExpired = (campaign: AnyCampaign) => {
    const now = new Date();
    const endDate = new Date(campaign.endDate);
    return endDate > now;
  };

  // Filter Logic — game-type filters only apply to legacy campaigns; v2
  // campaigns (no single gameType) always match unless a search term excludes them.
  const filteredCampaigns = useMemo(() => {
    const allCampaigns = campaigns || [];
    return allCampaigns.filter((campaign) => {
      const matchesSearch =
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.brandName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        selectedFilter === "all" ||
        (!isV2Campaign(campaign) && campaign.gameType === selectedFilter);
      const isActive = isNotExpired(campaign);
      const isPaid = campaign.paymentStatus === "paid";

      return matchesSearch && matchesFilter && isActive && isPaid;
    });
  }, [campaigns, searchTerm, selectedFilter]);

  // Extract unique game types for the filter menu (legacy campaigns only,
  // non-expired) — v2 campaigns never show a game-type filter chip.
  const gameTypes = useMemo(() => {
    const activeLegacyCampaigns = campaigns
      ? campaigns.filter(
          (campaign): campaign is Exclude<AnyCampaign, { schemaVersion: 2 }> =>
            !isV2Campaign(campaign) &&
            isNotExpired(campaign) &&
            campaign.paymentStatus === "paid"
        )
      : [];
    const types =
      activeLegacyCampaigns.length > 0
        ? ["all", ...new Set(activeLegacyCampaigns.map((c) => c.gameType))]
        : ["all"];
    return types;
  }, [campaigns]);

  if (loadingCampaigns) {
    return <PageLoader message="Loading campaigns..." />;
  }

  if (campaignError) {
    return (
      <PageError
        title="Failed to Load Campaigns"
        message="Unable to fetch campaigns. Please check your connection and try again."
      />
    );
  }

  return (
    <MainLayout>
      {/* Hero / Filter Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 font-fredoka">
              Active Campaigns
            </h1>
            <p className="text-white/70">
              Play puzzles, compete for high scores, and win rewards from top
              brands.
            </p>
          </div>

          {user && <EligibilityProgress />}

          {/* Search Bar and Filters Row */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            {/* Search Bar */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-white/60 focus:outline-none focus:border-secondary focus:bg-white/10 transition-all duration-200"
                placeholder="Search campaigns or brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {gameTypes.map((type) => (
                <Button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  variant={selectedFilter === type ? "default" : "outline"}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedFilter === type
                      ? "bg-secondary text-secondary-foreground shadow-lg"
                      : "bg-transparent text-white border-white/20 hover:bg-white/90"
                  }`}>
                  {type === "all" ? (
                    <Filter className="w-4 h-4" />
                  ) : (
                    getGameIcon(type)
                  )}
                  {type === "all" ? "All Games" : formatPuzzleType(type)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Content */}
        {loadingCampaigns ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-card/50 backdrop-blur-sm rounded-2xl h-96 animate-pulse border border-white/10">
                <div className="h-48 bg-white/10 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/3" />
                  <div className="h-6 bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/70 text-sm">
                Showing {filteredCampaigns.length} campaign
                {filteredCampaigns.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign._id} campaign={campaign} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
              <Search className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-lg font-medium text-white font-fredoka">
              No campaigns found
            </h3>
            <p className="text-white/60">
              Try adjusting your search or filters.
            </p>
          </div>
        )}

        {/* Call to Action */}
        {filteredCampaigns.length > 0 && user === null && (
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 mt-12">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4 font-fredoka">
                Ready to Start Earning?
              </h3>
              <p className="text-white/70 mb-6">
                Join thousands of players completing branded puzzles and earning
                real rewards every day.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/register?type=user">
                  <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-8 py-3 font-fredoka">
                    Start Playing
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button
                    variant="outline"
                    className="border-secondary text-white hover:bg-secondary hover:text-secondary-foreground px-8 py-3 font-fredoka">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
