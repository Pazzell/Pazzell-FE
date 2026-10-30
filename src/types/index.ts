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
  avatar?: string | null;
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
  } | null;
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
  timer: { minSeconds: number; maxSeconds: number; defaultSeconds: number };
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
  cardMix?: CardMix;
}

export interface TriviaTopicsResponse {
  success: boolean;
  topics: TriviaTopic[];
}

export type AnswerOutcome = "correct" | "wrong" | "timeout";
export type TriviaSourceType = "topic" | "custom" | "campaign";
export type TriviaSessionStatus = "quiz" | "completed" | "abandoned";

export interface CampaignBrand {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  brandName: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  ctaText?: string | null;
  /** Seconds per question for this campaign, set by the brand; 0 means no countdown. */
  timerSeconds?: number;
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
  /** Seconds per question for this campaign, set by the brand; 0 means no countdown. */
  timerSeconds?: number;
  endsAt: string;
}

/** How many cards of each kind a source has, and the picture share used when none is chosen. */
export interface CardMix {
  imageCards: number;
  definitionCards: number;
  defaultImagePercent: number;
}

export interface TriviaSession {
  id: string;
  status: TriviaSessionStatus;
  source: { type: TriviaSourceType; id: string; title: string };
  isPreview: boolean;
  /** Practice mode: every question arrives with its correct option identified. */
  practice: boolean;
  /** The session whose practised cards this one replays; null for a fresh card set. */
  replayOf?: string | null;
  timerSeconds: number;
  cardCount: number;
  /** The picture share the player chose; null when they left it to the default. */
  imagePercent?: number | null;
  currentIndex: number;
  brand: CampaignBrand | null;
  startedAt: string;
  completedAt: string | null;
}

