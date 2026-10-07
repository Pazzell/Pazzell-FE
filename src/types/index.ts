// ─────────────────────────────────────────────────────────────────────────
// Core user/auth types
// ─────────────────────────────────────────────────────────────────────────

export interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  fullName: string;
  email: string;
  avatar?: string;
  userType: "gamer" | "brand" | "admin";
  isVerified: boolean;
  companyName?: string;
  createdAt: string;
  accessToken: string;
  refreshToken: string;
}

export interface Plan {
  tier: "freemium" | "pro";
  isPro: boolean;
  proUntil: string | null;
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
  plan?: Plan;
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
    companyName: string;
    logoUrl?: string | null;
    websiteUrl?: string | null;
    verified: boolean;
    totalCampaigns: number;
  };
}

export interface MeResponse {
  success: boolean;
  user: UserData & {
    proUntil: string | null;
    nonCampaignPlaysSinceCampaign: number;
  };
  plan: Plan;
}

// ─────────────────────────────────────────────────────────────────────────
// Generic response/error types
// ─────────────────────────────────────────────────────────────────────────

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: UserData;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  success: boolean;
  activationToken: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Global settings (GET /settings/game)
// ─────────────────────────────────────────────────────────────────────────

export interface GameSettings {
  timer: { minSeconds: number; maxSeconds: number; matchDefaultSeconds: number };
  trivia: { minCards: number; maxCards: number };
  customQuiz: { freeLimit: number; minCardsToPublish: number };
  pro: { amount: number; currency: string; durationDays: number };
  campaign: {
    amount: number;
    currency: string;
    durationDays: number;
    interruptionThreshold: number;
  };
}

export interface GameSettingsResponse {
  success: boolean;
  settings: GameSettings;
}

// ─────────────────────────────────────────────────────────────────────────
// Plans, Pro and payments
// ─────────────────────────────────────────────────────────────────────────

export interface PlanMeResponse {
  success: boolean;
  plan: Plan;
  pricing: { amount: number; currency: string; durationDays: number };
  campaignGate: {
    required: boolean;
    counter: number;
    threshold: number;
    campaign: CampaignGateDetails | null;
  };
  history: { paidAt: string; startsAt: string; endsAt: string; paymentId: string }[];
}

export type PaymentPurpose = "pro" | "campaign";
export type PaymentStatus = "pending" | "success" | "failed";

export interface Payment {
  id: string;
  purpose: PaymentPurpose;
  campaignId?: string | null;
  amount: number;
  currency: string;
  durationDays: number;
  reference: string;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt?: string;
}

export interface CheckoutResponse {
  success: boolean;
  checkout: { authorizationUrl: string; reference: string; payment: Payment };
  campaign?: { id: string; status: CampaignStatus };
}

export interface VerifyPaymentResponse {
  success: boolean;
  payment: Payment;
  plan: Plan;
  campaign: { id: string; status: CampaignStatus; startsAt: string; endsAt: string } | null;
}

export interface PaymentsMineResponse {
  success: boolean;
  payments: Payment[];
}

// ─────────────────────────────────────────────────────────────────────────
// Match
// ─────────────────────────────────────────────────────────────────────────

export interface MatchArtifact {
  id: string;
  category: "shape" | "color" | "letter" | "number" | "dots" | "figure";
  name: string;
  attributes: Record<string, unknown>;
  svg?: string;
}

export type MatchSimilarity = "low" | "medium" | "high";
export type MatchVariant = "rotation" | "mirror";
export type MatchCategoryPool =
  | "shapes"
  | "colors"
  | "letters_upper"
  | "letters_lower"
  | "numbers"
  | "figures"
  | "colored_shapes";

export interface MatchLevelConfig {
  level: number;
  order?: number;
  name?: string;
  questionCount: number;
  optionCount: number;
  categories: MatchCategoryPool[];
  similarity?: MatchSimilarity;
  variants?: MatchVariant[];
  dotCountTargets?: boolean;
  isActive?: boolean;
}

export interface MatchLevelStatus extends MatchLevelConfig {
  unlocked: boolean;
  passed: boolean;
  attempts: number;
  best: { correct: number; total: number } | null;
  activeAttemptId: string | null;
}

export interface MatchLevelsResponse {
  success: boolean;
  timer: { minSeconds: number; maxSeconds: number; defaultSeconds: number };
  highestUnlockedLevel: number;
  levels: MatchLevelStatus[];
}

export type MatchAttemptStatus = "in_progress" | "completed" | "abandoned";

export interface MatchAttempt {
  id: string;
  level: number;
  timerSeconds: number;
  status: MatchAttemptStatus;
  questionCount: number;
  currentIndex: number;
  startedAt: string;
  completedAt: string | null;
}

export interface MatchAttemptResponse {
  success: boolean;
  resumed: boolean;
  attempt: MatchAttempt;
}

