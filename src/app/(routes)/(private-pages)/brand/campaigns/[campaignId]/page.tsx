"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import axios from "axios";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, Settings, Gift, Clock, Ticket, Loader2 } from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { formatPuzzleType } from "@/app/_utils/helper";
import {
  AnyCampaign,
  CampaignV2Response,
  CampaignResponse,
  isV2Campaign,
  RaffleCampaignCurrentResponse,
  RaffleFulfillmentStatus,
} from "@/types";
import { CardMatchingGame } from "@/components/games/CardMatchingGame";
import { SlidingPuzzleGame } from "@/components/games/SlidingPuzzleGame";
import { SpotTheDifferenceGame } from "@/components/games/SpotTheDifferenceGame";
import { WordHuntGame } from "@/components/games/WordHuntGame";

export default function ViewCampaignPage() {
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const params = useParams();
  const campaignId = params.campaignId as string;

  const {
    data: campaignDetails,
    error: campaignDetailsError,
    isLoading: loadingCampaign,
  } = useQuery<AnyCampaign>({
    queryKey: ["brand-campaign", campaignId],
    queryFn: () =>
      axios
        .get<CampaignResponse | CampaignV2Response>(
          endpointUrl(`${ENDPOINTS.CAMPAIGN_DETAILS(campaignId)}`),
          {
            headers: {
              Authorization: `Bearer ${user?.accessToken}`,
            },
          }
        )
        .then((res) => res.data.campaign),
    enabled: !!campaignId && !!user?.accessToken,
  });

  const { data: raffleStatus } = useQuery({
    queryKey: ["raffle-campaign-current", campaignId],
    queryFn: () =>
      axios
        .get<RaffleCampaignCurrentResponse>(
          endpointUrl(ENDPOINTS.RAFFLE_CAMPAIGN_CURRENT(campaignId))
        )
        .then((res) => res.data),
    enabled: !!campaignId,
    retry: false,
  });

  const updateFulfillmentMutation = useMutation({
    mutationFn: (fulfillmentStatus: RaffleFulfillmentStatus) =>
      axios.patch(
        endpointUrl(ENDPOINTS.RAFFLE_FULFILLMENT(raffleStatus!.drawId!)),
        { fulfillmentStatus },
        { headers: { Authorization: `Bearer ${user?.accessToken}` } }
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["raffle-campaign-current", campaignId],
      }),
  });

  const renderGameComponent = () => {
    if (!campaignDetails || isV2Campaign(campaignDetails)) return null;

    switch (campaignDetails.gameType) {
      case "card_matching":
        return (
          <CardMatchingGame
            campaignDetails={campaignDetails}
            campaignId={campaignId}
            previewMode
          />
        );
      case "sliding_puzzle":
        return (
          <SlidingPuzzleGame
            campaignDetails={campaignDetails}
            campaignId={campaignId}
            previewMode
          />
        );
      case "spot_the_difference":
        return (
          <SpotTheDifferenceGame
            campaignDetails={campaignDetails}
            campaignId={campaignId}
            previewMode
          />
        );
      case "word_hunt":
        return (
          <WordHuntGame
            campaignDetails={campaignDetails}
            campaignId={campaignId}
            previewMode
          />
        );
      default:
        return (
          <div className="border border-white/20 rounded-lg p-4 bg-gray-900/50">
            <div className="text-center">
              <h3 className="text-white font-fredoka text-lg">Game Preview</h3>
              <p className="text-white/70 text-sm">
                Game type: {formatPuzzleType(campaignDetails.gameType)}
              </p>
            </div>
          </div>
        );
    }
  };

  if (loadingCampaign) {
    return <PageLoader message="Loading campaign details..." />;
  }

  if (campaignDetailsError) {
    return (
      <PageError
        title="Failed to Load Campaign"
        message="Unable to load campaign details. Please check your connection and try again."
      />
    );
  }

  if (!campaignDetails) {
    return (
      <PageError
        title="Campaign Not Found"
        message="The requested campaign could not be found."
        showRetry={false}
      />
    );
  }

  return (
    <MainLayout maxWidth="7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={routes.BRAND.CAMPAIGNS}>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/90 mb-5">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white font-fredoka">
              {campaignDetails.title}
            </h1>
            <p className="text-white/70">
              Preview how players will experience your campaign
            </p>
          </div>
          {!isV2Campaign(campaignDetails) && (
            <Link href={`${routes.BRAND.CAMPAIGNS_NEW}?edit=${campaignId}`}>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-fredoka">
                <Settings className="h-4 w-4 mr-2" />
                Edit Campaign
              </Button>
            </Link>
          )}
        </div>

        {/* Campaign Info Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-card/50 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-secondary" />
            <span className="text-white/60 text-sm">
              {isV2Campaign(campaignDetails) ? "Games:" : "Game Type:"}
            </span>
            <span className="text-white font-semibold text-sm">
              {isV2Campaign(campaignDetails)
                ? campaignDetails.gameTypes.map((gt) => formatPuzzleType(gt)).join(", ")
                : formatPuzzleType(campaignDetails.gameType)}
            </span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Brand:</span>
            <span className="text-white font-semibold text-sm">
              {campaignDetails.brandName}
            </span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                campaignDetails.status === "active"
                  ? "bg-green-400"
                  : campaignDetails.status === "draft"
                  ? "bg-yellow-400"
                  : "bg-gray-400"
              }`}></div>
            <span className="text-white font-semibold text-sm capitalize">
              {campaignDetails.status}
            </span>
          </div>
          {isV2Campaign(campaignDetails) && (
            <>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                <span className="text-white font-semibold text-sm">
                  {campaignDetails.durationWeeks} week{campaignDetails.durationWeeks !== 1 ? "s" : ""} &bull; ₦
                  {campaignDetails.weeklyPrice?.toLocaleString()}/week
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Game Component - Full Width (legacy single-game campaigns) */}
      {renderGameComponent()}

      {/* v2 (multi-game) campaign summary — full session preview lands with
          the player-facing gameplay flow; this is a read-only overview. */}
      {isV2Campaign(campaignDetails) && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Gift className="h-5 w-5 text-secondary" />
              Prize
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/80">{campaignDetails.prizeDescription}</p>
            <p className="text-white/50 text-sm">
              {campaignDetails.prizeUnitsAvailable ?? 1} unit(s) available &bull; 1 winner drawn weekly
            </p>
            {campaignDetails.videoUrl && (
              <video
                src={campaignDetails.videoUrl}
                controls
                className="w-full max-h-80 rounded-lg border border-white/10"
              />
            )}
            {campaignDetails.words?.length > 0 && (
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-2">
                  Word Hunt Words
                </p>
                <div className="flex flex-wrap gap-2">
                  {campaignDetails.words.map((w) => (
                    <span
                      key={w}
                      className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-white/70 text-xs font-mono">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Raffle status (v2 only) */}
      {isV2Campaign(campaignDetails) && raffleStatus && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 mt-6">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Ticket className="h-5 w-5 text-secondary" />
              Weekly Raffle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-white/70">
                <span className="text-white font-semibold">
                  {raffleStatus.ticketCount}
                </span>{" "}
                tickets banked this week
              </span>
              <span className="text-white/70">
                Eligibility floor:{" "}
                <span className="text-white font-semibold">
                  {raffleStatus.eligibilityFloor}
                </span>{" "}
                completions
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  raffleStatus.drawStatus === "drawn"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                {raffleStatus.drawStatus === "drawn" ? "Drawn" : "Draw pending"}
              </span>
            </div>

            {raffleStatus.drawStatus === "drawn" && raffleStatus.winner ? (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
                <p className="text-white/80 text-sm">
                  Winner:{" "}
                  <span className="text-white font-semibold">
                    {raffleStatus.winner.username
                      ? `@${raffleStatus.winner.username}`
                      : raffleStatus.winner.fullName ?? "Player"}
                  </span>
                </p>
                {raffleStatus.drawId && (
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["pending", "shipped", "delivered", "failed"] as RaffleFulfillmentStatus[]
                    ).map((statusOption) => (
                      <Button
                        key={statusOption}
                        size="sm"
                        variant="outline"
                        disabled={updateFulfillmentMutation.isPending}
                        onClick={() => updateFulfillmentMutation.mutate(statusOption)}
                        className="border-white/20 text-white hover:bg-white/10 capitalize text-xs">
                        {updateFulfillmentMutation.isPending && (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        Mark {statusOption}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/50 text-xs">
                Draws run automatically every Monday.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quiz Questions Reference */}
      {campaignDetails.questions && campaignDetails.questions.length > 0 && (
        <div className="mt-8">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white font-fredoka text-lg">
                Quiz Questions Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaignDetails.questions.map(
                  (question: any, index: number) => (
                    <div
                      key={index}
                      className="border border-white/10 rounded p-3">
                      <h4 className="text-white font-semibold text-sm mb-2">
                        Question {index + 1}
                      </h4>
                      <p className="text-white/80 text-sm mb-2">
                        {question.question || question.questionText}
                      </p>
                      <div className="space-y-1">
                        {(question.choices || question.options || []).map(
                          (choice: any, choiceIndex: number) => {
                            const choiceText =
                              typeof choice === "string"
                                ? choice
                                : choice.optionText;
                            const isCorrect =
                              question.correctIndex !== undefined
                                ? choiceIndex === question.correctIndex
                                : choice.isCorrect;
                            return (
                              <div
                                key={choiceIndex}
                                className={`text-xs p-2 rounded ${
                                  isCorrect
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-white/5 text-white/60 border border-white/10"
                                }`}>
                                {String.fromCharCode(65 + choiceIndex)}.{" "}
                                {choiceText}
                                {isCorrect && " \u2713"}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
