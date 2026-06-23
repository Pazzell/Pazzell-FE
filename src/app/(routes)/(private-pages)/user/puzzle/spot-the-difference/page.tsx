"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { CampaignData, CampaignResponse } from "@/types";
import axios from "axios";
import { endpointUrl, hasPlayedToday } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { PuzzlePageHeader } from "../components/puzzle-page-header";
import { SpotTheDifferenceGame } from "@/components/games/SpotTheDifferenceGame";

export default function SpotTheDifferencePage() {
  const user = useAtomValue(userAtom);
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign");

  const {
    data: campaignDetails,
    error: campaignDetailsError,
    isLoading: loadingCampaigns,
  } = useQuery<CampaignData>({
    queryKey: ["campaign", campaignId],
    queryFn: () =>
      axios
        .get<CampaignResponse>(
          endpointUrl(`${ENDPOINTS.CAMPAIGN_DETAILS(campaignId!)}`),
          { headers: { Authorization: `Bearer ${user?.accessToken}` } }
        )
        .then((res) => res.data.campaign),
    enabled: !!campaignId,
  });

  const { data: completionStatus } = useQuery({
    queryKey: ["campaign-completion", campaignId],
    queryFn: () =>
      axios
        .get(endpointUrl(ENDPOINTS.CAMPAIGN_COMPLETION(campaignId!)), {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        })
        .then((res) => res.data),
    enabled: !!campaignId && !!user?.accessToken,
  });

  const { data: availableCampaigns } = useQuery({
    queryKey: ["available-campaigns"],
    queryFn: () =>
      axios
        .get(endpointUrl(ENDPOINTS.CAMPAIGNS), {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        })
        .then((res) => res.data.campaigns),
    enabled: !!user?.accessToken,
  });

  if (!campaignId) {
    return (
      <PageError
        title="No Campaign Selected"
        message="Please select a campaign from the campaigns page to start playing."
        showRetry={false}
      />
    );
  }

  if (loadingCampaigns) {
    return <PageLoader message="Loading campaign details..." />;
  }

  if (campaignDetailsError || !campaignDetails) {
    return (
      <PageError
        title="Failed to Load Campaign"
        message="Unable to load campaign details. Please check your connection and try again."
      />
    );
  }

  return (
    <MainLayout>
      <PuzzlePageHeader campaignDetails={campaignDetails} />
      <SpotTheDifferenceGame
        campaignDetails={campaignDetails}
        campaignId={campaignId}
        availableCampaigns={availableCampaigns}
        hasCompleted={hasPlayedToday(campaignId!)}
      />
    </MainLayout>
  );
}