export interface MatchQuestion {
  index: number;
  total: number;
  target: MatchArtifact;
  options: MatchArtifact[];
  timerSeconds: number;
  servedAt: string;
  deadlineAt: string;
  remainingMs: number;
  serverTime: string;
}

export interface MatchQuestionResponse {
  success: boolean;
  completed: boolean;
  attempt: MatchAttempt;
  question?: MatchQuestion;
  result?: MatchResult;
}

export type AnswerOutcome = "correct" | "wrong" | "timeout";

export interface MatchAnswerResponse {
  success: boolean;
  questionIndex: number;
  outcome: AnswerOutcome;
  correctOptionId: string;
  completed: boolean;
  nextQuestionIndex: number | null;
  result: MatchResult | null;
}

export interface MatchResult {
  attemptId: string;
  level: number;
  correct: number;
  total: number;
  passed: boolean;
  nextLevel: number | null;
  nextLevelUnlocked: boolean;
  completedAt: string;
}

export interface MatchFinishResponse {
  success: boolean;
  result: MatchResult;
}

// ─────────────────────────────────────────────────────────────────────────
// Trivia (topics, custom quizzes, campaigns share this session engine)
// ─────────────────────────────────────────────────────────────────────────

export interface TriviaTopic {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  cardCount: number;
  cardCountBounds: { available: number; min: number; max: number };
}

export interface TriviaTopicsResponse {
  success: boolean;
  topics: TriviaTopic[];
}

export type TriviaSourceType = "topic" | "custom" | "campaign";
export type TriviaSessionStatus = "studying" | "quiz" | "completed" | "abandoned";

export interface CampaignBrand {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  brandName: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  ctaText?: string | null;
  endsAt: string;
}

export interface CampaignGateDetails {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  brandName: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  ctaText?: string | null;
  endsAt: string;
}

export interface TriviaSession {
  id: string;
  status: TriviaSessionStatus;
  source: { type: TriviaSourceType; id: string; title: string };
  isPreview: boolean;
  timerSeconds: number;
  cardCount: number;
  currentIndex: number;
  brand: CampaignBrand | null;
  startedAt: string;
  quizStartedAt: string | null;
  completedAt: string | null;
}

export interface TriviaSessionResponse {
  success: boolean;
  resumed: boolean;
  session: TriviaSession;
}

export interface TriviaCardOption {
  text: string;
  isCorrect: boolean;
}

export interface TriviaStudyCard {
  position: number;
  total: number;
  type: "definition" | "image";
  imageUrl: string | null;
  text: string | null;
  options: TriviaCardOption[];
}

export interface TriviaStudyResponse {
  success: boolean;
  session: TriviaSession;
  cards: TriviaStudyCard[];
}

export interface TriviaQuestionOption {
  index: number;
  text: string;
}

export interface TriviaQuestion {
  index: number;
  total: number;
  type: "definition" | "image";
  imageUrl: string | null;
  text: string | null;
  options: TriviaQuestionOption[];
  timerSeconds: number;
  servedAt: string;
  deadlineAt: string;
  remainingMs: number;
  serverTime: string;
}

export interface TriviaQuestionResponse {
  success: boolean;
  completed: boolean;
  question?: TriviaQuestion;
  result?: TriviaResult;
}

export interface TriviaAnswerResponse {
  success: boolean;
  questionIndex: number;
  outcome: AnswerOutcome;
  correctOptionIndex: number;
  completed: boolean;
  nextQuestionIndex: number | null;
  result: TriviaResult | null;
}

export interface TriviaResult {
  sessionId: string;
  source: { type: TriviaSourceType; id: string; title: string };
  correct: number;
  total: number;
  isPreview: boolean;
  brand: CampaignBrand | null;
  completedAt: string;
  campaignGate?: {
    required: boolean;
    counter: number;
    threshold: number;
    campaign: CampaignGateDetails | null;
  };
}

export interface TriviaResultResponse {
  success: boolean;
  result: TriviaResult;
}

// ─────────────────────────────────────────────────────────────────────────
// Cards (shared shape for topics, custom quizzes and campaigns)
// ─────────────────────────────────────────────────────────────────────────

