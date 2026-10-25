'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  GamepadIcon, 
  Calendar,
  ChevronUp,
  ChevronDown,
  Activity,
  TrendingUp,
  Puzzle
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ENDPOINTS } from '@/app/_utils/endpoints'
import type { AppAnalyticsResponse } from '@/types'
import { useAtomValue } from 'jotai/react'
import { userAtom } from '@/atom/user'

// The server forgets an online user after 5 minutes without a ping.
const ONLINE_PING_MS = 4 * 60 * 1000

export function FloatingAnalytics() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Fetch analytics data with auto-refresh every 30 seconds
  const { data: analyticsData, isLoading } = useQuery<AppAnalyticsResponse>({
    queryKey: ['app-analytics'],
    queryFn: () =>
      api.get<AppAnalyticsResponse>(ENDPOINTS.APP_ANALYTICS).then((res) => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
  })

  const analytics = analyticsData?.analytics

  // Keep a logged-in visitor counted as online for as long as the app is open.
  const userId = useAtomValue(userAtom)?.id
  useEffect(() => {
    if (!userId) return
    const ping = () => api.post(ENDPOINTS.ANALYTICS_USER_ONLINE).catch(() => {})
    ping()
    const interval = setInterval(ping, ONLINE_PING_MS)
    return () => clearInterval(interval)
  }, [userId])

  // Auto-hide after initial display
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // A team game's board and team chat fill the corner the widget sits in.
  if (pathname?.startsWith('/team/')) return null

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-lg backdrop-blur-sm border border-white/10 p-0"
      >
        <TrendingUp className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-card/90 backdrop-blur-md border-white/20 shadow-2xl max-w-xs">
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold text-sm">Live Stats</span>
            </div>
            <div className="flex items-center gap-1">
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </Button> */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
              >
                ×
              </Button>
            </div>
          </div>

          {/* Compact view */}
          {!isExpanded && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GamepadIcon className="w-3 h-3 text-yellow-400" />
                  <span className="text-white font-semibold">{analytics?.totalGamesPlayed || 0}</span>
                </div>
                <span className="text-xs text-white/60">Total</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Puzzle className="w-3 h-3 text-purple-400" />
                  <span className="text-white font-semibold">{analytics?.gamesPlayedToday || 0}</span>
                </div>
                <span className="text-xs text-white/60">Today</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-blue-400" />
                  <span className="text-white font-semibold">{analytics?.onlineUsers || 0}</span>
                </div>
                <span className="text-xs text-white/60">Online</span>
              </div>
            </div>
          )}

          {/* Expanded view */}
          {isExpanded && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Currently Playing */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Activity className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-xl font-bold text-white">
                    {isLoading ? '...' : analytics?.currentlyPlaying || 0}
                  </div>
                  <div className="text-xs text-white/60">Playing Now</div>
                </div>

                {/* Online Users */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-bold text-white">
                    {isLoading ? '...' : analytics?.onlineUsers || 0}
                  </div>
                  <div className="text-xs text-white/60">Online</div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Games Today */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-lg font-bold text-white">
                      {isLoading ? '...' : analytics?.gamesPlayedToday || 0}
                    </div>
                    <div className="text-xs text-white/60">Today</div>
                  </div>

                  {/* Total Games */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <GamepadIcon className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-lg font-bold text-white">
                      {isLoading ? '...' : analytics?.totalGamesPlayed || 0}
                    </div>
                    <div className="text-xs text-white/60">Total</div>
                  </div>
                </div>
              </div>

              {/* Last updated */}
              <div className="text-center text-xs text-white/40 border-t border-white/10 pt-2">
                Auto-updates every 30s
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}