import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEST_SETTINGS, questionClock, renderWithQuery } from "@/test-utils";

const { api, push, replace } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useParams: () => ({ sessionId: "s1" }),
}));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import TriviaPlayPage from "./page";

const source = { type: "topic", id: "t1", title: "Football" };
let status = "studying";

const session = () => ({
  id: "s1",
  status,
  source,
  isPreview: false,
  timerSeconds: 5,
  cardCount: 2,
  currentIndex: 0,
  brand: null,
  startedAt: "2026-10-06T10:00:00.000Z",
  quizStartedAt: null,
  completedAt: null,
});

const gate = { required: false, counter: 1, threshold: 10, campaign: null as object | null };

beforeEach(() => {
  vi.clearAllMocks();
  status = "studying";
  gate.required = false;
  gate.campaign = null;

  api.get.mockImplementation((url: string) => {
    if (url === "/settings/game") return Promise.resolve({ data: { settings: TEST_SETTINGS } });
    if (url === "/trivia/sessions/s1") return Promise.resolve({ data: { session: session() } });
    if (url === "/trivia/sessions/s1/study") {
      return Promise.resolve({
        data: {
          session: session(),
          cards: [
            {
              position: 1,
              total: 2,
              type: "definition",
              imageUrl: null,
              text: "The only player allowed to handle the ball",
              options: [
                { text: "Goalkeeper", isCorrect: true },
                { text: "Striker", isCorrect: false },
              ],
            },
            {
              position: 2,
              total: 2,
              type: "definition",
              imageUrl: null,
              text: "Players on the pitch per team",
              options: [
                { text: "Nine", isCorrect: false },
                { text: "Eleven", isCorrect: true },
              ],
            },
          ],
        },
      });
    }
    if (url === "/trivia/sessions/s1/question") {
      return Promise.resolve({
        data: {
          completed: false,
          question: {
            index: 1,
            total: 2,
            type: "definition",
            imageUrl: null,
            text: "Players on the pitch per team",
            options: [
              { index: 0, text: "Eleven" },
              { index: 1, text: "Nine" },
            ],
            ...questionClock(5),
          },
        },
      });
    }
    if (url === "/trivia/sessions/s1/result") {
      return Promise.resolve({
        data: {
          result: {
            sessionId: "s1",
            source,
            correct: 1,
            total: 2,
            isPreview: false,
            brand: null,
            completedAt: "2026-10-06T10:01:00.000Z",
            campaignGate: gate,
          },
        },
      });
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });

  api.post.mockImplementation((url: string) => {
    if (url === "/trivia/sessions/s1/quiz/begin") {
      return Promise.resolve({ data: { session: { ...session(), status: "quiz" } } });
    }
    if (url === "/trivia/sessions") {
      return Promise.resolve({ data: { resumed: false, session: { ...session(), id: "s2" } } });
    }
    if (url.startsWith("/analytics/")) return Promise.resolve({ data: {} });
    return Promise.reject(new Error(`Unhandled POST ${url}`));
  });
});

describe("Trivia play page", () => {
  it("shows the study cards with the answers, then moves to the quiz on Start Quiz", async () => {
    renderWithQuery(<TriviaPlayPage />);

    expect(await screen.findByText("The only player allowed to handle the ball")).toBeInTheDocument();
    expect(screen.getAllByText("(correct answer)")).toHaveLength(2);
    expect(screen.getByText("1 of 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start Quiz" }));

    expect(await screen.findByText("Question 2 of 2")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/trivia/sessions/s1/quiz/begin");
    // The quiz phase never shows which option is right.
    expect(screen.queryByText("(correct answer)")).not.toBeInTheDocument();
  });

  it("resumes straight into the quiz on a refresh mid-quiz, without the study cards", async () => {
    status = "quiz";
    renderWithQuery(<TriviaPlayPage />);

    expect(await screen.findByText("Question 2 of 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start Quiz" })).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/trivia/sessions/s1/study");
  });

  it("shows the result for a finished session and retries with the same choices", async () => {
    status = "completed";
    renderWithQuery(<TriviaPlayPage />);

    expect(await screen.findByText("You got 1 out of 2 correct.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Retry/ }));
    expect(api.post).toHaveBeenCalledWith("/trivia/sessions", {
      sourceType: "topic",
      sourceId: "t1",
      timerSeconds: 5,
      cardCount: 2,
    });
    expect(await screen.findByRole("button", { name: /Pick Another Topic/ })).toBeInTheDocument();
  });

  it("offers the sponsored trivia instead of Retry when one is owed", async () => {
    status = "completed";
    gate.required = true;
    gate.campaign = {
      id: "c1",
      title: "Spring launch",
      brandName: "Acme",
      endsAt: "2026-11-05T09:00:00.000Z",
    };
    renderWithQuery(<TriviaPlayPage />);

    expect(await screen.findByText("Spring launch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Play Sponsored Trivia/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retry/ })).not.toBeInTheDocument();
  });

  it("explains an abandoned session instead of trying to play it", async () => {
    status = "abandoned";
    renderWithQuery(<TriviaPlayPage />);

    expect(await screen.findByText("This trivia was left early")).toBeInTheDocument();
  });
});
