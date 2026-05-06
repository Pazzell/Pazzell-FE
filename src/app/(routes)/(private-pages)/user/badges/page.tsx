'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Brain, 
  Eye, 
  Clock, 
  Award, 
  Crown,
  Medal,
  Gamepad2,
  TrendingUp,
  Calendar,
  Sparkles,
  Gift,
  Heart,
  Shield,
  Flame,
  Gem,
  Coffee
} from 'lucide-react'
import { Badge as BadgeType } from '@/types'

// Mock user data - in real app, this would come from API
const userStats = {
  puzzlesCompleted: 23,
  totalEarnings: 145.50,
  perfectScores: 8,
  currentStreak: 5,
  triviaCompleted: 12,
  wordPuzzlesCompleted: 6,
  imagePuzzlesCompleted: 3,
  memoryGamesCompleted: 2,
  weeklyRank: 15,
  fastestTime: 28,
  daysPlayed: 18
}

// 30 practical badges based on the platform's features
const allBadges: BadgeType[] = [
  // Milestone Badges (8)
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your very first puzzle',
    icon: 'Star',
    category: 'milestone',
    difficulty: 'bronze',
    requirement: 1,
    isUnlocked: userStats.puzzlesCompleted >= 1
  },
  {
    id: 'puzzle-novice',
    title: 'Puzzle Novice', 
    description: 'Complete 10 puzzles',
    icon: 'Target',
    category: 'milestone',
    difficulty: 'bronze',
    requirement: 10,
    isUnlocked: userStats.puzzlesCompleted >= 10
  },
  {
    id: 'puzzle-explorer',
    title: 'Puzzle Explorer',
    description: 'Complete 25 puzzles',
    icon: 'Gamepad2',
    category: 'milestone', 
    difficulty: 'silver',
    requirement: 25,
    isUnlocked: userStats.puzzlesCompleted >= 25
  },
  {
    id: 'puzzle-master',
    title: 'Puzzle Master',
    description: 'Complete 50 puzzles',
    icon: 'Trophy',
    category: 'milestone',
    difficulty: 'gold',
    requirement: 50,
    isUnlocked: userStats.puzzlesCompleted >= 50
  },
  {
    id: 'puzzle-legend',
    title: 'Puzzle Legend',
    description: 'Complete 100 puzzles',
    icon: 'Crown',
    category: 'milestone',
    difficulty: 'platinum',
    requirement: 100,
    isUnlocked: userStats.puzzlesCompleted >= 100
  },
  {
    id: 'daily-player',
    title: 'Daily Player',
    description: 'Play puzzles for 7 consecutive days',
    icon: 'Calendar',
    category: 'milestone',
    difficulty: 'silver',
    requirement: 7,
    isUnlocked: userStats.currentStreak >= 7
  },
  {
    id: 'dedicated-player',
    title: 'Dedicated Player',
    description: 'Play puzzles for 30 days',
    icon: 'Heart',
    category: 'milestone',
    difficulty: 'gold',
    requirement: 30,
    isUnlocked: userStats.daysPlayed >= 30
  },
  {
    id: 'loyal-player',
    title: 'Loyal Player',
    description: 'Play puzzles for 100 days',
    icon: 'Shield',
    category: 'milestone',
    difficulty: 'platinum',
    requirement: 100,
    isUnlocked: userStats.daysPlayed >= 100
  },

  // Earnings Badges (6)
  {
    id: 'first-earnings',
    title: 'First Earnings',
    description: 'Earn your first dollar',
    icon: 'Gift',
    category: 'earnings',
    difficulty: 'bronze',
    requirement: 1,
    isUnlocked: userStats.totalEarnings >= 1
  },
  {
    id: 'money-maker',
    title: 'Money Maker',
    description: 'Earn ₦50,000 total',
    icon: 'TrendingUp',
    category: 'earnings',
    difficulty: 'bronze',
    requirement: 50000,
    isUnlocked: userStats.totalEarnings >= 50000
  },
  {
    id: 'high-earner',
    title: 'High Earner',
    description: 'Earn ₦100,000 total',
    icon: 'Gem',
    category: 'earnings',
    difficulty: 'silver',
    requirement: 100000,
    isUnlocked: userStats.totalEarnings >= 100000
  },
  {
    id: 'cash-collector',
    title: 'Cash Collector',
    description: 'Earn ₦250,000 total',
    icon: 'Award',
    category: 'earnings',
    difficulty: 'gold',
    requirement: 250000,
    isUnlocked: userStats.totalEarnings >= 250000
  },
  {
    id: 'profit-pro',
    title: 'Profit Pro',
    description: 'Earn ₦500,000 total',
    icon: 'Medal',
    category: 'earnings',
    difficulty: 'gold',
    requirement: 500000,
    isUnlocked: userStats.totalEarnings >= 500000
  },
  {
    id: 'money-master',
    title: 'Money Master',
    description: 'Earn ₦1,000,000 total',
    icon: 'Crown',
    category: 'earnings',
    difficulty: 'platinum',
    requirement: 1000000,
    isUnlocked: userStats.totalEarnings >= 1000000
  },

  // Specialist Badges (5)
  {
    id: 'trivia-expert',
    title: 'Trivia Expert',
    description: 'Complete 25 trivia puzzles',
    icon: 'Brain',
    category: 'specialist',
    difficulty: 'silver',
    requirement: 25,
    isUnlocked: userStats.triviaCompleted >= 25
  },
  {
    id: 'word-wizard',
    title: 'Word Wizard',
    description: 'Complete 25 word puzzles',
    icon: 'Coffee',
    category: 'specialist',
    difficulty: 'silver',
    requirement: 25,
    isUnlocked: userStats.wordPuzzlesCompleted >= 25
  },
  {
    id: 'visual-master',
    title: 'Visual Master',
    description: 'Complete 25 image puzzles',
    icon: 'Eye',
    category: 'specialist',
    difficulty: 'silver',
    requirement: 25,
    isUnlocked: userStats.imagePuzzlesCompleted >= 25
  },
  {
    id: 'memory-champion',
    title: 'Memory Champion',
    description: 'Complete 25 memory games',
    icon: 'Brain',
    category: 'specialist',
    difficulty: 'silver',
    requirement: 25,
    isUnlocked: userStats.memoryGamesCompleted >= 25
  },
  {
    id: 'puzzle-specialist',
    title: 'Puzzle Specialist',
    description: 'Complete puzzles in all 5 categories',
    icon: 'Sparkles',
    category: 'specialist',
    difficulty: 'gold',
    requirement: '5 types',
    isUnlocked: userStats.triviaCompleted >= 1 && userStats.wordPuzzlesCompleted >= 1 && userStats.imagePuzzlesCompleted >= 1 && userStats.memoryGamesCompleted >= 1
  },

  // Performance Badges (6)
  {
    id: 'lightning-fast',
    title: 'Lightning Fast',
    description: 'Complete a puzzle in under 30 seconds',
    icon: 'Zap',
    category: 'performance',
    difficulty: 'silver',
    requirement: 30,
    isUnlocked: userStats.fastestTime <= 30
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 10 puzzles in under 1 minute each',
    icon: 'Clock',
    category: 'performance',
    difficulty: 'gold',
    requirement: 10,
    isUnlocked: false // Would track separately in real app
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Achieve 100% accuracy on a puzzle',
    icon: 'Star',
    category: 'performance',
    difficulty: 'bronze',
    requirement: 1,
    isUnlocked: userStats.perfectScores >= 1
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Achieve perfect scores on 10 puzzles',
    icon: 'Gem',
    category: 'performance',
    difficulty: 'gold',
    requirement: 10,
    isUnlocked: userStats.perfectScores >= 10
  },
  {
    id: 'win-streak',
    title: 'Win Streak',
    description: 'Complete 5 puzzles in a row without failing',
    icon: 'Flame',
    category: 'performance',
    difficulty: 'silver',
    requirement: 5,
    isUnlocked: userStats.currentStreak >= 5
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Complete 15 puzzles in a row without failing',
    icon: 'Trophy',
    category: 'performance',
    difficulty: 'platinum',
    requirement: 15,
    isUnlocked: userStats.currentStreak >= 15
  },

  // Competitive Badges (5)
  {
    id: 'top-100',
    title: 'Top 100',
    description: 'Reach top 100 on weekly leaderboard',
    icon: 'Medal',
    category: 'competitive',
    difficulty: 'bronze',
    requirement: 100,
    isUnlocked: userStats.weeklyRank <= 100
  },
  {
    id: 'top-50',
    title: 'Top 50',
    description: 'Reach top 50 on weekly leaderboard',
    icon: 'Award',
    category: 'competitive',
    difficulty: 'silver',
    requirement: 50,
    isUnlocked: userStats.weeklyRank <= 50
  },
  {
    id: 'top-25',
    title: 'Top 25',
    description: 'Reach top 25 on weekly leaderboard',
    icon: 'Trophy',
    category: 'competitive',
    difficulty: 'silver',
    requirement: 25,
    isUnlocked: userStats.weeklyRank <= 25
  },
  {
    id: 'top-10',
    title: 'Top 10',
    description: 'Reach top 10 on weekly leaderboard', 
    icon: 'Crown',
    category: 'competitive',
    difficulty: 'gold',
    requirement: 10,
    isUnlocked: userStats.weeklyRank <= 10
  },
  {
    id: 'weekly-champion',
    title: 'Weekly Champion',
    description: 'Finish #1 on weekly leaderboard',
    icon: 'Crown',
    category: 'competitive',
    difficulty: 'platinum',
    requirement: 1,
    isUnlocked: userStats.weeklyRank === 1
  }
]

