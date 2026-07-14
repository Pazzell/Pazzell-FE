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
  points?: {
    monthKey: string;
    puzzlePoints: number;
    referralPoints: number;
    totalPoints: number;
  };
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

// Note: the old monthly leaderboard types (LeaderboardEntry,
// MonthlyLeaderboardResponse, ReferralAnalytics, GamerProfileResponse) were
// removed here — the backend dropped /leaderboards/monthly entirely and
// GET /user/gamer/profile's shape changed. See WeeklyLeaderboardEntry /
// WeeklyLeaderboardResponse / GamerProfileV2Response further below.

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

export interface ReferralMyStatsResponse {
  success: true;
  month: string;
  stats: {
    totalReferrals: number;
    pendingReferrals: number;
    successfulReferralsThisMonth: number;
    referralPointsThisMonth: number;
    totalReferralPointsAllTime: number;
    referredUsersThisMonth: {
      userId: string;
      fullName: string;
      username: string;
      avatar?: string;
      successfulAt: string;
      pointsAwarded: number;
    }[];
  };
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

// ─────────────────────────────────────────────────────────────────────────
// Weekly-system migration v2 types (see API_CONTRACT_WEEKLY_MIGRATION.md)
// Legacy schemaVersion:1 types above (CampaignData, CampaignQuestion, etc.)
// are untouched — old campaigns keep serving from those shapes.
// ─────────────────────────────────────────────────────────────────────────

export interface CampaignCompletionResponse {
  hasCompletedByCurrentUser: boolean;
}

export type CampaignQuestionInput = Omit<CampaignQuestion, "_id">;

// v2 campaigns span all four game types plus a video + quiz stage.
export interface CampaignV2Data {
  _id: string;
  schemaVersion: 2;
  brandId: string;
  brandName: string;
  gameTypes: GameType[];
  title: string;
  description: string;
  puzzleImageUrl?: string;
  videoUrl?: string;
  videoDurationSeconds: number;
  videoSizeBytes: number;
  videoMimeType: string;
  words: string[];
  questions: CampaignQuestion[]; // exactly 3, brand-authored, no AI generation
  prizeDescription: string;
  prizeUnitsAvailable: number;
  createdAt: string;
  endDate: string;
  durationWeeks: number;
  weeklyPrice: number;
  brandUrl?: string;
  campaignUrl?: string;
  packageId: string;
  packageName: string;
  status: "draft" | "active" | "paused" | "completed" | string;
  paymentStatus: "paid" | "unpaid";
}

export type AnyCampaign = CampaignData | CampaignV2Data;

export function isV2Campaign(
  campaign: AnyCampaign
): campaign is CampaignV2Data {
  return Array.isArray((campaign as CampaignV2Data).gameTypes);
}

export interface CampaignV2Response {
  success: boolean;
  campaign: CampaignV2Data;
}

// List endpoints (GET /campaigns, GET /campaigns/my-campaigns, etc.) now
// return a mix of legacy and v2 campaigns in the same array.
export interface AnyCampaignsResponse {
  success: boolean;
  campaigns: AnyCampaign[];
}

export interface WeeklyPriceResponse {
  pricing: {
    packageType: "basic" | "premium";
    weeklyPrice: number;
    durationWeeks: number;
    totalAmount: number;
    timeLimitHours: number;
  };
}

// Gameplay sessions (v2 campaigns only)
export interface GameSession {
  _id: string;
  campaignId: string;
  gameTypes: GameType[];
  status?: string;
}

export interface SessionStartResponse {
  success: boolean;
  session: GameSession;
}

export interface SessionActionResponse {
  success: boolean;
}

export interface SessionQuizAttemptResponse {
  success: boolean;
  score: number;
  allCorrect: boolean;
  attemptsSoFar: number;
  firstAttemptScore: number;
}

export interface SessionCompleteResponse {
  success: true;
  isFirstCompletion: boolean;
  pointsAwarded: number;
  totalCompletionTimeMs: number;
  voided: boolean;
  flagged: boolean;
}

// Weekly leaderboard (replaces monthly, which the backend removed)
export interface WeeklyLeaderboardEntry {
  position: number;
  userId: string;
  fullName: string;
  username?: string;
  avatar?: string;
  puzzlesSolved: number;
  points: number;
  avgCompletionTimeMs: number;
  avgCompletionTimeSec: number;
}

export interface WeeklyLeaderboardResponse {
  success: true;
  leaderboard: {
    type: string;
    weekKey: string;
    totalPlayers: number;
    entries: WeeklyLeaderboardEntry[];
  };
}

// GET /user/gamer/profile — response shape changed: points/referral analytics
// are now weekly-only (monthKey/puzzlePoints/referralPoints fields removed).
export interface GamerProfileV2Response {
  success: true;
  profile: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
    points: {
      weekKey: string;
      totalPoints: number;
    };
    analytics: {
      referral: {
        weekKey: string;
        totalReferrals: number;
        successfulReferrals: number;
        pendingReferrals: number;
        pointsThisWeek: number;
        referralCountThisWeek: number;
      };
    };
  };
}

