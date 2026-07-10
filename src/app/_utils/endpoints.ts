export const ENDPOINTS = {
  // Authentication
  LOGIN: "/auth/login",
  REGISTER_GAMER: "/auth/gamer/register",
  REGISTER_BRAND: "/auth/brand/register",
  GOOGLE_AUTH: "/auth/google",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  ACTIVATE_USER: "/auth/user/activate",
  GAMER_PROFILE: "/profile/gamer",
  BRAND_PROFILE: "/profile/brand",
  UPDATE_PROFILE: "/profile/gamer",
  UPLOAD_PROFILE_IMAGE: "/profile/image",

  // Campaign endpoints
  CAMPAIGNS: "/campaigns",
  CREATE_CAMPAIGN: "/brands/campaigns",
  CAMPAIGN_DETAILS: (id: string) => `/campaigns/${id}`,
  UPDATE_CAMPAIGN: (id: string) => `/campaigns/${id}`,
  DELETE_CAMPAIGN: (id: string) => `/campaigns/${id}`,
  BRAND_CAMPAIGNS: "/campaigns/my-campaigns",
  BRAND_CAMPAIGNS_BY_ID: (brandId: string) => `/campaigns/brand/${brandId}`,
  SUBMIT_CAMPAIGN: (id: string) => `/campaigns/${id}/submit`,
  CAMPAIGN_COMPLETION: (id: string) => `/campaigns/${id}/completion`,

  // Leaderboard endpoints — monthly removed by the backend (weekly-system
  // migration); see WEEKLY_LEADERBOARD_BY_WEEK / ALL_TIME_LEADERBOARD below.
  WEEKLY_LEADERBOARD: "/leaderboards/weekly",

  // Rewards / Payouts
  REWARDS_PAYOUTS: "/rewards/payouts",

  // Referrals
  REFERRALS_SUMMARY: "/referrals/summary",
  REFERRALS_EVENTS: "/referrals/events",
  REFERRALS_MY_STATS: (month?: string) =>
    month ? `/referrals/my-stats?month=${month}` : `/referrals/my-stats`,

  // Authenticated user profile (includes referral analytics)
  USER_ME: "/user/me",

  // Admin
  ADMIN_REWARDS_FINALIZE: "/admin/rewards/finalize",
  ADMIN_REWARDS_PAYOUT_APPROVE: (payoutId: string) =>
    `/admin/rewards/payouts/${payoutId}/approve`,
  ADMIN_RAFFLES: "/admin/raffles",

  // Puzzle endpoints
  PUZZLES: "/puzzles",
  CREATE_PUZZLE: "/puzzles",
  PUZZLE_DETAILS: (id: string) => `/puzzles/${id}`,
  UPDATE_PUZZLE: (id: string) => `/puzzles/${id}`,
  DELETE_PUZZLE: (id: string) => `/puzzles/${id}`,
  CAMPAIGN_PUZZLES: (campaignId: string) => `/campaigns/${campaignId}/puzzles`,
  AVAILABLE_PUZZLES: "/puzzles/available",
  PLAY_PUZZLE: (id: string) => `/puzzles/${id}/play`,
  SUBMIT_PUZZLE_ANSWER: (id: string) => `/puzzles/${id}/submit`,

  // User Progress and Earnings
  USER_PROGRESS: "/progress",
  USER_EARNINGS: "/earnings",
  USER_STATS: "/users/stats",
  LEADERBOARD: "/leaderboard",

  // Analytics
  CAMPAIGN_ANALYTICS: (campaignId: string) =>
    `/analytics/campaigns/${campaignId}`,
  BRAND_ANALYTICS: "/brands/analytics",
  APP_ANALYTICS: "/analytics/app",

  // User settings
  CHANGE_PASSWORD: "/profile/change-password",
  UPDATE_NOTIFICATIONS: "/profile/notifications",
  UPDATE_PRIVACY: "/profile/privacy",
  DELETE_ACCOUNT: "/profile/account",

  // AI
  GENERATE_QUESTIONS: "/campaigns/generate-questions",

  // Packages
  PACKAGES: "/packages",

  // Payment
  DAILY_PRIZE_TABLE: "/prize-table/today",
  INITIALIZE_PAYMENT: "/payments/initialize",
  VERIFY_PAYMENT: "/payments/verify",
  CALCULATE_WEEKLY_PRICE: (packageType: string, weeks: number) =>
    `/payments/calculate-weekly-price?packageType=${packageType}&weeks=${weeks}`,

  // Gameplay sessions (v2 / multi-game campaigns only)
  SESSION_START: "/sessions/start",
  SESSION_GAME_START: (sessionId: string, gameType: string) =>
    `/sessions/${sessionId}/games/${gameType}/start`,
  SESSION_GAME_COMPLETE: (sessionId: string, gameType: string) =>
    `/sessions/${sessionId}/games/${gameType}/complete`,
  SESSION_VIDEO_START: (sessionId: string) =>
    `/sessions/${sessionId}/video/start`,
  SESSION_VIDEO_COMPLETE: (sessionId: string) =>
    `/sessions/${sessionId}/video/complete`,
  SESSION_QUIZ_ATTEMPT: (sessionId: string) =>
    `/sessions/${sessionId}/quiz/attempt`,
  SESSION_COMPLETE: (sessionId: string) => `/sessions/${sessionId}/complete`,

  // Leaderboard — weekly-only additions (WEEKLY_LEADERBOARD already above)
  WEEKLY_LEADERBOARD_BY_WEEK: (weekKey: string) =>
    `/leaderboards/weekly/${weekKey}`,
  ALL_TIME_LEADERBOARD: "/leaderboards/all-time",

  // Wallet & withdrawals
  WALLET_BALANCE: "/wallet/balance",
  WALLET_TRANSACTIONS: (limit: number = 50) =>
    `/wallet/transactions?limit=${limit}`,
  WALLET_BANK_ACCOUNTS: "/wallet/bank-accounts",
  WALLET_BANK_ACCOUNT_DELETE: (id: string) => `/wallet/bank-accounts/${id}`,
  WALLET_WITHDRAWALS: "/wallet/withdrawals",
  WALLET_WITHDRAWAL_DETAILS: (id: string) => `/wallet/withdrawals/${id}`,

  // Raffles
  RAFFLE_CAMPAIGN_CURRENT: (campaignId: string) =>
    `/raffles/campaign/${campaignId}/current`,
  RAFFLE_MY_TICKETS: "/raffles/my-tickets",
  RAFFLE_DRAW: (campaignId: string) => `/raffles/${campaignId}/draw`,
  RAFFLE_FULFILLMENT: (drawId: string) => `/raffles/${drawId}/fulfillment`,
  RAFFLE_VERIFY: (drawId: string) => `/raffles/${drawId}/verify`,

  // Admin config
  ADMIN_CONFIG: "/admin/config",
  ADMIN_CONFIG_KEY: (key: string) => `/admin/config/${key}`,

  // Forum
  FORUM_THREADS: "/forum/threads",
  FORUM_THREAD_POSTS: (threadId: string) => `/forum/threads/${threadId}/posts`,
  FORUM_POST_LIKE: (postId: string) => `/forum/posts/${postId}/like`,
  FORUM_POST_FLAG: (postId: string) => `/forum/posts/${postId}/flag`,
  FORUM_MODERATION_FLAGS: "/forum/moderation/flags",
  FORUM_MODERATION_FLAG_DETAILS: (flagId: string) =>
    `/forum/moderation/flags/${flagId}`,
  FORUM_WINNER_SUBMISSIONS: "/forum/winner-submissions",
  FORUM_WINNER_SUBMISSIONS_MINE: "/forum/winner-submissions/mine",
  FORUM_WINNER_SUBMISSION_VERIFY: (id: string) =>
    `/forum/winner-submissions/${id}/verify`,
  FORUM_WINNER_SUBMISSION_REJECT: (id: string) =>
    `/forum/winner-submissions/${id}/reject`,
};