const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: any } = {
    Trophy, Star, Target, Zap, Brain, Eye, Clock, Award, Crown, Medal,
    Gamepad2, TrendingUp, Calendar, Sparkles, Gift, Heart, Shield, Flame, Gem, Coffee
  }
  const Icon = icons[iconName] || Star
  return Icon
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'bronze':
      return 'text-amber-600 bg-amber-600/20 border-amber-600/30'
    case 'silver': 
      return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
    case 'gold':
      return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30'
    case 'platinum':
      return 'text-purple-400 bg-purple-400/20 border-purple-400/30'
    default:
      return 'text-secondary bg-secondary/20 border-secondary/30'
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'milestone': return <Target className="h-4 w-4" />
    case 'earnings': return <TrendingUp className="h-4 w-4" />
    case 'specialist': return <Brain className="h-4 w-4" />
    case 'performance': return <Zap className="h-4 w-4" />
    case 'competitive': return <Trophy className="h-4 w-4" />
    default: return <Star className="h-4 w-4" />
  }
}

export default function BadgesPage() {
  const unlockedBadges = allBadges.filter(badge => badge.isUnlocked)
  const categories = ['milestone', 'earnings', 'specialist', 'performance', 'competitive']
  
  const categoryNames = {
    milestone: 'Milestone Badges',
    earnings: 'Earnings Badges', 
    specialist: 'Specialist Badges',
    performance: 'Performance Badges',
    competitive: 'Competitive Badges'
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4 font-fredoka">
          Badge Collection
        </h1>
        <p className="text-white/70 text-lg mb-6">
          Track your achievements and unlock new badges as you play
        </p>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-white font-fredoka">{unlockedBadges.length}</p>
              <p className="text-white/60 text-sm">Unlocked</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-white/40 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white font-fredoka">{allBadges.length - unlockedBadges.length}</p>
              <p className="text-white/60 text-sm">Remaining</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 text-center">
              <Gamepad2 className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-white font-fredoka">{userStats.puzzlesCompleted}</p>
              <p className="text-white/60 text-sm">Puzzles</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-white font-fredoka">${userStats.totalEarnings}</p>
              <p className="text-white/60 text-sm">Earned</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Collection Progress</span>
            <span className="text-secondary font-bold">
              {Math.round((unlockedBadges.length / allBadges.length) * 100)}%
            </span>
          </div>
          <Progress 
            value={(unlockedBadges.length / allBadges.length) * 100} 
            className="h-3"
          />
        </CardContent>
      </Card>

      {/* Badge Categories */}
      {categories.map((category) => {
        const categoryBadges = allBadges.filter(badge => badge.category === category)
        
        return (
          <Card key={category} className="bg-card/50 backdrop-blur-sm border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white font-fredoka flex items-center gap-2">
                {getCategoryIcon(category)}
                {categoryNames[category as keyof typeof categoryNames]}
                <Badge className="ml-auto bg-secondary/20 text-secondary border-secondary/30">
                  {categoryBadges.filter(b => b.isUnlocked).length}/{categoryBadges.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
                {categoryBadges.map((badge) => {
                  const Icon = getIconComponent(badge.icon)
                  
                  return (
                    <div
                      key={badge.id}
                      className={`
                        p-4 rounded-xl border transition-all duration-200
                        ${badge.isUnlocked 
                          ? 'bg-white/5 border-white/20 hover:bg-white/10' 
                          : 'bg-black/20 border-white/5 opacity-60'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          p-2 rounded-lg
                          ${badge.isUnlocked 
                            ? 'bg-secondary/20 text-secondary' 
                            : 'bg-white/10 text-white/40'
                          }
                        `}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold truncate ${
                              badge.isUnlocked ? 'text-white' : 'text-white/60'
                            }`}>
                              {badge.title}
                            </h3>
                            <Badge className={`text-xs ${getDifficultyColor(badge.difficulty)}`}>
                              {badge.difficulty}
                            </Badge>
                          </div>
                          
                          <p className={`text-sm mb-2 ${
                            badge.isUnlocked ? 'text-white/70' : 'text-white/40'
                          }`}>
                            {badge.description}
                          </p>
                          
                          <p className={`text-xs ${
                            badge.isUnlocked ? 'text-secondary' : 'text-white/40'
                          }`}>
                            {badge.isUnlocked ? 'Unlocked!' : `Target: ${badge.requirement}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Achievement Tips */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-fredoka flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            Achievement Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/70">
            <div>
              <h4 className="text-white font-semibold mb-2">Quick Wins</h4>
              <ul className="space-y-1 text-sm">
                <li>• Complete your first puzzle to unlock "First Steps"</li>
                <li>• Play daily for 7 days to earn "Daily Player"</li>
                <li>• Get a perfect score on any puzzle</li>
                <li>• Try different puzzle types to unlock specialist badges</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Long-term Goals</h4>
              <ul className="space-y-1 text-sm">
                <li>• Complete 25+ puzzles for major milestone badges</li>
                <li>• Earn ₦100,000+ for significant earning badges</li>
                <li>• Reach top 50 on leaderboards for competitive badges</li>
                <li>• Maintain winning streaks for performance badges</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}