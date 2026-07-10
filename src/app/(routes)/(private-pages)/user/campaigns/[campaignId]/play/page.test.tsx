import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { atom } from "jotai";

vi.mock("next/navigation", () => ({
  useParams: () => ({ campaignId: "camp1" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/user/campaigns/camp1/play",
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

vi.mock("./real-session-flow", () => ({
  RealSessionFlow: () => <div>REAL_SESSION_FLOW</div>,
}));
vi.mock("./fun-run-flow", () => ({
  FunRunFlow: () => <div>FUN_RUN_FLOW</div>,
}));

let hasCompleted = false;

const campaignV2 = {
  _id: "camp1",
  schemaVersion: 2,
  brandId: "brand1",
  brandName: "Acme",
  gameTypes: ["sliding_puzzle"],
  title: "Summer Splash",
  description: "desc",
  words: [],
  questions: [],
  prizeDescription: "Headphones",
  prizeUnitsAvailable: 1,
  createdAt: "2026-01-01",
  endDate: "2026-02-01",
  durationWeeks: 4,
  weeklyPrice: 7000,
  packageId: "pkg1",
  packageName: "basic",
  status: "active",
  paymentStatus: "paid",
};

vi.mock("axios", () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes("/completion")) {
        return Promise.resolve({ data: { hasCompletedByCurrentUser: hasCompleted } });
      }
      return Promise.resolve({ data: { campaign: campaignV2 } });
    }),
  },
}));

import CampaignSessionPlayPage from "./page";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CampaignSessionPlayPage />
    </QueryClientProvider>
  );
}

describe("CampaignSessionPlayPage", () => {
  beforeEach(() => {
    hasCompleted = false;
  });

  it("goes straight to the real session flow when the player hasn't completed the campaign", async () => {
    hasCompleted = false;
    renderPage();
    expect(await screen.findByText("REAL_SESSION_FLOW")).toBeInTheDocument();
    expect(screen.queryByTestId("replay-warning-modal")).not.toBeInTheDocument();
  });

  it("shows the replay warning before rendering anything playable when already completed", async () => {
    hasCompleted = true;
    renderPage();

    const modal = await screen.findByTestId("replay-warning-modal");
    expect(modal).toBeInTheDocument();
    expect(screen.queryByText("FUN_RUN_FLOW")).not.toBeInTheDocument();
    expect(screen.queryByText("REAL_SESSION_FLOW")).not.toBeInTheDocument();
    expect(
      screen.getByText(/no points, no raffle ticket, and no recorded time/i)
    ).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /continue \(just for fun\)/i }));

    await waitFor(() => expect(screen.getByText("FUN_RUN_FLOW")).toBeInTheDocument());
    expect(screen.queryByTestId("replay-warning-modal")).not.toBeInTheDocument();
    expect(screen.queryByText("REAL_SESSION_FLOW")).not.toBeInTheDocument();
  });
});
