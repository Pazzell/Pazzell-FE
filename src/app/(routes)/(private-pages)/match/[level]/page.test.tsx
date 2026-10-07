import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEST_SETTINGS, questionClock, renderWithQuery } from "@/test-utils";

const { api, push } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  push: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useParams: () => ({ level: "1" }),
}));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import MatchLevelPage from "./page";

const star = { id: "shape:star", category: "shape", name: "Star", attributes: {}, svg: "<svg></svg>" };
const cross = { id: "shape:cross", category: "shape", name: "Cross", attributes: {}, svg: "<svg></svg>" };
const attempt = {
  id: "a1",
  level: 1,
  timerSeconds: 5,
  status: "in_progress",
  questionCount: 2,
  currentIndex: 0,
  startedAt: "2026-10-06T10:00:00.000Z",
  completedAt: null,
};
const passedResult = {
  attemptId: "a1",
  level: 1,
  correct: 2,
  total: 2,
  passed: true,
  nextLevel: 2,
  nextLevelUnlocked: true,
  completedAt: "2026-10-06T10:01:00.000Z",
};

/** What `GET /question` returns on each successive call. */
let questions: object[] = [];
let answerResponse: object = {};

const answerCalls = () =>
  api.post.mock.calls.filter((call) => String(call[0]).endsWith("/answer"));
const questionCalls = () =>
  api.get.mock.calls.filter((call) => String(call[0]).endsWith("/question"));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  questions = [];

  api.get.mockImplementation((url: string) => {
    if (url === "/settings/game") return Promise.resolve({ data: { settings: TEST_SETTINGS } });
    if (url === "/match/levels") {
      return Promise.resolve({
        data: {
          timer: { minSeconds: 1, maxSeconds: 7, defaultSeconds: 5 },
          highestUnlockedLevel: 1,
          levels: [
            {
              level: 1,
              name: "First shapes",
              questionCount: 2,
              optionCount: 2,
              categories: ["shapes"],
              unlocked: true,
              passed: false,
              attempts: 0,
              best: null,
              activeAttemptId: null,
            },
          ],
        },
      });
    }
    if (url.endsWith("/question")) {
      const next = questions.length > 1 ? questions.shift() : questions[0];
      return Promise.resolve({ data: next });
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });

  api.post.mockImplementation((url: string) => {
    if (url === "/match/levels/1/attempts") {
      return Promise.resolve({ data: { resumed: false, attempt } });
    }
    if (url.endsWith("/answer")) return Promise.resolve({ data: answerResponse });
    if (url.startsWith("/analytics/")) return Promise.resolve({ data: {} });
    return Promise.reject(new Error(`Unhandled POST ${url}`));
  });
});

const question = (index: number, secondsLeft: number) => ({
  completed: false,
  attempt,
  question: { index, total: 2, target: star, options: [cross, star], ...questionClock(secondsLeft) },
});

async function startLevel() {
  renderWithQuery(<MatchLevelPage />);
  await userEvent.click(await screen.findByRole("button", { name: "Start" }));
  await screen.findByText("Question 1 of 2");
}

/** The target is a disabled tile with the same name, so pick the tappable one. */
const option = (name: string) =>
  screen.getAllByRole("button", { name }).find((button) => !(button as HTMLButtonElement).disabled)!;

describe("Match level page", () => {
  it("starts an attempt with the chosen timer and remembers it", async () => {
    questions = [question(0, 5)];
    await startLevel();

    expect(api.post).toHaveBeenCalledWith("/match/levels/1/attempts", {
      timerSeconds: 5,
      restart: false,
    });
    expect(localStorage.getItem("pazzell_match_timer_seconds")).toBe("5");
  });

  it("submits the tapped option, shows the outcome, then moves to the next question", async () => {
    questions = [question(0, 5), question(1, 5)];
    answerResponse = {
      questionIndex: 0,
      outcome: "correct",
      correctOptionId: "shape:star",
      completed: false,
      nextQuestionIndex: 1,
      result: null,
    };
    await startLevel();

    await userEvent.click(option("Star"));

    expect(await screen.findByText("Correct!")).toBeInTheDocument();
    expect(answerCalls()).toEqual([
      ["/match/attempts/a1/answer", { questionIndex: 0, optionId: "shape:star" }],
    ]);
    expect(await screen.findByText("Question 2 of 2", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("locks the board after a tap so a second tap can't answer twice", async () => {
    questions = [question(0, 5)];
    answerResponse = {
      questionIndex: 0,
      outcome: "wrong",
      correctOptionId: "shape:star",
      completed: false,
      nextQuestionIndex: 1,
      result: null,
    };
    await startLevel();

    await userEvent.click(option("Cross"));
    expect(await screen.findByText("Not quite")).toBeInTheDocument();

    screen.getAllByRole("button", { name: "Star" }).forEach((button) => expect(button).toBeDisabled());
    expect(answerCalls()).toHaveLength(1);
  });

  it("treats a run-out timer as a failed question and asks the server for the next one", async () => {
    questions = [question(0, 0), question(1, 5)];
    renderWithQuery(<MatchLevelPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Start" }));

    expect(await screen.findByText("Time is up!")).toBeInTheDocument();
    expect(await screen.findByText("Question 2 of 2", {}, { timeout: 3000 })).toBeInTheDocument();
    // The server already recorded the timeout: nothing is submitted for it.
    expect(answerCalls()).toHaveLength(0);
    expect(questionCalls().length).toBeGreaterThanOrEqual(2);
  });

  it("shows the result with Next Level once the last answer completes the attempt", async () => {
    questions = [question(1, 5)];
    answerResponse = {
      questionIndex: 1,
      outcome: "correct",
      correctOptionId: "shape:star",
      completed: true,
      nextQuestionIndex: null,
      result: passedResult,
    };
    renderWithQuery(<MatchLevelPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Start" }));
    await screen.findByText("Question 2 of 2");

    await userEvent.click(option("Star"));

    expect(await screen.findByText("Level Complete!", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("You got 2 out of 2 correct.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Next Level/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/match/2"));
  });
});
