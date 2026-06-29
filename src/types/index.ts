export interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  fullName: string;
  email: string;
  leaderboardPosition?: number | null;
  avatar?: string;
  userType: "gamer" | "brand";
  isVerified: boolean;
  companyName?: string;
  createdAt: string;
  accessToken: string;
  refreshToken: string;
}

export interface GamerProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  username: string;
  email: string;
  role: "gamer";
  isVerified: boolean;
  leaderboardPosition: number | null;
  analytics: {
    lifetime: {
      puzzlesSolved: number;
      totalPoints: number;
      totalEarnings: number;
      totalTime: number;
      totalMoves: number;
      attempts: number;
      successRate: number;
      leaderboardPosition: number;
    };
    weekly: {
      puzzlesSolved: number;
      totalPoints: number;
      totalEarnings: number;
      totalTime: number;
      totalMoves: number;
      attempts: number;
      successRate: number;
      leaderboardPosition: number;
    };
  };
  puzzlesSolved: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfileData {
  _id: string;
  name: string;
  email: string;
  role: "brand";
  companyName: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  brandDetails: {
    companyEmail: string;
    companyName: string;
    verified: boolean;
    totalCampaigns: number;
  };
}

// Campaign-related types
export interface CampaignQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  _id: string;
}

export interface CampaignData {
  _id: string;
  brandId: string;
  brandName: string;
  gameType:
    | "sliding_puzzle"
    | "word_hunt"
    | "card_matching"
    | "spot_the_difference";
  title: string;
  description: string;
  puzzleImageUrl?: string;
  originalImageUrl?: string;
  cardImages?: string[];
  timeLimit: number; // in hours
  questions: CampaignQuestion[];
  passage?: string;
  words: string[];
  createdAt: string;
  endDate: string;
  brandUrl: string;
  campaignUrl: string;
  packageId: string;
  packageName: string;
  status: string;
  budgetRemaining: number;
  budgetUsed: number;
  paymentStatus: "paid" | "unpaid";
}

export interface CampaignsResponse {
  success: boolean;
  campaigns: CampaignData[];
}

export interface CampaignResponse {
  success: boolean;
  campaign: CampaignData;
}

// Leaderboard-related types
export interface LeaderboardEntries {
  userId: string;
  puzzlesSolved: number;
  points: number;
  amountEarned: number;
  avatar: string;
  fullName: string;
  username: string;
  position: number;
}

export interface LeaderboardData {
  type: string;
  weekStart: string;
  weekEnd: string;
  totalPlayers: number;
  entries: LeaderboardEntries[];
}

export interface LeaderboardResponse {
  success: true;
  leaderboard: LeaderboardData;
}

