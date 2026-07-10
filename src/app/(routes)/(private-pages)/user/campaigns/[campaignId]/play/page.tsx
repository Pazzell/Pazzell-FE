"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import {
  AnyCampaign,
  CampaignCompletionResponse,
  CampaignResponse,
  CampaignV2Response,
  isV2Campaign,
} from "@/types";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { RealSessionFlow } from "./real-session-flow";
import { FunRunFlow } from "./fun-run-flow";

export default function CampaignSessionPlayPage() {
  const user = useAtomValue(userAtom);
  const params = useParams();
  const campaignId = params.campaignId as string;
  const [acknowledgedReplay, setAcknowledgedReplay] = useState(false);

  const {
    data: campaign,
    error: campaignError,
    isLoading: loadingCampaign,
  } = useQuery<AnyCampaign>({
    queryKey: ["campaign", campaignId],
    queryFn: () =>
      axios
        .get<CampaignResponse | CampaignV2Response>(
          endpointUrl(ENDPOINTS.CAMPAIGN_DETAILS(campaignId)),
          { headers: { Authorization: `Bearer ${user?.accessToken}` } }
        )
        .then((res) => res.data.campaign),
    enabled: !!campaignId && !!user?.accessToken,
  });

  const {
    data: completionStatus,
    isLoading: loadingCompletion,
  } = useQuery<CampaignCompletionResponse>({
    queryKey: ["campaign-completion", campaignId],
    queryFn: () =>
      axios
        .get<CampaignCompletionResponse>(
          endpointUrl(ENDPOINTS.CAMPAIGN_COMPLETION(campaignId)),
          { headers: { Authorization: `Bearer ${user?.accessToken}` } }
        )
        .then((res) => res.data),
    enabled: !!campaignId && !!user?.accessToken,
  });

  if (loadingCampaign || loadingCompletion) {
    return <PageLoader message="Loading campaign..." />;
  }

  if (campaignError || !campaign) {
    return (
      <PageError
        title="Failed to Load Campaign"
        message="Unable to load this campaign. Please check your connection and try again."
      />
    );
  }

  if (!isV2Campaign(campaign)) {
    return (
      <PageError
        title="Not Available"
        message="This campaign uses the classic single-game format — play it from the campaigns list instead."
        showRetry={false}
      />
    );
  }

  const isReplay = !!completionStatus?.hasCompletedByCurrentUser;

  return (
    <MainLayout maxWidth="6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-fredoka">{campaign.title}</h1>
        <p className="text-white/70">{campaign.brandName}</p>
      </div>

      {isReplay && !acknowledgedReplay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            data-testid="replay-warning-modal"
            className="bg-card border border-white/10 rounded-2xl p-8 max-w-md w-full space-y-5">
            <div className="flex items-center gap-3 text-yellow-400">
              <Info className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold font-fredoka">
                You&apos;ve Already Completed This
              </h3>
            </div>
            <p className="text-white/80 leading-relaxed">
              This attempt is just for fun —{" "}
              <span className="text-yellow-300 font-semibold">
                no points, no raffle ticket, and no recorded time
              </span>
              . Nothing from this run gets submitted.
            </p>
            <Button
              onClick={() => setAcknowledgedReplay(true)}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              Continue (Just for Fun)
            </Button>
          </div>
        </div>
      ) : isReplay ? (
        <FunRunFlow campaign={campaign} campaignId={campaignId} />
      ) : (
        <RealSessionFlow campaign={campaign} campaignId={campaignId} />
      )}
    </MainLayout>
  );
}
