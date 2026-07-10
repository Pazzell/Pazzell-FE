import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider } from "jotai";
import { userAtom } from "@/atom/user";

const loggedInUser = {
  id: "user1",
  fullName: "Test User",
  email: "user@test.com",
  userType: "gamer" as const,
  isVerified: true,
  createdAt: "2026-01-01",
  accessToken: "test-token",
  refreshToken: "test-refresh",
};

let ticketCampaignIds: string[] = ["c1", "c2"];
let eligibleThisWeek = false;

const activeV2Campaigns = ["c1", "c2", "c3"].map((id) => ({
  _id: id,
  schemaVersion: 2,
  status: "active",
  gameTypes: ["sliding_puzzle"],
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes("/raffles/my-tickets")) {
        return Promise.resolve({
          data: {
            success: true,
            tickets: ticketCampaignIds.map((id) => ({
              campaignId: id,
              weekKey: "2026-W28",
              ticketCount: 1,
            })),
            eligibleThisWeek,
          },
        });
      }
      if (url.includes("/campaigns")) {
        return Promise.resolve({ data: { success: true, campaigns: activeV2Campaigns } });
      }
      if (url.includes("/admin/config")) {
        return Promise.reject({ response: { status: 403 } });
      }
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    }),
  },
}));

import { EligibilityProgress } from "./EligibilityProgress";

function renderWidget(user: typeof loggedInUser | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = createStore();
  store.set(userAtom, user);
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <EligibilityProgress />
      </QueryClientProvider>
    </Provider>
  );
}

describe("EligibilityProgress", () => {
  it("shows progress toward the eligibility floor", async () => {
    ticketCampaignIds = ["c1", "c2"];
    eligibleThisWeek = false;
    renderWidget(loggedInUser);

    expect(
      await screen.findByText(
        "2 of 3 campaigns completed — complete 1 more to activate your raffle tickets."
      )
    ).toBeInTheDocument();
  });

  it("shows the activated state once eligibleThisWeek is true", async () => {
    ticketCampaignIds = ["c1", "c2", "c3"];
    eligibleThisWeek = true;
    renderWidget(loggedInUser);

    expect(
      await screen.findByText(
        "3 of 3 campaigns completed — your raffle tickets are activated!"
      )
    ).toBeInTheDocument();
  });

  it("renders nothing for a logged-out visitor", () => {
    const { container } = renderWidget(null);
    expect(container).toBeEmptyDOMElement();
  });
});