// Puzzle-related types
export interface Puzzle {
  _id: string;
  campaignId: string;
  title: string;
  description: string;
  type: "trivia" | "word-puzzle" | "image-puzzle" | "memory-game" | "quiz";
  difficulty: "easy" | "medium" | "hard";
  rewardAmount: number;
  maxAttempts: number;
  timeLimit?: number; // in seconds
  questions?: PuzzleQuestion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PuzzleQuestion {
  _id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "text-input";
  options?: string[];
  correctAnswer: string | number;
  points: number;
}

export interface PuzzlesResponse {
  success: boolean;
  puzzles: Puzzle[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalItems: number;
  };
}

// User Progress and Earnings
export interface UserProgress {
  _id: string;
  userId: string;
  puzzleId: string;
  campaignId: string;
  status: "in-progress" | "completed" | "failed";
  score: number;
  timeSpent: number;
  attemptsUsed: number;
  earnedAmount: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProgressResponse {
  success: boolean;
  progress: UserProgress[];
  totalEarnings: number;
  totalPuzzlesCompleted: number;
}

// Earnings and Payments
export interface Earning {
  _id: string;
  userId: string;
  campaignId: string;
  puzzleId: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export interface EarningsResponse {
  success: boolean;
  earnings: Earning[];
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

// Brand Analytics Types
export interface CampaignAnalytics {
  campaignId: string;
  title: string;
  plays: number;
  completions: number;
  avgCompletionTime: number;
  questionCorrectnessRates: number[];
}

export interface BrandAnalyticsData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudgetUsed: number;
  totalGamesPlayed: number;
  uniquePlayers: number;
  avgPlayTime: number;
  campaigns: CampaignAnalytics[];
}

export interface BrandAnalyticsResponse {
  success: boolean;
  analytics: BrandAnalyticsData;
}

// Generic Response Types
export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: UserData;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: UserData;
}

// Badge System Types
export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category:
    | "milestone"
    | "earnings"
    | "specialist"
    | "performance"
    | "competitive"
    | "special";
  difficulty: "bronze" | "silver" | "gold" | "platinum";
  requirement: number | string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export interface BadgeProgress {
  badgeId: string;
  currentProgress: number;
  targetProgress: number;
  percentage: number;
}

export interface UserBadges {
  badges: Badge[];
  progress: BadgeProgress[];
  totalUnlocked: number;
  totalAvailable: number;
}

// Package Types
export interface Package {
  _id: string;
  name: string;
  amount: number;
  priority: number;
  description: string;
}

export interface PackagesResponse {
  success: boolean;
  packages: Package[];
}

// Prize Table Types
export interface PrizeTableEntry {
  position: number;
  percentage: number;
  amount: number;
}

export interface PrizeTableData {
  date: string;
  activeCampaignsCount: number;
  totalDailyPool: number;
  gamerShare: number;
  platformFee: number;
  prizeTable: PrizeTableEntry[];
  campaignBreakdown: any[]; // Can be refined when structure is known
}

export interface PrizeTableResponse {
  success: boolean;
  prizeTable: PrizeTableData;
}

// --- Monthly leaderboard & referral types (backend refactor)
export interface LeaderboardEntry {
  position: number;
  userId: string;
  fullName: string;
  username?: string;
  avatar?: string;
  points: number;
  puzzlesSolved: number;
  avgTime?: number | null;
  prizeAmount?: number | null;
}

export interface MonthlyLeaderboardResponse {
  success: true;
  leaderboard: {
    type: string;
    monthKey: string;
    totalPlayers: number;
    entries: LeaderboardEntry[];
    jackpot?: { amount: number; note: string };
  };
}

export interface ReferralAnalytics {
  monthKey: string;
  successfulCount: number;
  pointsEarned: number;
  leaderboardPosition: number | null;
}

export interface UserMeResponse {
  profile: {
    username: string;
    analytics: {
      referral: ReferralAnalytics;
    };
  };
}

export interface ReferralSummaryRow {
  rank: number;
  user: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
  };
  successfulCount: number;
  referredUserIds: string[];
}

export interface ReferralSummaryResponse {
  success: true;
  month: string;
  summary: ReferralSummaryRow[];
}

export interface ReferralEvent {
  _id: string;
  type: "signup" | "first_puzzle" | string;
  referredUser?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface ReferralEventsResponse {
  success: true;
  events: ReferralEvent[];
}

export interface ReferralLinkResponse {
  success?: boolean;
  referralLink: string;
}

// Puzzle campaign and submit types for new game behaviour
export type GameType =
  | "spot_the_difference"
  | "card_matching"
  | "sliding_puzzle"
  | "word_hunt";

export interface PuzzleCampaign {
  _id: string;
  brandId?: string;
  gameType: GameType;
  title?: string;
  description?: string;
  puzzleImageUrl?: string;
  originalImageUrl?: string;
  cardImages?: string[];
  timeLimit?: number;
  questions?: { question: string; choices: string[]; correctIndex: number }[];
}

export interface PuzzleSubmitRequest {
  timeTaken: number;
  movesTaken?: number;
  solved: boolean;
  answers?: number[];
  differencesFound?: { x: number; y: number; width: number; height: number }[];
}

export interface PuzzleSubmitResponse {
  success: true;
  attempt: any;
  gameType: GameType;
}
