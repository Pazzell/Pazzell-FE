import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { atom } from "jotai";
import { CampaignV2Data } from "@/types";

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

// Stub the 4 game components so the test drives sequencing/API calls
// instead of solving real puzzles — each stub exposes a single button
// that fires onGameComplete, gated on sessionMode being passed through.
vi.mock("@/components/games/SlidingPuzzleGame", () => ({
  SlidingPuzzleGame: ({ sessionMode, onGameComplete }: any) => (
    <button onClick={() => sessionMode && onGameComplete(5, 3000)}>
      Complete sliding_puzzle
    </button>
  ),
}));
vi.mock("@/components/games/CardMatchingGame", () => ({
  CardMatchingGame: ({ sessionMode, onGameComplete }: any) => (
    <button onClick={() => sessionMode && onGameComplete(4, 2000)}>
      Complete card_matching
    </button>
  ),
}));
vi.mock("@/components/games/SpotTheDifferenceGame", () => ({
  SpotTheDifferenceGame: ({ sessionMode, onGameComplete }: any) => (
    <button onClick={() => sessionMode && onGameComplete(10, 4000)}>
      Complete spot_the_difference
    </button>
  ),
}));
vi.mock("@/components/games/WordHuntGame", () => ({
  WordHuntGame: ({ sessionMode, onGameComplete }: any) => (
    <button onClick={() => sessionMode && onGameComplete(7, 5000)}>
      Complete word_hunt
    </button>
  ),
}));

const calls: { method: string; url: string; body?: unknown }[] = [];

// Lets a single test force the next matching call to reject with a
// backend-shaped 400, exercising the error-message + abandoned-session
// handling in real-session-flow.tsx without a real network layer.
let failNextUrlContaining: string | null = null;
let failNextMessage = "";

vi.mock("axios", () => {
  const handle = (method: string, url: string, body?: unknown) => {
    calls.push({ method, url, body });
    if (failNextUrlContaining && url.includes(failNextUrlContaining)) {
      const message = failNextMessage;
      failNextUrlContaining = null;
      failNextMessage = "";
      return Promise.reject({ isAxiosError: true, response: { data: { message } } });
    }
    if (url.includes("/sessions/start")) {
      return Promise.resolve({ data: { session: { _id: "sess1" } } });
    }
    if (url.includes("/quiz/attempt")) {
      const answers = (body as { answers: number[] }).answers;
      const allCorrect = answers[0] === 0 && answers[1] === 1 && answers[2] === 2;
      return Promise.resolve({
        data: {
          score: allCorrect ? 3 : 1,
          allCorrect,
          attemptsSoFar: 1,
          firstAttemptScore: allCorrect ? 3 : 1,
        },
      });
    }
    if (url.includes("/sessions/sess1/complete")) {
      return Promise.resolve({
        data: {
          success: true,
          isFirstCompletion: true,
          pointsAwarded: 7,
          totalCompletionTimeMs: 184032,
          voided: false,
          flagged: false,
        },
      });
    }
    if (url.includes("/leaderboards/weekly")) {
      return Promise.resolve({ data: { leaderboard: { entries: [] } } });
    }
    return Promise.resolve({ data: {} });
  };

  return {
    default: {
      get: vi.fn((url: string) => handle("GET", url)),
      post: vi.fn((url: string, body?: unknown) => handle("POST", url, body)),
      isAxiosError: (error: unknown): boolean =>
        !!error && typeof error === "object" && (error as { isAxiosError?: boolean }).isAxiosError === true,
    },
  };
});

import { RealSessionFlow } from "./real-session-flow";

const campaign: CampaignV2Data = {
  _id: "camp1",
  schemaVersion: 2,
  brandId: "brand1",
  brandName: "Acme",
  gameTypes: ["sliding_puzzle", "word_hunt"],
  title: "Summer Splash",
  description: "desc",
  puzzleImageUrl: "https://example.com/img.png",
  videoUrl: "https://example.com/vid.mp4",
  videoDurationSeconds: 90,
  videoSizeBytes: 1000,
  videoMimeType: "video/mp4",
  words: ["apple", "banana"],
  questions: [
    { _id: "q1", question: "Q1?", choices: ["A", "B", "C", "D"], correctIndex: 0 },
    { _id: "q2", question: "Q2?", choices: ["A", "B", "C", "D"], correctIndex: 1 },
    { _id: "q3", question: "Q3?", choices: ["A", "B", "C", "D"], correctIndex: 2 },
  ],
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

function renderFlow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RealSessionFlow campaign={campaign} campaignId="camp1" />
    </QueryClientProvider>
  );
}

