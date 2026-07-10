import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider } from "jotai";
import { userAtom } from "@/atom/user";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/user/raffles",
}));

const campaigns = [
  {
    _id: "c1",
    schemaVersion: 2,
    status: "active",
    title: "Summer Splash",
    brandName: "Acme",
    prizeDescription: "Wireless headphones",
    gameTypes: ["sliding_puzzle"],
  },
  {
    _id: "c2",
    schemaVersion: 2,
    status: "active",
    title: "Winter Blast",
    brandName: "Globex",
    prizeDescription: "Smart watch",
    gameTypes: ["word_hunt"],
  },
];

const weeklyLeaderboard = {
  type: "weekly",
  weekKey: "2026-W28",
  totalPlayers: 1,
  entries: [
    {
      position: 1,
      userId: "u1",
      fullName: "Alice",
      username: "alice",
      avatar: "",
      puzzlesSolved: 5,
      points: 35,
      avgCompletionTimeMs: 60000,
      avgCompletionTimeSec: 60,
    },
  ],
};

vi.mock("axios", () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes("/raffles/campaign/c1/current")) {
        return Promise.resolve({
          data: {
            campaignId: "c1",
            weekKey: "2026-W28",
            ticketCount: 12,
            eligibilityFloor: 3,
            drawStatus: "drawn",
            drawId: "draw1",
            winner: { userId: "u2", username: "winnerbob" },
          },
        });
      }
      if (url.includes("/raffles/campaign/c2/current")) {
        return Promise.resolve({
          data: {
            campaignId: "c2",
            weekKey: "2026-W28",
            ticketCount: 4,
            eligibilityFloor: 3,
            drawStatus: "pending",
          },
        });
      }
      if (url.includes("/leaderboards/weekly")) {
        return Promise.resolve({ data: { leaderboard: weeklyLeaderboard } });
      }
      if (url.includes("/campaigns")) {
        return Promise.resolve({ data: { success: true, campaigns } });
      }
      if (url.includes("/admin/config")) {
        return Promise.reject({ response: { status: 403 } });
      }
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    }),
  },
}));

import RafflesPage from "./page";

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = createStore();
  store.set(userAtom, {
    id: "user1",
    fullName: "Test User",
    email: "user@test.com",
    userType: "gamer" as const,
    isVerified: true,
    createdAt: "2026-01-01",
    accessToken: "test-token",
    refreshToken: "test-refresh",
  });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RafflesPage />
      </QueryClientProvider>
    </Provider>
  );
}

describe("RafflesPage", () => {
  it("shows the top cash winner with their config-driven reward share", async () => {
    renderPage();
    const row = await screen.findByTestId("top-winner-row");
    expect(row).toHaveTextContent("@alice");
    expect(row).toHaveTextContent("30% share"); // rank 1 default rankDistribution
  });

  it("shows per-campaign raffle cards with drawn and pending states", async () => {
    renderPage();
    const cards = await screen.findAllByTestId("campaign-raffle-card");
    expect(cards).toHaveLength(2);

    const drawnCard = cards.find((c) => c.textContent?.includes("Summer Splash"))!;
    expect(await within(drawnCard).findByText("Drawn")).toBeInTheDocument();
    expect(drawnCard.textContent).toContain("winnerbob");

    const pendingCard = cards.find((c) => c.textContent?.includes("Winter Blast"))!;
    expect(await within(pendingCard).findByText("Pending")).toBeInTheDocument();
  });

  it("shows the archive-coming-soon placeholder instead of fake historical data", async () => {
    renderPage();
    await screen.findByTestId("top-winner-row");
    expect(
      screen.getByText(/archive of past weeks is coming soon/i)
    ).toBeInTheDocument();
  });
});
