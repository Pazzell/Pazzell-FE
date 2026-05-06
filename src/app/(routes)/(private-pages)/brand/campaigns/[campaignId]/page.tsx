"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { ArrowLeft, Info, Settings } from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { formatPuzzleType } from "@/app/_utils/helper";
import { CampaignData, CampaignResponse } from "@/types";
import { CardMatchingGame } from "@/components/games/CardMatchingGame";
import { SlidingPuzzleGame } from "@/components/games/SlidingPuzzleGame";
import { SpotTheDifferenceGame } from "@/components/games/SpotTheDifferenceGame";
import { WordHuntGame } from "@/components/games/WordHuntGame";

export default function ViewCampaignPage() {
  const user = useAtomValue(userAtom);
  const params = useParams();
  const campaignId = params.campaignId as string;

  const {
    data: campaignDetails,
    error: campaignDetailsError,
    isLoading: loadingCampaign,
  } = useQuery<CampaignData>({
    queryKey: ["brand-campaign", campaignId],
    queryFn: () =>
      axios
        .get<CampaignResponse>(
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

  const renderGameComponent = () => {
    if (!campaignDetails) return null;

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
          <Link href={`${routes.BRAND.CAMPAIGNS_NEW}?edit=${campaignId}`}>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 font-fredoka">
              <Settings className="h-4 w-4 mr-2" />
              Edit Campaign
            </Button>
          </Link>
        </div>

        {/* Campaign Info Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-card/50 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-secondary" />
            <span className="text-white/60 text-sm">Game Type:</span>
            <span className="text-white font-semibold text-sm">
              {formatPuzzleType(campaignDetails.gameType)}
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
        </div>
      </div>

      {/* Game Component - Full Width */}
      {renderGameComponent()}

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
