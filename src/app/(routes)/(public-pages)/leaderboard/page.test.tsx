import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { atom } from "jotai";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/leaderboard",
}));

vi.mock("@/atom/user", () => ({
  userAtom: atom({
    id: "user1",
    fullName: "Test User",
    email: "user@test.com",
    userType: "gamer",
    isVerified: true,
    createdAt: "2026-01-01",
    accessToken: "test-token",
    refreshToken: "test-refresh",
  }),
}));

const weeklyLeaderboard = {
  success: true,
  leaderboard: {
    type: "weekly",
    weekKey: "2026-W28",
    totalPlayers: 4,
    entries: [
      {
        position: 1,
        userId: "u1",
        fullName: "Alice Adams",
        username: "alice",
        avatar: "",
        puzzlesSolved: 5,
        points: 35,
        avgCompletionTimeMs: 65000,
        avgCompletionTimeSec: 65,
      },
      {
        position: 2,
        userId: "u2",
        fullName: "Bob Brown",
        username: "bob",
        avatar: "",
        puzzlesSolved: 4,
        points: 28,
        avgCompletionTimeMs: 90000,
        avgCompletionTimeSec: 90,
      },
      {
        position: 3,
        userId: "u3",
        fullName: "Cara Chen",
        username: "cara",
        avatar: "",
        puzzlesSolved: 3,
        points: 21,
        avgCompletionTimeMs: 50000,
        avgCompletionTimeSec: 50,
      },
    ],
  },
};

vi.mock("axios", () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes("/leaderboards/weekly")) {
        return Promise.resolve({ data: weeklyLeaderboard });
      }
      if (url.includes("/admin/config")) {
        // Config-driven override — proves the reward card isn't hardcoded.
        return Promise.resolve({
          data: {
            success: true,
            config: {
              "payout.playerSharePercent": { value: 55 },
              "payout.rankDistribution": { value: [25, 20, 15, 10, 8, 7, 6, 4, 3, 2] },
            },
          },
        });
      }
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    }),
  },
}));

import LeaderboardPage from "./page";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LeaderboardPage />
    </QueryClientProvider>
  );
}

describe("Weekly LeaderboardPage", () => {
  it("renders weekly entries with points and average completion time, and a week countdown", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /weekly leaderboard/i })).toBeInTheDocument();
    expect(screen.getAllByText("@alice").length).toBeGreaterThan(0);
    expect(screen.getByTestId("week-countdown")).toHaveTextContent(/resets in/i);

    const rows = screen.getAllByTestId("leaderboard-row");
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("@bob");
    expect(rows[1]).toHaveTextContent("1:30"); // 90s avg completion time
  });

  it("explains the points-tie tiebreaker", async () => {
    renderPage();
    await screen.findByRole("heading", { name: /weekly leaderboard/i });
    expect(
      screen.getByText(/faster average first-completion time/i)
    ).toBeInTheDocument();
  });

  it("sources the reward split from config instead of hardcoding it", async () => {
    renderPage();
    await screen.findByRole("heading", { name: /weekly leaderboard/i });
    // The mocked admin config returns 55%, not the documented 50% default —
    // if this renders, the value came from the live config fetch.
    expect(await screen.findByText(/55%/)).toBeInTheDocument();
  });
});
