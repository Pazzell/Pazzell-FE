import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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

import confetti from "canvas-confetti";
import TriviaPlayPage from "./page";

const source = { type: "topic", id: "t1", title: "Football" };
let status = "quiz";
let practice = false;

const session = () => ({
  id: "s1",
  status,
  source,
  isPreview: false,
  practice,
  timerSeconds: 5,
  cardCount: 2,
  currentIndex: 0,
  brand: null,
  startedAt: "2026-10-06T10:00:00.000Z",
  completedAt: null,
});

const gate = { required: false, counter: 1, threshold: 10, campaign: null as object | null };

beforeEach(() => {
  vi.clearAllMocks();
  status = "quiz";
  practice = false;
  gate.required = false;
  gate.campaign = null;

  api.get.mockImplementation((url: string) => {
    if (url === "/settings/game") return Promise.resolve({ data: { settings: TEST_SETTINGS } });
    if (url === "/trivia/sessions/s1") return Promise.resolve({ data: { session: session() } });
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
    if (url === "/trivia/sessions") {
      return Promise.resolve({ data: { resumed: false, session: { ...session(), id: "s2" } } });
    }
    if (url.startsWith("/analytics/")) return Promise.resolve({ data: {} });
    return Promise.reject(new Error(`Unhandled POST ${url}`));
  });
});

describe("Trivia play page", () => {
  it("opens straight on the current question, with no study step", async () => {
    renderWithQuery(<TriviaPlayPage />);

    expect(await screen.findByText("Question 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Football")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start Quiz" })).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/trivia/sessions/s1/study");
    expect(api.post).not.toHaveBeenCalledWith("/trivia/sessions/s1/quiz/begin");
  });

  it("leaves the trivia from the quiz screen", async () => {
    api.post.mockImplementation((url: string) =>
      url === "/trivia/sessions/s1/abandon" || url.startsWith("/analytics/")
        ? Promise.resolve({ data: {} })
        : Promise.reject(new Error(`Unhandled POST ${url}`))
    );
    renderWithQuery(<TriviaPlayPage />);

    await userEvent.click(await screen.findByRole("button", { name: "Leave this trivia" }));
    expect(api.post).toHaveBeenCalledWith("/trivia/sessions/s1/abandon");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/trivia"));
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
      practice: false,
      replayOf: "s1",
    });
    expect(await screen.findByRole("button", { name: /Pick Another Topic/ })).toBeInTheDocument();
    // A real play has nothing to "play for real".
    expect(screen.queryByRole("button", { name: /Play Now/ })).not.toBeInTheDocument();
  });

  it("offers Play Now after a practice, starting the same trivia without the pointer", async () => {
    status = "completed";
    practice = true;
    renderWithQuery(<TriviaPlayPage />);

    expect(await screen.findByText("Practice Complete!")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Play Now/ }));
    expect(api.post).toHaveBeenCalledWith("/trivia/sessions", {
      sourceType: "topic",
      sourceId: "t1",
      timerSeconds: 5,
      cardCount: 2,
      practice: false,
      replayOf: "s1",
    });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/play/s2"));
  });

  it("can practise the same trivia again after a practice", async () => {
    status = "completed";
    practice = true;
    renderWithQuery(<TriviaPlayPage />);

    await userEvent.click(await screen.findByRole("button", { name: /Practise Again/ }));
    expect(api.post).toHaveBeenCalledWith("/trivia/sessions", {
      sourceType: "topic",
      sourceId: "t1",
      timerSeconds: 5,
      cardCount: 2,
      practice: true,
      replayOf: "s1",
    });
  });

  const finishWith = (correct: number, outcome: "correct" | "wrong") => {
    api.post.mockImplementation((url: string) => {
      if (url === "/trivia/sessions/s1/answer") {
        return Promise.resolve({
          data: {
            questionIndex: 1,
            outcome,
            correctOptionIndex: 0,
            completed: true,
            nextQuestionIndex: null,
            result: {
              sessionId: "s1",
              source,
              correct,
              total: 2,
              isPreview: false,
              brand: null,
              completedAt: "2026-10-06T10:01:00.000Z",
              campaignGate: gate,
            },
          },
        });
      }
      if (url.startsWith("/analytics/")) return Promise.resolve({ data: {} });
      return Promise.reject(new Error(`Unhandled POST ${url}`));
    });
  };

  it.each([false, true])(
    "throws confetti once the game ends with every answer correct (practice: %s)",
    async (isPractice) => {
      practice = isPractice;
      finishWith(2, "correct");
      renderWithQuery(<TriviaPlayPage />);

      await userEvent.click(await screen.findByRole("button", { name: /Eleven/ }));
      expect(await screen.findByText("Correct!")).toBeInTheDocument();
      // A right answer on its own is not celebrated; only the clean sweep is.
      expect(confetti).not.toHaveBeenCalled();

      expect(
        await screen.findByText("You got 2 out of 2 correct.", {}, { timeout: 3000 })
      ).toBeInTheDocument();
      expect(confetti).toHaveBeenCalled();
    }
  );

  it("throws no confetti when an answer was missed", async () => {
    finishWith(1, "wrong");
    renderWithQuery(<TriviaPlayPage />);

    await userEvent.click(await screen.findByRole("button", { name: /Nine/ }));
    expect(
      await screen.findByText("You got 1 out of 2 correct.", {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
  });

  it("throws no confetti when an old perfect result is reopened", async () => {
    status = "completed";
    api.get.mockImplementation((url: string) => {
      if (url === "/settings/game") return Promise.resolve({ data: { settings: TEST_SETTINGS } });
      if (url === "/trivia/sessions/s1") return Promise.resolve({ data: { session: session() } });
      return Promise.resolve({
        data: {
          result: {
            sessionId: "s1",
            source,
            correct: 2,
            total: 2,
            isPreview: false,
            brand: null,
            completedAt: "2026-10-06T10:01:00.000Z",
            campaignGate: gate,
          },
        },
      });
    });
    renderWithQuery(<TriviaPlayPage />);

    expect(await screen.findByText("You got 2 out of 2 correct.")).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
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
