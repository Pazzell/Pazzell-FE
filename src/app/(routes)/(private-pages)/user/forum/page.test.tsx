import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider } from "jotai";
import { userAtom } from "@/atom/user";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/user/forum",
}));

const submissions = [
  {
    _id: "s1",
    campaignId: "c1",
    postUrl: "https://x.com/post/verified",
    status: "verified",
    createdAt: "2026-07-01T00:00:00Z",
  },
  {
    _id: "s2",
    campaignId: "c2",
    postUrl: "https://x.com/post/rejected",
    status: "rejected",
    adminNotes: "Post was deleted",
    createdAt: "2026-07-02T00:00:00Z",
  },
];

const threads = [
  { _id: "t1", title: "Loving the new campaigns", category: "General", postCount: 3, createdAt: "2026-07-01T00:00:00Z" },
];

const axiosPostCalls: { url: string; body: any }[] = [];

vi.mock("axios", () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes("/forum/threads")) {
        return Promise.resolve({ data: { success: true, threads } });
      }
      if (url.includes("/forum/winner-submissions/mine")) {
        return Promise.resolve({ data: { success: true, submissions } });
      }
      if (url.includes("/raffles/my-tickets")) {
        return Promise.resolve({
          data: {
            success: true,
            eligibleThisWeek: true,
            tickets: [{ campaignId: "c3", campaignTitle: "Summer Splash", weekKey: "2026-W28", ticketCount: 1 }],
          },
        });
      }
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    }),
    post: vi.fn((url: string, body: any) => {
      axiosPostCalls.push({ url, body });
      return Promise.resolve({ data: { success: true } });
    }),
  },
}));

import ForumPage from "./page";

function renderPage() {
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ForumPage />
      </QueryClientProvider>
    </Provider>
  );
}

describe("ForumPage", () => {
  it("shows verified and rejected winner submissions with correct status and messaging", async () => {
    renderPage();

    const rows = await screen.findAllByTestId("submission-row");
    expect(rows).toHaveLength(2);

    const verifiedRow = rows.find((r) => r.textContent?.includes("verified"))!;
    expect(verifiedRow.textContent).toContain("+5 bonus points credited");

    const rejectedRow = rows.find((r) => r.textContent?.includes("Post was deleted"))!;
    expect(rejectedRow.textContent).toContain("rejected");
  });

  it("lists discussion threads", async () => {
    renderPage();
    const threadRow = await screen.findByTestId("thread-row");
    expect(threadRow).toHaveTextContent("Loving the new campaigns");
  });

  it("blocks a winner submission with too few likes before hitting the network", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByTestId("submission-row");

    fireEvent.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    fireEvent.click(within(listbox).getByText(/summer splash/i));

    await user.type(screen.getByPlaceholderText("Link to your post"), "https://x.com/post/mine");
    await user.type(screen.getByPlaceholderText("Current like count"), "5");
    await user.click(screen.getByRole("button", { name: /submit for verification/i }));

    expect(
      await screen.findByText(new RegExp(`at least 20 likes`, "i"))
    ).toBeInTheDocument();
    expect(axiosPostCalls.some((c) => c.url.includes("winner-submissions"))).toBe(false);
  });
});
