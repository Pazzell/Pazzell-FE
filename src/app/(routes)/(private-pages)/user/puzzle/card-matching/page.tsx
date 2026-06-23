'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { routes } from '@/app/_utils/routes'
import { CampaignData, CampaignResponse } from '@/types'
import axios from 'axios'
import { endpointUrl, hasPlayedToday } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atom/user'
import { PageLoader } from '@/components/ui/page-loader'
import { PageError } from '@/components/ui/page-error'
import { PuzzlePageHeader } from '../components/puzzle-page-header'
import { CardMatchingGame } from '@/components/games/CardMatchingGame'
import { AlertCircle } from 'lucide-react'

export default function CardMatchingPage() {
  const user = useAtomValue(userAtom)
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaign')

  const { data: campaignDetails, error: campaignDetailsError, isLoading: loadingCampaigns } = useQuery<CampaignData>({
    queryKey: ["campaign", campaignId],
    queryFn: () => axios.get<CampaignResponse>(endpointUrl(`${ENDPOINTS.CAMPAIGN_DETAILS(campaignId!)}`), {
      headers: {
        Authorization: `Bearer ${user?.accessToken}`,
      },
    }).then((res) => res.data.campaign),
    enabled: !!campaignId,
  });

  const { data: completionStatus } = useQuery({
    queryKey: ["campaign-completion", campaignId],
    queryFn: () => axios.get(endpointUrl(ENDPOINTS.CAMPAIGN_COMPLETION(campaignId!)), {
      headers: {
        Authorization: `Bearer ${user?.accessToken}`,
      },
    }).then((res) => res.data),
    enabled: !!campaignId && !!user?.accessToken,
  });

  const { data: availableCampaigns } = useQuery({
    queryKey: ["available-campaigns"],
    queryFn: () => axios.get(endpointUrl(ENDPOINTS.CAMPAIGNS), {
      headers: {
        Authorization: `Bearer ${user?.accessToken}`,
      },
    }).then((res) => res.data.campaigns),
    enabled: !!user?.accessToken,
  });

  if (!campaignId) {
    return (
      <PageError
        title="No Campaign Selected"
        message="Please select a campaign from the campaigns page to start playing."
        showRetry={false}
      />
    )
  }

  if (loadingCampaigns) {
    return <PageLoader message="Loading campaign details..." />
  }

  if (campaignDetailsError || !campaignDetails) {
    return (
      <PageError
        title="Failed to Load Campaign"
        message="Unable to load campaign details. Please check your connection and try again."
      />
    )
  }

  return (
    <MainLayout maxWidth="7xl">
      <PuzzlePageHeader
        campaignDetails={campaignDetails}
        backRoute={routes.CAMPAIGNS}
        backText="Back to Campaigns"
      />

      {hasPlayedToday(campaignId!) && (
        <div className="mb-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-yellow-200 font-semibold font-fredoka">Puzzle Already Completed</h3>
                <p className="text-yellow-200/80 text-sm">
                  You&apos;ve already played this puzzle. Extra points won&apos;t be awarded for playing again, but you can still enjoy the game!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <CardMatchingGame
        campaignDetails={campaignDetails}
        campaignId={campaignId}
        availableCampaigns={availableCampaigns}
      />
    </MainLayout>
  )
}