function answerQuiz(container: HTMLElement, answers: number[]) {
  const letters = ["A", "B", "C", "D"];
  answers.forEach((answerIndex, qIndex) => {
    const question = screen.getByTestId(`quiz-question-${qIndex}`);
    const buttons = question.querySelectorAll("button");
    const target = Array.from(buttons).find((b) =>
      b.textContent?.startsWith(`${letters[answerIndex]}.`)
    );
    target?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("RealSessionFlow", () => {
  beforeEach(() => {
    calls.length = 0;
    failNextUrlContaining = null;
    failNextMessage = "";
  });

  it("surfaces the backend's specific error message instead of a generic one", async () => {
    const user = userEvent.setup();
    renderFlow();

    failNextUrlContaining = "/games/sliding_puzzle/complete";
    failNextMessage = "All four games must be completed first";

    await user.click(screen.getByRole("button", { name: /start playing/i }));
    await user.click(await screen.findByText("Complete sliding_puzzle"));

    expect(
      await screen.findByText("All four games must be completed first")
    ).toBeInTheDocument();
  });

  it("resets to the intro screen and drops the dead sessionId when the session has been auto-abandoned", async () => {
    const user = userEvent.setup();
    renderFlow();

    failNextUrlContaining = "/games/sliding_puzzle/complete";
    failNextMessage = "Session is abandoned, cannot be completed";

    await user.click(screen.getByRole("button", { name: /start playing/i }));
    await user.click(await screen.findByText("Complete sliding_puzzle"));

    expect(
      await screen.findByRole("button", { name: /start playing/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("Complete sliding_puzzle")).not.toBeInTheDocument();

    // Retrying starts an entirely new session rather than reusing sess1.
    calls.length = 0;
    await user.click(screen.getByRole("button", { name: /start playing/i }));
    await waitFor(() =>
      expect(calls.some((c) => c.url.includes("/sessions/start"))).toBe(true)
    );
  });

  it("enforces sequential game order and calls session endpoints in the right sequence", async () => {
    const user = userEvent.setup();
    renderFlow();

    await user.click(screen.getByRole("button", { name: /start playing/i }));

    // Sequential order: only the first game (sliding_puzzle) is rendered.
    expect(await screen.findByText("Complete sliding_puzzle")).toBeInTheDocument();
    expect(screen.queryByText("Complete word_hunt")).not.toBeInTheDocument();
    expect(calls.some((c) => c.url.includes("/sessions/start"))).toBe(true);
    expect(
      calls.some((c) => c.url.includes("/games/sliding_puzzle/start"))
    ).toBe(true);

    // The persistent session timer is visible during play.
    expect(screen.getByTestId("session-timer-value")).toBeInTheDocument();

    await user.click(screen.getByText("Complete sliding_puzzle"));

    // sliding_puzzle's completion must be recorded before word_hunt starts.
    await waitFor(() =>
      expect(
        calls.some((c) => c.url.includes("/games/sliding_puzzle/complete"))
      ).toBe(true)
    );
    expect(await screen.findByText("Complete word_hunt")).toBeInTheDocument();
    expect(screen.queryByText("Complete sliding_puzzle")).not.toBeInTheDocument();
    expect(calls.some((c) => c.url.includes("/games/word_hunt/start"))).toBe(true);

    await user.click(screen.getByText("Complete word_hunt"));

    // After the last game, the video stage starts.
    await waitFor(() =>
      expect(calls.some((c) => c.url.includes("/video/start"))).toBe(true)
    );
    expect(await screen.findByRole("heading", { name: /watch to continue/i })).toBeInTheDocument();
  });

  it("shows which questions were wrong on a failed attempt, then allows a retry, and only completes the session once all correct", async () => {
    const user = userEvent.setup();
    const { container } = renderFlow();

    await user.click(screen.getByRole("button", { name: /start playing/i }));
    await user.click(await screen.findByText("Complete sliding_puzzle"));
    await user.click(await screen.findByText("Complete word_hunt"));
    await screen.findByRole("heading", { name: /watch to continue/i });
    await user.click(screen.getByRole("button", { name: /continue to quiz/i }));

    await screen.findByTestId("quiz-question-0");

    // Wrong attempt: question 2 (index 1) wrong (correct is B/1, we answer A/0).
    answerQuiz(container, [0, 0, 2]);
    await user.click(screen.getByRole("button", { name: /submit answers/i }));

    await waitFor(() =>
      expect(screen.getByText(/1 question wrong/i)).toBeInTheDocument()
    );
    expect(calls.some((c) => c.url.includes("/sessions/sess1/complete"))).toBe(
      false
    );

    // Retry with all-correct answers.
    answerQuiz(container, [0, 1, 2]);
    await user.click(screen.getByRole("button", { name: /submit answers/i }));

    await waitFor(() =>
      expect(calls.some((c) => c.url.includes("/sessions/sess1/complete"))).toBe(
        true
      )
    );
    expect(
      await screen.findByRole("heading", { name: /campaign complete/i })
    ).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument(); // pointsAwarded
  }, 20000);
});
