import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEST_SETTINGS, apiError, renderWithQuery } from "@/test-utils";

const { api, push, replace } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useParams: () => ({ id: "a1" }),
}));
vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/trivia/campaign-gate", () => ({ CampaignGate: () => null }));

import AiTriviaPage from "./page";
import NewAiTriviaPage from "./new/page";
import AiTriviaSetupPage from "./[id]/page";

const trivia = (overrides: object = {}) => ({
  id: "a1",
  title: "Emperors of Rome",
  topic: { id: null, name: "Roman emperors" },
  prompt: "Hard questions about the first century",
  reviewStatus: "pending",
  inGeneralTrivia: false,
  cardCount: 8,
  cardCountBounds: { available: 8, min: 5, max: 8 },
  defaultTimerSeconds: 5,
  defaultCardCount: 8,
  createdAt: "2026-10-14T00:00:00.000Z",
  ...overrides,
});

const options = (overrides: object = {}) => ({
  enabled: true,
  isPro: true,
  pro: null,
  topics: [{ id: "t1", name: "History" }],
  topicMaxLength: 60,
  promptMaxLength: 500,
  count: { default: 10, min: 5, max: 30 },
  dailyLimit: 10,
  usedToday: 1,
  remaining: 9,
  resetsAt: "2026-10-15T00:00:00.000Z",
  ...overrides,
});

let trivias: object[];
let currentOptions: object;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  trivias = [trivia()];
  currentOptions = options();
  api.get.mockImplementation((url: string) => {
    if (url === "/settings/game") return Promise.resolve({ data: { settings: TEST_SETTINGS } });
    if (url === "/ai-trivia") return Promise.resolve({ data: { trivias } });
    if (url === "/ai-trivia/options") return Promise.resolve({ data: { options: currentOptions } });
    if (url === "/ai-trivia/a1") return Promise.resolve({ data: { trivia: trivia() } });
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
});

describe("AI Generated Trivia page", () => {
  it("lists the player's trivias with a way to play each and to create another", async () => {
    renderWithQuery(<AiTriviaPage />);

    expect(await screen.findByRole("heading", { name: "Emperors of Rome" })).toBeInTheDocument();
    expect(screen.getByText("Under review")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Play/ })).toHaveAttribute("href", "/ai-trivia/a1");
    expect(screen.getByRole("link", { name: /General Trivia/ })).toHaveAttribute("href", "/trivia");
    expect(await screen.findByText("9 of 10 left to create today")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /New AI Trivia/ }));
    expect(push).toHaveBeenCalledWith("/ai-trivia/new");
  });

  it("keeps a lapsed Pro player's trivias playable and offers Pro for new ones", async () => {
    currentOptions = options({ isPro: false, pro: { amount: 1500, currency: "NGN", durationDays: 30 } });
    renderWithQuery(<AiTriviaPage />);

    expect(await screen.findByText(/Your Pro plan has ended/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Play/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /New AI Trivia/ }));
    expect(await screen.findByText("Upgrade to Pro")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("deletes a trivia after confirmation", async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    renderWithQuery(<AiTriviaPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Delete Emperors of Rome" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/ai-trivia/a1"));
  });
});

describe("New AI trivia page", () => {
  const fill = async (topic: string) => {
    await userEvent.type(await screen.findByLabelText("Topic"), topic);
    await userEvent.type(
      screen.getByLabelText("What should the questions be about?"),
      "Hard questions about the first century"
    );
  };

  it("sends a typed topic by name and goes on to the new trivia", async () => {
    api.post.mockResolvedValue({ data: { trivia: trivia(), requested: 10, usage: {} } });
    renderWithQuery(<NewAiTriviaPage />);
    await fill("Roman emperors");
    await userEvent.click(screen.getByRole("button", { name: /Create trivia/ }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/ai-trivia", {
        topicName: "Roman emperors",
        prompt: "Hard questions about the first century",
        count: 10,
      })
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/ai-trivia/a1"));
  });

  it("sends one of our topics by its id, whatever the case typed", async () => {
    api.post.mockResolvedValue({ data: { trivia: trivia(), requested: 10, usage: {} } });
    renderWithQuery(<NewAiTriviaPage />);
    await fill("history");
    await userEvent.click(screen.getByRole("button", { name: /Create trivia/ }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post.mock.calls[0][1]).toMatchObject({ topicId: "t1" });
    expect(api.post.mock.calls[0][1]).not.toHaveProperty("topicName");
  });

  it("asks for a topic and a description before sending anything", async () => {
    renderWithQuery(<NewAiTriviaPage />);
    await userEvent.click(await screen.findByRole("button", { name: /Create trivia/ }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("stays on the form when the request is turned down", async () => {
    api.post.mockRejectedValue(apiError(422, "PROMPT_REJECTED"));
    renderWithQuery(<NewAiTriviaPage />);
    await fill("Roman emperors");
    await userEvent.click(screen.getByRole("button", { name: /Create trivia/ }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Create trivia/ })).toBeEnabled();
  });

  it("shows the Pro offer instead of the form to a freemium player", async () => {
    currentOptions = options({ isPro: false, pro: { amount: 1500, currency: "NGN", durationDays: 30 } });
    renderWithQuery(<NewAiTriviaPage />);

    expect(await screen.findByText(/AI generated trivia is a Pro feature/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See Pro" })).toHaveAttribute("href", "/pro");
    expect(screen.queryByLabelText("Topic")).not.toBeInTheDocument();
  });
});

describe("AI trivia setup page", () => {
  it("starts the trivia by its id with no picture mix", async () => {
    api.post.mockResolvedValue({ data: { session: { id: "s1" } } });
    renderWithQuery(<AiTriviaSetupPage />);

    expect(await screen.findByRole("heading", { name: "Emperors of Rome" })).toBeInTheDocument();
    expect(screen.queryByText("Picture questions")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start Quiz" }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post.mock.calls[0]).toEqual([
      "/trivia/sessions",
      { sourceType: "custom", sourceId: "a1", timerSeconds: 5, cardCount: 8, practice: false },
    ]);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/play/s1"));
    // Leaving the session leads back to the AI trivias, not the General Trivia topics.
    const { sessionExit } = await import("@/lib/session-exit");
    expect(sessionExit({ type: "custom", id: "a1" }, false).href).toBe("/ai-trivia");
  });
});
