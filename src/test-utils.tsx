import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { GameSettings } from "@/types";

export const TEST_SETTINGS: GameSettings = {
  timer: { minSeconds: 1, maxSeconds: 15, defaultSeconds: 5 },
  trivia: { minCards: 5, maxCards: 30 },
  customQuiz: { freeLimit: 1, minCardsToPublish: 5 },
  pro: { amount: 1500, currency: "NGN", durationDays: 30 },
  campaign: { amount: 15000, currency: "NGN", durationDays: 30, interruptionThreshold: 10 },
};

/** Renders with a fresh, retry-free query client so failures surface immediately. */
export function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

/** A server-clocked question window: `seconds` left from now (0 = already expired). */
export function questionClock(seconds: number) {
  const now = Date.now();
  return {
    timerSeconds: 5,
    servedAt: new Date(now).toISOString(),
    serverTime: new Date(now).toISOString(),
    deadlineAt: new Date(now + seconds * 1000).toISOString(),
    remainingMs: seconds * 1000,
  };
}

/** An axios-shaped rejection carrying the API's `{ message, code, details }` body. */
export function apiError(status: number, code: string, details: Record<string, unknown> = {}) {
  return { response: { status, data: { success: false, message: code, code, details } } };
}
