export const ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER_GAMER: "/auth/gamer/register",
  REGISTER_BRAND: "/auth/brand/register",
  GOOGLE_AUTH: "/auth/google",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  ACTIVATE_USER: "/auth/user/activate",
  RESEND_ACTIVATION: "/auth/user/resend-activation",
  LOGOUT: "/auth/logout",
  REFRESH: "/refresh",

  // Profile
  ME: "/me",
  GAMER_PROFILE: "/profile/gamer",
  BRAND_PROFILE: "/profile/brand",
  UPDATE_GAMER_PROFILE: "/profile/gamer",
  UPDATE_BRAND_PROFILE: "/profile/brand",
  CHANGE_PASSWORD: "/profile/change-password",
  UPDATE_NOTIFICATIONS: "/profile/notifications",
  DELETE_ACCOUNT: "/profile/account",

  // Global settings
  GAME_SETTINGS: "/settings/game",

  // Plans / Pro / payments
  PLAN_ME: "/plan/me",
  PLAN_PRO_CHECKOUT: "/plan/pro/checkout",
  PAYMENTS_VERIFY: (reference: string) => `/payments/verify/${reference}`,
  PAYMENTS_MINE: "/payments/mine",

  // Trivia topics
  TRIVIA_TOPICS: "/trivia/topics",
  TRIVIA_TOPIC: (id: string) => `/trivia/topics/${id}`,

  // Trivia sessions (topics, custom quizzes and campaigns)
  TRIVIA_SESSIONS: "/trivia/sessions",
  TRIVIA_SESSION: (id: string) => `/trivia/sessions/${id}`,
  TRIVIA_SESSION_QUESTION: (id: string) => `/trivia/sessions/${id}/question`,
  TRIVIA_SESSION_ANSWER: (id: string) => `/trivia/sessions/${id}/answer`,
  TRIVIA_SESSION_RESULT: (id: string) => `/trivia/sessions/${id}/result`,
  TRIVIA_SESSION_ABANDON: (id: string) => `/trivia/sessions/${id}/abandon`,

  // Custom trivia (owner)
  CUSTOM_QUIZZES: "/custom-quizzes",
  CUSTOM_QUIZ_GENERATE: "/custom-quizzes/generate",
  CUSTOM_QUIZ: (id: string) => `/custom-quizzes/${id}`,
  CUSTOM_QUIZ_PREVIEW: (id: string) => `/custom-quizzes/${id}/preview`,
  CUSTOM_QUIZ_CARDS: (id: string) => `/custom-quizzes/${id}/cards`,
  CUSTOM_QUIZ_CARDS_BULK: (id: string) => `/custom-quizzes/${id}/cards/bulk`,
  CUSTOM_QUIZ_CARD: (id: string, cardId: string) =>
    `/custom-quizzes/${id}/cards/${cardId}`,
  CUSTOM_QUIZ_PUBLISH: (id: string) => `/custom-quizzes/${id}/publish`,
  CUSTOM_QUIZ_UNPUBLISH: (id: string) => `/custom-quizzes/${id}/unpublish`,
  CUSTOM_QUIZ_LINK_REGENERATE: (id: string) =>
    `/custom-quizzes/${id}/share-link/regenerate`,
  CUSTOM_QUIZ_LINK_REVOKE: (id: string) => `/custom-quizzes/${id}/share-link`,
  CUSTOM_QUIZ_STATS: (id: string) => `/custom-quizzes/${id}/stats`,

  // Custom trivia (public share link)
  CUSTOM_QUIZ_LINK: (slug: string) => `/custom-quizzes/link/${slug}`,
  CUSTOM_QUIZ_LINK_PLAY_INFO: (slug: string) =>
    `/custom-quizzes/link/${slug}/play-info`,

  // Team games (a custom quiz played as tic-tac-toe between teams)
  TEAM_GAMES: "/team-games",
  TEAM_GAME: (code: string) => `/team-games/${code}`,
  TEAM_GAME_JOIN: (code: string) => `/team-games/${code}/join`,
  TEAM_GAME_LEAVE: (code: string) => `/team-games/${code}/leave`,
  TEAM_GAME_MOVE_PLAYER: (code: string, userId: string) =>
    `/team-games/${code}/players/${userId}/team`,
  TEAM_GAME_LEADER: (code: string, teamId: string) =>
    `/team-games/${code}/teams/${teamId}/leader`,
  TEAM_GAME_START: (code: string) => `/team-games/${code}/start`,
  TEAM_GAME_PICK: (code: string) => `/team-games/${code}/pick`,
  TEAM_GAME_ANSWER: (code: string) => `/team-games/${code}/answer`,
  TEAM_GAME_END: (code: string) => `/team-games/${code}/end`,
  TEAM_GAME_MESSAGES: (code: string) => `/team-games/${code}/messages`,
  TEAM_GAME_RESULT: (code: string) => `/team-games/${code}/result`,

  // AI generated trivia (written for a Pro player from a topic and a prompt)
  AI_TRIVIA_OPTIONS: "/ai-trivia/options",
  AI_TRIVIAS: "/ai-trivia",
  AI_TRIVIA: (id: string) => `/ai-trivia/${id}`,

  // Brand campaigns (brand role)
  BRAND_CAMPAIGNS_PRICING: "/brand/campaigns/pricing",
  BRAND_CAMPAIGNS: "/brand/campaigns",
  BRAND_CAMPAIGN: (id: string) => `/brand/campaigns/${id}`,
  BRAND_CAMPAIGN_PREVIEW: (id: string) => `/brand/campaigns/${id}/preview`,
  BRAND_CAMPAIGN_CARDS: (id: string) => `/brand/campaigns/${id}/cards`,
  BRAND_CAMPAIGN_CARDS_BULK: (id: string) =>
    `/brand/campaigns/${id}/cards/bulk`,
  BRAND_CAMPAIGN_CARD: (id: string, cardId: string) =>
    `/brand/campaigns/${id}/cards/${cardId}`,
  BRAND_CAMPAIGN_CHECKOUT: (id: string) => `/brand/campaigns/${id}/checkout`,
  BRAND_CAMPAIGN_CANCEL_CHECKOUT: (id: string) =>
    `/brand/campaigns/${id}/cancel-checkout`,
  BRAND_CAMPAIGN_DASHBOARD: (id: string) =>
    `/brand/campaigns/${id}/dashboard`,

  // Campaign delivery to players
  CAMPAIGNS_NEXT: "/campaigns/next",
  CAMPAIGN_BY_ID: (id: string) => `/campaigns/${id}`,
  CAMPAIGN_CLICK: (id: string) => `/campaigns/${id}/click`,

  // Admin
  ADMIN_CONFIG: "/admin/config",
  ADMIN_CONFIG_KEY: (key: string) => `/admin/config/${key}`,
  ADMIN_TRIVIA_TOPICS: "/admin/trivia/topics",
  ADMIN_TRIVIA_TOPIC: (id: string) => `/admin/trivia/topics/${id}`,
  ADMIN_TRIVIA_TOPIC_CARDS: (id: string) => `/admin/trivia/topics/${id}/cards`,
  ADMIN_TRIVIA_TOPIC_CARDS_BULK: (id: string) =>
    `/admin/trivia/topics/${id}/cards/bulk`,
  ADMIN_TRIVIA_TOPIC_CARD: (id: string, cardId: string) =>
    `/admin/trivia/topics/${id}/cards/${cardId}`,
  ADMIN_TRIVIA_IMPORT_CATEGORIES: "/admin/trivia/import/categories",
  ADMIN_TRIVIA_IMPORT: "/admin/trivia/import",
  ADMIN_TRIVIA_STARTER: "/admin/trivia/starter",
  ADMIN_TRIVIA_GENERATE: "/admin/trivia/generate",
  ADMIN_AI_TRIVIAS: (status: string) => `/admin/trivia/ai?status=${status}`,
  ADMIN_AI_TRIVIA: (id: string) => `/admin/trivia/ai/${id}`,
  ADMIN_AI_TRIVIA_APPROVE: (id: string) => `/admin/trivia/ai/${id}/approve`,
  ADMIN_AI_TRIVIA_REJECT: (id: string) => `/admin/trivia/ai/${id}/reject`,
  ADMIN_CAMPAIGNS: "/admin/campaigns",
  ADMIN_CAMPAIGN: (id: string) => `/admin/campaigns/${id}`,
  ADMIN_CAMPAIGN_PAUSE: (id: string) => `/admin/campaigns/${id}/pause`,
  ADMIN_CAMPAIGN_RESUME: (id: string) => `/admin/campaigns/${id}/resume`,
  ADMIN_CAMPAIGN_TAKEDOWN: (id: string) => `/admin/campaigns/${id}/takedown`,
  ADMIN_REVENUE: "/admin/revenue",
  ADMIN_PAYMENTS: "/admin/payments",

  // Uploads
  UPLOAD_IMAGE: "/uploads/images",

  // App-wide live activity widget (kept)
  APP_ANALYTICS: "/analytics/app",
  ANALYTICS_USER_ONLINE: "/analytics/user/online",
  ANALYTICS_USER_OFFLINE: "/analytics/user/offline",
  ANALYTICS_GAME_START: "/analytics/game/start",
  ANALYTICS_GAME_STOP: "/analytics/game/stop",
};
