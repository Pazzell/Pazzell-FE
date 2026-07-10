export const routes = {
  // Public Routes
  HOME: "/",
  REGISTER: "/register",
  LOGIN: "/login",
  ABOUT: "/about",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_OTP: "/verify-otp",
  PRICING: "/pricing",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  CONTACT: "/contact",
  HOW_IT_WORKS: "/how-it-works",
  LEADERBOARD: "/leaderboard",
  CAMPAIGNS: "/campaigns",
  PUZZLE_DEMO: "/puzzle-demo",
  PAYMENT_VERIFY: "/payment/verify",

  // Puzzle Routes
  PUZZLE: {
    SLIDING_PUZZLE: "/user/puzzle/sliding-puzzle",
    WORD_HUNT: "/user/puzzle/word-hunt",
    CARD_MATCHING: "/user/puzzle/card-matching",
    SPOT_THE_DIFFERENCE: "/user/puzzle/spot-the-difference",
  },

  // User Routes
  USER: {
    DASHBOARD: "/user/dashboard",
    PROFILE: "/user/profile",
    SETTINGS: "/user/settings",
    PUZZLES: "/user/puzzles",
    PUZZLE_PLAY: (id: string) => `/user/puzzles/${id}`,
    EARNINGS: "/user/earnings",
    LEADERBOARD: "/user/leaderboard",
    BADGES: "/user/badges",
    REFERRALS: "/user/referrals",
    // v2 (multi-game) campaign session play flow
    CAMPAIGN_PLAY: (id: string) => `/user/campaigns/${id}/play`,
    WALLET: "/user/wallet",
    FORUM: "/user/forum",
    FORUM_THREAD: (id: string) => `/user/forum/${id}`,
    RAFFLES: "/user/raffles",
  },

  // Brand Routes
  BRAND: {
    DASHBOARD: "/brand/dashboard",
    CAMPAIGNS: "/brand/campaigns",
    CAMPAIGNS_NEW: "/brand/campaigns/new",
    // v2 (multi-game) campaign creation wizard — new campaigns only go
    // through this flow now (POST /brands/campaigns changed shape).
    // CAMPAIGNS_NEW / its ?edit= mode stays for legacy schemaVersion:1 campaigns.
    CAMPAIGNS_CREATE: "/brand/campaigns/create",
    CAMPAIGN_DETAILS: (id: string) => `/brand/campaigns/${id}`,
    CAMPAIGN_EDIT: (id: string) => `/brand/campaigns/${id}/edit`,
    PUZZLES: "/brand/puzzles",
    PUZZLES_NEW: "/brand/puzzles/new",
    PUZZLE_EDIT: (id: string) => `/brand/puzzles/${id}/edit`,
    ANALYTICS: "/brand/analytics",
    BILLING: "/brand/billing",
    SETTINGS: "/brand/settings",
  },
};
