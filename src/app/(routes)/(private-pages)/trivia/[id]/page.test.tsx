import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEST_SETTINGS, apiError, renderWithQuery } from "@/test-utils";

const { api, push } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  push: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useParams: () => ({ id: "t1" }),
}));
vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import TriviaTopicSetupPage from "./page";

const campaign = {
  id: "c1",
  title: "Spring launch",
  description: null,
  coverImageUrl: null,
  brandName: "Acme",
  logoUrl: null,
  websiteUrl: "https://acme.example/",
  ctaText: "Visit our site",
  endsAt: "2026-11-05T09:00:00.000Z",
};

/** Whether the player currently owes a sponsored trivia. */
let campaignOwed = false;

const sessionStarts = () =>
  api.post.mock.calls.filter((call) => String(call[0]) === "/trivia/sessions").map(([, body]) => body);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  campaignOwed = false;

  api.get.mockImplementation((url: string) => {
    if (url === "/settings/game") return Promise.resolve({ data: { settings: TEST_SETTINGS } });
    if (url === "/trivia/topics") {
      return Promise.resolve({
        data: {
          topics: [
            {
              id: "t1",
              name: "Football",
              slug: "football",
              description: "Rules and positions",
              coverImageUrl: null,
              cardCount: 20,
              cardCountBounds: { available: 20, min: 5, max: 20 },
            },
          ],
        },
      });
    }
    if (url === "/campaigns/c1") {
      return Promise.resolve({
        data: { campaign, cardCountBounds: { available: 6, min: 5, max: 6 } },
      });
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });

  api.post.mockImplementation((url: string, body: { sourceType: string }) => {
    if (url === "/trivia/sessions") {
      if (body.sourceType !== "campaign" && campaignOwed) {
        return Promise.reject(
          apiError(403, "CAMPAIGN_REQUIRED", { counter: 10, threshold: 10, campaign })
        );
      }
      return Promise.resolve({
        data: { resumed: false, session: { id: body.sourceType === "campaign" ? "s9" : "s1" } },
      });
    }
    return Promise.reject(new Error(`Unhandled POST ${url}`));
  });
});

describe("Trivia topic setup page", () => {
  it("starts a topic session with the chosen timer and card count, practice off by default", async () => {
    renderWithQuery(<TriviaTopicSetupPage />);
    expect(await screen.findByRole("switch", { name: "Practice" })).toHaveAttribute("aria-checked", "false");

    await userEvent.click(await screen.findByRole("button", { name: "Start Quiz" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/play/s1"));
    expect(sessionStarts()).toEqual([
      { sourceType: "topic", sourceId: "t1", timerSeconds: 5, cardCount: 20, practice: false },
    ]);
    expect(localStorage.getItem("pazzell_trivia_timer_seconds")).toBe("5");
  });

  it("starts in practice when the toggle is on, and remembers the choice", async () => {
    renderWithQuery(<TriviaTopicSetupPage />);

    const toggle = await screen.findByRole("switch", { name: "Practice" });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("button", { name: "Start Quiz" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/play/s1"));
    expect(sessionStarts()).toEqual([
      { sourceType: "topic", sourceId: "t1", timerSeconds: 5, cardCount: 20, practice: true },
    ]);
    expect(localStorage.getItem("pazzell_trivia_practice")).toBe("on");
  });

  it("shows the sponsored trivia when the server says one is owed, and plays it", async () => {
    campaignOwed = true;
    renderWithQuery(<TriviaTopicSetupPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Start Quiz" }));

    expect(await screen.findByText("Spring launch")).toBeInTheDocument();
    expect(screen.getByText("by Acme")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /Play Sponsored Trivia/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/play/s9"));
    // The player's timer is kept; the card count is clamped to what the campaign has.
    expect(sessionStarts().at(-1)).toEqual({
      sourceType: "campaign",
      sourceId: "c1",
      timerSeconds: 5,
      cardCount: 6,
    });
  });
});
