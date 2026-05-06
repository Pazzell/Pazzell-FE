import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { routes } from '@/app/_utils/routes'
import { formatPuzzleType } from '@/app/_utils/helper'
import { CampaignData } from '@/types'

interface PuzzlePageHeaderProps {
  campaignDetails: CampaignData | undefined
  backRoute?: string
  backText?: string
}

export function PuzzlePageHeader({ 
  campaignDetails, 
  backRoute = routes.CAMPAIGNS,
  backText = "Back to Campaigns"
}: PuzzlePageHeaderProps) {
  return (
    <div className="mb-8">
      <Link 
        href={backRoute}
        className="inline-flex items-center gap-2 text-white/70 hover:text-secondary transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        {backText}
      </Link>
      
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-white font-fredoka">
              {campaignDetails?.title || 'Loading...'}
            </h1>
            {campaignDetails?.campaignUrl && (
              <a 
                href={campaignDetails.campaignUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 hover:text-secondary/80 transition-colors font-medium text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Campaign
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-white/70">{campaignDetails?.brandName}</span>
            {campaignDetails?.gameType && (
              <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                {formatPuzzleType(campaignDetails.gameType)}
              </Badge>
            )}
          </div>
          {campaignDetails?.description && (
            <p className="text-white/80 text-base max-w-2xl leading-relaxed">
              {campaignDetails.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}