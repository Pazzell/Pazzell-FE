export const routes = {
  // Public
  HOME: "/",
  REGISTER: "/register",
  LOGIN: "/login",
  ABOUT: "/about",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_OTP: "/verify-otp",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  CONTACT: "/contact",
  PAYMENT_VERIFY: "/payment/verify",
  QUIZ_SHARE: (slug: string) => `/q/${slug}`,

  // User (gamer)
  USER: {
    HOME: "/user/dashboard",
    PROFILE: "/user/profile",
    SETTINGS: "/user/settings",
    WALLET: "/user/wallet",
    PRO: "/pro",
    TRIVIA: "/trivia",
    TRIVIA_TOPIC: (id: string) => `/trivia/${id}`,
    SESSION_PLAY: (sessionId: string) => `/play/${sessionId}`,
    MY_QUIZZES: "/my-quizzes",
    MY_QUIZ_NEW: "/my-quizzes/new",
    MY_QUIZ_GENERATE: "/my-quizzes/generate",
    MY_QUIZ_GENERATE_FOR: (id: string) => `/my-quizzes/generate?quiz=${id}`,
    MY_QUIZ_EDIT: (id: string) => `/my-quizzes/${id}/edit`,
    MY_QUIZ_PREVIEW: (id: string) => `/my-quizzes/${id}/preview`,
  },

  // Brand
  BRAND: {
    DASHBOARD: "/brand/dashboard",
    PROFILE: "/brand/profile",
    CAMPAIGNS: "/brand/campaigns",
    CAMPAIGN_NEW: "/brand/campaigns/new",
    CAMPAIGN_EDIT: (id: string) => `/brand/campaigns/${id}/edit`,
    CAMPAIGN_DASHBOARD: (id: string) => `/brand/campaigns/${id}/dashboard`,
    SETTINGS: "/brand/settings",
  },

  // Admin
  ADMIN: {
    DASHBOARD: "/admin",
    TOPICS: "/admin/topics",
    TOPIC: (id: string) => `/admin/topics/${id}`,
    CAMPAIGNS: "/admin/campaigns",
    CAMPAIGN: (id: string) => `/admin/campaigns/${id}`,
    SETTINGS: "/admin/settings",
  },
};