// Wallet & withdrawals
export interface WalletBalanceResponse {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  _id: string;
  type: string;
  amount: number;
  status?: string;
  description?: string;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  success: boolean;
  transactions: WalletTransaction[];
}

export interface BankAccount {
  _id: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  accountName: string;
  createdAt: string;
}

export interface BankAccountsResponse {
  success: boolean;
  bankAccounts: BankAccount[];
}

export interface CreateBankAccountRequest {
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

export type WithdrawalStatus = "pending" | "processing" | "paid" | "failed";

export interface Withdrawal {
  _id: string;
  bankAccountId: string;
  amount: number;
  status: WithdrawalStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt?: string;
  failureReason?: string;
}

export interface WithdrawalsResponse {
  success: boolean;
  withdrawals: Withdrawal[];
}

export interface CreateWithdrawalRequest {
  bankAccountId: string;
  amount: number;
  idempotencyKey: string;
}

// Raffles
export interface RaffleCampaignCurrentResponse {
  campaignId: string;
  weekKey: string;
  ticketCount: number;
  eligibilityFloor: number;
  drawStatus: "pending" | "drawn" | string;
  // Not explicitly documented in the API contract's "current" shape, but a
  // drawn winner implies a backing draw record — needed to call
  // GET /raffles/:drawId/verify. Treated as best-effort/optional until
  // confirmed; UI code must not assume it's always present.
  drawId?: string;
  winner?: {
    userId: string;
    fullName?: string;
    username?: string;
  } | null;
}

export type RaffleFulfillmentStatus =
  | "pending"
  | "shipped"
  | "delivered"
  | "failed";

export interface UpdateRaffleFulfillmentRequest {
  fulfillmentStatus: RaffleFulfillmentStatus;
  fulfillmentNotes?: string;
}

export interface RaffleTicket {
  campaignId: string;
  campaignTitle?: string;
  weekKey: string;
  ticketCount: number;
}

export interface MyRaffleTicketsResponse {
  success: boolean;
  tickets: RaffleTicket[];
  eligibleThisWeek: boolean;
}

export interface RaffleVerifyResponse {
  drawId: string;
  campaignId: string;
  weekKey: string;
  winner: {
    userId: string;
    fullName?: string;
    username?: string;
  };
  verification: {
    valid: boolean;
    seed?: string;
  };
}

// Admin config — the subset the frontend reads rather than hardcoding
// (see API_CONTRACT_WEEKLY_MIGRATION.md §10). GET /admin/config is
// admin-only; most of these are read via feature-specific fallbacks
// (e.g. weekly pricing via the public calculate-weekly-price endpoint)
// until a public config subset endpoint exists.
export interface AdminConfigResponse {
  success: boolean;
  config: Record<string, { value: unknown; description?: string }>;
}

// Forum
export interface ForumThread {
  _id: string;
  title: string;
  category?: string;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  postCount?: number;
}

export interface ForumThreadsResponse {
  success: boolean;
  threads: ForumThread[];
}

export interface ForumPost {
  _id: string;
  threadId: string;
  body: string;
  imageUrls?: string[];
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  likeCount: number;
  likedByMe?: boolean;
  moderationStatus?: "visible" | "removed";
  createdAt: string;
}

export interface ForumPostsResponse {
  success: boolean;
  posts: ForumPost[];
}

export type WinnerSubmissionStatus = "submitted" | "verified" | "rejected";

export interface WinnerSubmission {
  _id: string;
  campaignId: string;
  postUrl: string;
  claimedLikeCount?: number;
  status: WinnerSubmissionStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface WinnerSubmissionsResponse {
  success: boolean;
  submissions: WinnerSubmission[];
}

export interface CreateWinnerSubmissionRequest {
  campaignId: string;
  postUrl: string;
  claimedLikeCount?: number;
}
