'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  PlayCircle, 
  Target,
  Calendar,
  Eye,
  Trophy,
  Activity,
  Plus,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { routes } from '@/app/_utils/routes'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { endpointUrl } from '@/app/_utils/helper'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import { CampaignsResponse, CampaignData, BrandAnalyticsData, BrandAnalyticsResponse } from '@/types'
import { useAtomValue } from 'jotai'
import { userAtom } from '@/atom/user'
import { PageLoader } from '@/components/ui/page-loader'
import { PageError } from '@/components/ui/page-error'

export default function BrandDashboard() {
  const user = useAtomValue(userAtom)
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`

  // Fetch brand campaigns using the brand ID from user data
  const { data: campaigns, error: campaignsError, isLoading: loadingCampaigns } = useQuery<CampaignData[]>({
    queryKey: ["brand-campaigns", user?.id],
    queryFn: () => axios.get<CampaignsResponse>(endpointUrl(ENDPOINTS.BRAND_CAMPAIGNS_BY_ID(user?.id || '')),
      {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      }).then((res) => {
        return res.data.campaigns;
      }),
    enabled: !!user?.id && !!user?.accessToken,
  })

  // Fetch brand analytics
  const { data: analytics, error: analyticsError, isLoading: loadingAnalytics } = useQuery<BrandAnalyticsData>({
    queryKey: ["brand-analytics"],
    queryFn: () => axios.get<BrandAnalyticsResponse>(
      endpointUrl(ENDPOINTS.BRAND_ANALYTICS),
      {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      }
    ).then((res) => res.data.analytics),
    enabled: !!user?.accessToken,
  })

  // Calculate dashboard stats from analytics and campaigns data
  const dashboardStats = useMemo(() => {
    const totalBudget = campaigns
      ? campaigns.reduce((sum, c) => sum + (c.budgetUsed || 0) + (c.budgetRemaining || 0), 0)
      : 0

    if (!analytics) {
      return {
        activeCampaigns: 0,
        totalBudget,
        totalSpent: 0,
        totalPlays: 0,
        uniquePlayers: 0,
        conversionRate: 0,
        avgCompletionTime: 0,
      }
    }

    const totalCompletions = analytics.campaigns.reduce((sum, c) => sum + c.completions, 0)
    const totalPlays = analytics.totalGamesPlayed
    const conversionRate = totalPlays > 0 ? (totalCompletions / totalPlays) * 100 : 0

    return {
      activeCampaigns: analytics.activeCampaigns,
      totalBudget,
      totalSpent: analytics.totalBudgetUsed,
      totalPlays,
      uniquePlayers: analytics.uniquePlayers,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgCompletionTime: Math.round(analytics.avgPlayTime / 1000), // ms to seconds
    }
  }, [campaigns, analytics])

  // Get recent campaigns (limit to 3 most recent), merged with analytics
  const recentCampaigns = useMemo(() => {
    if (!campaigns) return []

    // Build a lookup map from analytics data
    const analyticsMap = new Map(
      (analytics?.campaigns || []).map(a => [a.campaignId, a])
    )

    return campaigns
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map(campaign => {
        const campaignAnalytics = analyticsMap.get(campaign._id)
        const plays = campaignAnalytics?.plays || 0
        const completions = campaignAnalytics?.completions || 0
        const completionRate = plays > 0 ? Math.round((completions / plays) * 1000) / 10 : 0

        return {
          id: campaign._id,
          name: campaign.title,
          status: campaign.status || 'active',
          budget: (campaign.budgetUsed || 0) + (campaign.budgetRemaining || 0),
          spent: campaign.budgetUsed || 0,
          plays,
          completionRate,
          startDate: campaign.createdAt,
          gameType: campaign.gameType,
        }
      })
  }, [campaigns, analytics])

  if (loadingCampaigns || loadingAnalytics) {
    return <PageLoader message="Loading dashboard..." />
  }

  if (campaignsError || analyticsError) {
    return (
      <PageError
        title="Failed to Load Dashboard"
        message="Unable to load dashboard data. Please check your connection and try again."
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka">
            Dashboard Overview
          </h1>
          <p className="text-white/70">
            Track your campaign performance and engagement metrics
          </p>
        </div>
        <Link href={routes.BRAND.CAMPAIGNS}>
          <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-fredoka">{dashboardStats.activeCampaigns}</p>
                <p className="text-xs text-white/60 uppercase tracking-wider">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-fredoka">{formatCurrency(dashboardStats.totalBudget)}</p>
                <p className="text-xs text-white/60 uppercase tracking-wider">Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <PlayCircle className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-fredoka">{dashboardStats.totalPlays.toLocaleString()}</p>
                <p className="text-xs text-white/60 uppercase tracking-wider">Plays</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-fredoka">{dashboardStats.uniquePlayers.toLocaleString()}</p>
                <p className="text-xs text-white/60 uppercase tracking-wider">Players</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-secondary" />
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Budget Utilization</span>
              <span className="text-white font-semibold">
                {dashboardStats.totalBudget > 0 ? Math.round((dashboardStats.totalSpent / dashboardStats.totalBudget) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-secondary h-2 rounded-full"
                style={{ width: `${dashboardStats.totalBudget > 0 ? (dashboardStats.totalSpent / dashboardStats.totalBudget) * 100 : 0}%` }}
              ></div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-sm">Conversion Rate</span>
                <div className="flex items-center gap-1 text-green-400">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-sm font-semibold">{dashboardStats.conversionRate}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Avg. Completion Time</span>
                <span className="text-white font-semibold">{formatTime(dashboardStats.avgCompletionTime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                Recent Campaigns
              </CardTitle>
              <Link href={routes.BRAND.CAMPAIGNS}>
                <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:bg-white/10">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampaigns.length > 0 ? recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="text-white font-semibold">{campaign.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge 
                          className={`text-xs ${
                            campaign.status === 'active' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}
                        >
                          {campaign.status}
                        </Badge>
                        <span className="text-white/60 text-sm capitalize">{campaign.gameType}</span>
                        <span className="text-white/60 text-sm">{campaign.plays.toLocaleString()} plays</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}
                    </div>
                    <div className="text-white/60 text-sm">
                      {campaign.completionRate}% completion
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-white/60">No campaigns found</p>
                  <Link href={routes.BRAND.CAMPAIGNS_CREATE}>
                    <Button className="mt-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                      Create Your First Campaign
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Campaigns */}
      {campaigns && campaigns.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Campaign Overview
            </CardTitle>
            <CardDescription className="text-white/70">
              Overview of your campaign types and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {campaigns.slice(0, 3).map((campaign, index) => (
                <div key={campaign._id} className="p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-secondary font-semibold text-sm">#{index + 1}</span>
                    </div>
                    <h4 className="text-white font-semibold truncate">{campaign.title}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Game Type</span>
                      <span className="text-white font-semibold capitalize">{campaign.gameType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Status</span>
                      <Badge className={`text-xs ${
                        (campaign.status || 'active') === 'active' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {campaign.status || 'active'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Created</span>
                      <span className="text-white font-semibold">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}