export interface TriviaCard {
  id: string;
  type: "image" | "definition";
  imageUrl: string | null;
  text: string | null;
  options: [string, string];
  correctOptionIndex: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export interface TriviaCardInput {
  type: "image" | "definition";
  text?: string;
  imageUrl?: string;
  options: [string, string];
  correctOptionIndex: 0 | 1;
}

// ─────────────────────────────────────────────────────────────────────────
// Custom trivia (owner-created quizzes shared by link)
// ─────────────────────────────────────────────────────────────────────────

export type CustomQuizStatus = "draft" | "live" | "unpublished" | "locked";

export interface CustomQuiz {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  status: CustomQuizStatus;
  shareSlug: string | null;
  shareUrl: string | null;
  defaultTimerSeconds: number;
  defaultCardCount: number;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomQuizzesResponse {
  success: boolean;
  quizzes: CustomQuiz[];
  plan: Plan;
  limit: number | null;
}

export interface CustomQuizResponse {
  success: boolean;
  quiz: CustomQuiz;
  cards?: TriviaCard[];
  // Sent with the owner's full view of a quiz (GET /custom-quizzes/:id and /preview).
  minCardsToPublish?: number;
  cardCountBounds?: { available: number; min: number; max: number };
}

export interface CustomQuizStatsResponse {
  success: boolean;
  stats: { plays: number; averageScore: number | null; averageScorePercent: number | null };
}

export interface CustomQuizShareLanding {
  success: boolean;
  requiresAuth: boolean;
  quiz: {
    title: string;
    description: string | null;
    coverImageUrl: string | null;
    creator: { name: string; avatar?: string | null };
  };
}

export interface CustomQuizPlayInfo {
  success: boolean;
  quiz: {
    id: string;
    title: string;
    description: string | null;
    coverImageUrl: string | null;
    defaultTimerSeconds: number;
    defaultCardCount: number;
    cardCountBounds: { available: number; min: number; max: number };
    isOwner: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Brand campaigns
// ─────────────────────────────────────────────────────────────────────────

export type CampaignStatus =
  | "draft"
  | "awaiting_payment"
  | "live"
  | "ended"
  | "paused"
  | "taken_down";

export interface BrandCampaign {
  id: string;
  brandName: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  ctaText: string | null;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  tags: string[];
  status: CampaignStatus;
  startsAt: string | null;
  endsAt: string | null;
  moderationReason: string | null;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandCampaignsResponse {
  success: boolean;
  campaigns: BrandCampaign[];
}

export interface BrandCampaignResponse {
  success: boolean;
  campaign: BrandCampaign;
  cards?: TriviaCard[];
  pricing?: { amount: number; currency: string; durationDays: number };
  minCardsToPublish?: number;
  cardCountBounds?: { available: number; min: number; max: number };
}

export interface BrandCampaignPricingResponse {
  success: boolean;
  pricing: { amount: number; currency: string; durationDays: number };
  minCardsToPublish: number;
}

export interface BrandCampaignDashboardResponse {
  success: boolean;
  campaign: BrandCampaign;
  dashboard: {
    status: CampaignStatus;
    startsAt: string | null;
    endsAt: string | null;
    daysRemaining: number;
    plays: number;
    completions: number;
    averageScore: number | null;
    averageScorePercent: number | null;
    urlClicks: number;
    uniqueUrlClickers: number;
  };
}

export interface CampaignNextResponse {
  success: boolean;
  required: boolean;
  counter: number;
  threshold: number;
  campaign: CampaignGateDetails | null;
}

export interface CampaignByIdResponse {
  success: boolean;
  campaign: CampaignGateDetails;
  cardCountBounds: { available: number; min: number; max: number };
}

// ─────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────

export interface AdminConfigResponse {
  success: boolean;
  config: Record<string, { value: unknown; description?: string }>;
}

export interface AdminTriviaTopic extends TriviaTopic {
  isActive: boolean;
}

export interface AdminTopicsResponse {
  success: boolean;
  topics: AdminTriviaTopic[];
}

/** The admin list view of a campaign: no card count, but who owns and moderated it. */
export type AdminCampaign = Omit<BrandCampaign, "cardCount" | "updatedAt"> & {
  brandId: string;
  urlClicks: number;
};

export interface AdminCampaignsResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  campaigns: AdminCampaign[];
}

export interface AdminRevenueResponse {
  success: boolean;
  range: { from: string | null; to: string | null };
  breakdown: { purpose: PaymentPurpose; currency: string; payments: number; total: number }[];
  totalsByCurrency: Record<string, number>;
  pendingPayments: number;
}

export interface AdminPaymentsResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  // Raw payment records: keyed by `_id` rather than `id`.
  payments: (Omit<Payment, "id"> & { _id: string; userId: string })[];
}

// ─────────────────────────────────────────────────────────────────────────
// Uploads
// ─────────────────────────────────────────────────────────────────────────

export interface UploadImageResponse {
  success: boolean;
  image: { url: string; width: number; height: number; sizeBytes: number };
}

// ─────────────────────────────────────────────────────────────────────────
// Analytics (kept — public app-wide live activity widget)
// ─────────────────────────────────────────────────────────────────────────

export interface AppAnalyticsResponse {
  success: boolean;
  analytics: {
    totalGamesPlayed: number;
    gamesPlayedToday: number;
    currentlyPlaying: number;
    onlineUsers: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Wallet & withdrawals (unchanged)
// ─────────────────────────────────────────────────────────────────────────

export interface WalletBalanceResponse {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter?: number;
  status?: string;
  reason?: string;
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
