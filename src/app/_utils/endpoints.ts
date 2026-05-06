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

  // Leaderboard endpoints
  WEEKLY_LEADERBOARD: "/leaderboards/weekly",
  MONTHLY_LEADERBOARD: "/leaderboards/monthly",
  MONTHLY_LEADERBOARD_BY_MONTH: (month: string) =>
    `/leaderboards/monthly/${month}`,

  // Rewards / Payouts
  REWARDS_PAYOUTS: "/rewards/payouts",

  // Referrals
  REFERRALS_SUMMARY: "/referrals/summary",
  REFERRALS_EVENTS: "/referrals/events",
  USER_REFERRAL_LINK: "/users/me/referral-link",

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

  // Packages
  PACKAGES: "/packages",

  // Payment
  DAILY_PRIZE_TABLE: "/prize-table/today",
  INITIALIZE_PAYMENT: "/payments/initialize",
  VERIFY_PAYMENT: "/payments/verify",
};
