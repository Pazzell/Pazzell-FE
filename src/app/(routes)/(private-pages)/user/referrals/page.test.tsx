import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider } from "jotai";
import { userAtom } from "@/atom/user";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/user/referrals",
}));

const myStats = {
  success: true,
  month: "2026-07",
  stats: {
    totalReferrals: 5,
    pendingReferrals: 2,
    successfulReferralsThisMonth: 3,
    referralPointsThisMonth: 15,
    totalReferralPointsAllTime: 40,
    referredUsersThisMonth: [
      {
        userId: "u1",
        fullName: "Dana Diaz",
        username: "dana",
        successfulAt: "2026-07-01T00:00:00Z",
        pointsAwarded: 5,
      },
    ],
  },
};

const events = {
  success: true,
  events: [
    {
      _id: "e1",
      type: "signup",
      referredUser: { username: "erin" },
      createdAt: "2026-07-02T00:00:00Z",
    },
    {
      _id: "e2",
      type: "referral_credited",
      referredUser: { username: "dana" },
      createdAt: "2026-07-01T00:00:00Z",
    },
  ],
};

vi.mock("axios", () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes("/referrals/my-stats")) {
        return Promise.resolve({ data: myStats });
      }
      if (url.includes("/referrals/events")) {
        return Promise.resolve({ data: events });
      }
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    }),
  },
}));

import ReferralsPage from "./page";

function renderPage() {
  const store = createStore();
  store.set(userAtom, {
    id: "user1",
    fullName: "Test User",
    username: "testuser",
    email: "user@test.com",
    userType: "gamer" as const,
    isVerified: true,
    createdAt: "2026-01-01",
    accessToken: "test-token",
    refreshToken: "test-refresh",
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ReferralsPage />
      </QueryClientProvider>
    </Provider>
  );
}

describe("ReferralsPage", () => {
  it("explains the 5pt/21pt mechanic and drops the removed +1 signup bonus", async () => {
    renderPage();
    expect(
      await screen.findByText(/you earn \+5 bonus points/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/21 lifetime points/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\+1 point/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/first puzzle/i)).not.toBeInTheDocument();
  });

  it("shows pending and credited referral counts distinctly", async () => {
    renderPage();
    await screen.findByText(/you earn \+5 bonus points/i);

    expect(screen.getByText("3")).toBeInTheDocument(); // credited count
    expect(screen.getAllByText("Credited Referrals").length).toBeGreaterThan(0);
    expect(screen.getByText("2")).toBeInTheDocument(); // pending count
    expect(screen.getByText("Pending (not yet at 21 pts)")).toBeInTheDocument();
  });

  it("labels recent activity events using the new mechanic instead of 'first puzzle'", async () => {
    renderPage();
    expect(
      await screen.findByText(/pending until they reach 21 points/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reached 21 points — you earned \+5 pts/i)
    ).toBeInTheDocument();
  });
});