export interface TriviaSessionResponse {
  success: boolean;
  resumed: boolean;
  session: TriviaSession;
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
  attribution?: string | null;
  options: TriviaQuestionOption[];
  /** The `index` of the right option. Sent only in practice mode; absent otherwise. */
  correctOptionIndex?: number;
  /** 0 means no countdown: `deadlineAt` and `remainingMs` are null and the player moves on with Next. */
  timerSeconds: number;
  servedAt: string;
  deadlineAt: string | null;
  remainingMs: number | null;
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
  /** 2 options (General Trivia, campaigns) or 4 (custom quizzes). */
  options: string[];
  correctOptionIndex: number;
  attribution?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TriviaCardInput {
  type: "image" | "definition";
  text?: string;
  imageUrl?: string;
  /** 2 options (General Trivia, campaigns) or 4 (custom quizzes). */
  options: string[];
  correctOptionIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Custom trivia (owner-created quizzes shared by link)
// ─────────────────────────────────────────────────────────────────────────

export type CustomQuizStatus = "draft" | "live" | "unpublished" | "locked";

/** "broadcast": shared with a link and played alone. "team": hosted as a team game. */
export type CustomQuizMode = "broadcast" | "team";

/** manual: a quiz for others (broadcast or team). ai: AI generated trivia. personal: the owner's own. */
export type CustomQuizOrigin = "manual" | "ai" | "personal";

export interface CustomQuiz {
  id: string;
  title: string;
  mode: CustomQuizMode;
  origin: CustomQuizOrigin;
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
  cardMix?: CardMix;
}

/** A card written from an uploaded document, waiting for the owner's review. */
export interface DraftTriviaCard {
  type: "definition";
  text: string;
  /** 2 options (General Trivia, campaigns) or 4 (custom quizzes). */
  options: string[];
  correctOptionIndex: number;
  /** The sentence in the document that supports the answer. Not saved with the card. */
  quote: string;
}

export interface GenerateAllowance {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  resetsAt: string;
}

export interface GenerateInfoResponse {
  success: boolean;
  generate: GenerateAllowance & {
    enabled: boolean;
    fileTypes: string[];
    maxFileBytes: number;
    minCharacters: number;
    count: { default: number; min: number; max: number };
    /** Writing the cards from a description instead of a document. */
    prompt: { maxLength: number; count: { default: number; min: number; max: number } };
  };
}

export interface GenerateCardsResponse {
  success: boolean;
  suggestedTitle: string | null;
  requested: number;
  cards: DraftTriviaCard[];
  /** The description the cards were written for, or null when they came from a document. */
  prompt: string | null;
  document: { name: string | null; kind: "pdf" | "docx" | "text"; characters: number; sampled: boolean } | null;
  usage: GenerateAllowance;
}

// ─────────────────────────────────────────────────────────────────────────
// AI generated trivia (a Pro player's own questions, from a topic and a prompt)
// ─────────────────────────────────────────────────────────────────────────

/** Whether an admin has added the set's cards to General Trivia. */
export type AiReviewStatus = "pending" | "approved" | "rejected";

export interface AiTrivia {
  id: string;
  title: string;
  /** `id` is set when the topic is one of the General Trivia topics. */
  topic: { id: string | null; name: string | null };
  prompt: string | null;
  reviewStatus: AiReviewStatus;
  inGeneralTrivia: boolean;
  cardCount: number;
  cardCountBounds: { available: number; min: number; max: number };
  defaultTimerSeconds: number;
  defaultCardCount: number;
  createdAt: string;
}

export interface AiTriviaOptionsResponse {
  success: boolean;
  options: GenerateAllowance & {
    enabled: boolean;
    isPro: boolean;
    pro: { amount: number; currency: string; durationDays: number } | null;
    topics: { id: string; name: string }[];
    topicMaxLength: number;
    promptMaxLength: number;
    count: { default: number; min: number; max: number };
  };
}

export interface AiTriviasResponse {
  success: boolean;
  trivias: AiTrivia[];
}

export interface AiTriviaResponse {
  success: boolean;
  trivia: AiTrivia;
}

export interface CreateAiTriviaResponse extends AiTriviaResponse {
  requested: number;
  usage: GenerateAllowance;
}

/** An AI generated trivia as the admin reviewing it sees it. */
export interface AdminAiTrivia {
  id: string;
  title: string;
  topic: { id: string | null; name: string | null };
  prompt: string | null;
  reviewStatus: AiReviewStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  publishedTopicId: string | null;
  publishedCardCount: number | null;
  cardCount: number;
  owner: { id: string; name: string | null };
  createdAt: string;
}

export interface AdminAiTriviasResponse {
  success: boolean;
  trivias: AdminAiTrivia[];
}

export interface AdminAiTriviaResponse {
  success: boolean;
  trivia: AdminAiTrivia;
  cards: TriviaCard[];
}

export interface AdminAiTriviaApproveResponse {
  success: boolean;
  trivia: AdminAiTrivia;
  topic: AdminTriviaTopic;
  added: number;
  skipped: number;
}

/** Admins write cards for a topic with no daily allowance, so none is reported. */
export interface AdminGenerateInfoResponse {
  success: boolean;
  generate: Omit<GenerateInfoResponse["generate"], keyof GenerateAllowance>;
}

export type AdminGenerateCardsResponse = Omit<GenerateCardsResponse, "usage">;

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
    cardMix?: CardMix;
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
  /** Seconds per question for every player, 0 to 15; 0 means no countdown. */
  timerSeconds: number;
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
  /** Share of picture cards in a session; null uses the global setting. */
  imagePercent?: number | null;
}

export interface ImportCategory {
  key: string;
  topicName: string;
  topicSlug: string;
  /** People categories can be narrowed to a country. */
  supportsCountry: boolean;
}

export interface ImportCategoriesResponse {
  success: boolean;
  categories: ImportCategory[];
  /** "mixed", "worldwide", then the countries that can be picked. */
  countries: string[];
  maxCount: number;
}

export interface ImportCardsResult {
  category: string;
  topic: { id: string; name: string; slug: string };
  requested: number;
  created: number;
  skipped: { unusableLicense: number; imageFailed: number; noWrongOption: number };
}

export interface ImportCardsResponse {
  success: boolean;
  import: ImportCardsResult;
}

/** A built-in topic whose text questions can be loaded from the admin shell. */
export interface StarterTopic {
  slug: string;
  name: string;
  description: string;
  /** null until the topic exists. */
  topicId: string | null;
  total: number;
  /** How many of the built-in questions the topic doesn't have yet. */
  missing: number;
}

export interface StarterTopicsResponse {
  success: boolean;
  topics: StarterTopic[];
}

export interface StarterLoadResult {
  created: number;
  topics: { slug: string; name: string; topicId: string; topicCreated: boolean; created: number }[];
}

export interface StarterLoadResponse {
  success: boolean;
  loaded: StarterLoadResult;
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

// Team games: a custom quiz played as tic-tac-toe between teams (see /team/:code)
export type TeamGameStatus = "lobby" | "playing" | "finished" | "cancelled";
export type TeamGameEndReason = "line" | "board_full" | "host_ended";
export type TeamPlayOutcome = "correct" | "wrong" | "timeout";

export interface TeamGamePerson {
  userId: string;
  name: string;
  avatar: string | null;
}

export interface TeamGameTeam {
  id: string;
  name: string;
  color: string;
  leaderId: string | null;
  score: number;
  members: TeamGamePerson[];
}

export interface TeamGameCell {
  index: number;
  number: number;
  owner: string | null;
}

export interface TeamGameBoard {
  size: number;
  lineLength: number;
  cells: TeamGameCell[];
}

/** quiz: a host's own team quiz, run by a host who doesn't play. topic: self-serve, from a General Trivia topic. */
export type TeamGameKind = "quiz" | "topic";

export interface TeamGameState {
  code: string;
  status: TeamGameStatus;
  kind?: TeamGameKind;
  quiz: { id: string | null; title: string; coverImageUrl: string | null };
  topic?: { id: string; name: string } | null;
  host: TeamGamePerson;
  timerSeconds: number;
  board: TeamGameBoard;
  teams: TeamGameTeam[];
  unassigned: TeamGamePerson[];
  turnTeamId: string | null;
  current: {
    cellIndex: number;
    number: number;
    teamId: string;
    servedAt: string;
    deadlineAt: string;
    timerSeconds: number;
    question: {
      type: "image" | "definition";
      imageUrl: string | null;
      text: string | null;
      attribution: string | null;
      options: { index: number; text: string }[];
    };
  } | null;
  lastPlay: {
    cellIndex: number;
    number: number;
    teamId: string;
    outcome: TeamPlayOutcome;
    optionIndex: number | null;
    correctOptionIndex: number;
    at: string;
  } | null;
  playCount: number;
  winnerTeamId: string | null;
  winningLine: number[] | null;
  isDraw: boolean;
  endReason: TeamGameEndReason | null;
  startedAt: string | null;
  finishedAt: string | null;
  joinUrl: string;
  resultUrl: string | null;
  serverTime: string;
}

export interface TeamGameResponse {
  success: boolean;
  game: TeamGameState;
}

export interface TeamGameMessage {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  text: string;
  createdAt: string;
}

export interface TeamGameMessagesResponse {
  success: boolean;
  teamId: string;
  messages: TeamGameMessage[];
}

export interface TeamGameResultTeam {
  id: string;
  name: string;
  color: string;
  score: number;
  cellsClaimed: number;
  questionsAnswered: number;
  correctAnswers: number;
  leaderName: string | null;
  members: { name: string; avatar: string | null; isLeader: boolean }[];
  isWinner: boolean;
}

export interface TeamGameResult {
  code: string;
  quiz: { title: string; coverImageUrl: string | null };
  host: { name: string; avatar: string | null };
  endReason: TeamGameEndReason | null;
  isDraw: boolean;
  winnerTeamId: string | null;
  board: TeamGameBoard;
  winningLine: number[] | null;
  teams: TeamGameResultTeam[];
  questionsPlayed: number;
  startedAt: string | null;
  finishedAt: string | null;
  resultUrl: string;
}

export interface TeamGameResultResponse {
  success: boolean;
  result: TeamGameResult;
}
