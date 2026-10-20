import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiError, questionClock, renderWithQuery } from "@/test-utils";
import type { TriviaSession } from "@/types";

const { api } = vi.hoisted(() => ({ api: { get: vi.fn(), post: vi.fn() } }));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

import { QuizStage } from "./quiz-stage";

const session: TriviaSession = {
  id: "s1",
  status: "quiz",
  source: { type: "topic", id: "t1", title: "Football" },
  isPreview: false,
  practice: false,
  timerSeconds: 5,
  cardCount: 2,
  currentIndex: 0,
  brand: null,
  startedAt: "2026-10-06T10:00:00.000Z",
  completedAt: null,
};

const result = {
  sessionId: "s1",
  source: session.source,
  correct: 2,
  total: 2,
  isPreview: false,
  brand: null,
  completedAt: "2026-10-06T10:01:00.000Z",
  campaignGate: { required: false, counter: 1, threshold: 10, campaign: null },
};

const question = (index: number, secondsLeft: number) => ({
  completed: false,
  question: {
    index,
    total: 2,
    type: "definition",
    imageUrl: null,
    text: `Question text ${index + 1}`,
    options: [
      { index: 0, text: "Striker" },
      { index: 1, text: "Goalkeeper" },
    ],
    ...questionClock(secondsLeft),
  },
});

/** What `GET /question` returns on each successive call. */
let questions: object[] = [];
let answer: () => Promise<{ data: object }>;

const answerCalls = () =>
  api.post.mock.calls.filter((call) => String(call[0]).endsWith("/answer"));

beforeEach(() => {
  vi.clearAllMocks();
  questions = [];
  api.get.mockImplementation((url: string) => {
    if (url === "/trivia/sessions/s1/question") {
      const next = questions.length > 1 ? questions.shift() : questions[0];
      return Promise.resolve({ data: next });
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
  api.post.mockImplementation((url: string) => {
    if (url.endsWith("/answer")) return answer();
    if (url.endsWith("/abandon")) return Promise.resolve({ data: {} });
    if (url.startsWith("/analytics/")) return Promise.resolve({ data: {} });
    return Promise.reject(new Error(`Unhandled POST ${url}`));
  });
});

const answered = (overrides: object) => () =>
  Promise.resolve({
    data: {
      questionIndex: 0,
      outcome: "correct",
      correctOptionIndex: 1,
      completed: false,
      nextQuestionIndex: 1,
      result: null,
      ...overrides,
    },
  });

describe("QuizStage", () => {
  it("answers with a single tap on an option, with no Submit button", async () => {
    questions = [question(0, 5), question(1, 5)];
    answer = answered({});
    renderWithQuery(<QuizStage session={session} onCompleted={vi.fn()} />);

    await screen.findByText("Question text 1");
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
    expect(answerCalls()).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Goalkeeper" }));
    expect(await screen.findByText("Correct!")).toBeInTheDocument();
    expect(answerCalls()).toEqual([
      ["/trivia/sessions/s1/answer", { questionIndex: 0, optionIndex: 1 }],
    ]);
    expect(await screen.findByText("Question text 2", {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("fails the question on timeout without submitting, then moves on", async () => {
    questions = [question(0, 0), question(1, 5)];
    answer = answered({});
    renderWithQuery(<QuizStage session={session} onCompleted={vi.fn()} />);

    expect(await screen.findByText("Time is up!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Goalkeeper" })).toBeDisabled();
    expect(await screen.findByText("Question text 2", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(answerCalls()).toHaveLength(0);
  });

  it("waits for Next when there is no timer, with no countdown", async () => {
    const noClock = (index: number) => {
      const q = question(index, 5);
      return { ...q, question: { ...q.question, timerSeconds: 0, deadlineAt: null, remainingMs: null } };
    };
    questions = [noClock(0), noClock(1)];
    answer = answered({});
    renderWithQuery(<QuizStage session={{ ...session, timerSeconds: 0 }} onCompleted={vi.fn()} />);

    await screen.findByText("Question text 1");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Next/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Goalkeeper" }));
    expect(await screen.findByText("Correct!")).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 1500));
    expect(screen.queryByText("Question text 2")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(await screen.findByText("Question text 2")).toBeInTheDocument();
  });

  it("ends the quiz after confirming, which cancels the session", async () => {
    questions = [question(0, 5)];
    renderWithQuery(<QuizStage session={session} onCompleted={vi.fn()} />);
    await screen.findByText("Question text 1");

    await userEvent.click(screen.getByRole("button", { name: "End" }));
    expect(screen.getByText("End this quiz?")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalledWith("/trivia/sessions/s1/abandon");

    await userEvent.click(screen.getByRole("button", { name: "End quiz" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/trivia/sessions/s1/abandon"));
  });

  it("hands the result over when the last answer completes the session", async () => {
    questions = [question(1, 5)];
    answer = answered({ questionIndex: 1, completed: true, nextQuestionIndex: null, result });
    const onCompleted = vi.fn();
    renderWithQuery(<QuizStage session={session} onCompleted={onCompleted} />);

    await screen.findByText("Question text 2");
    await userEvent.click(screen.getByRole("button", { name: "Goalkeeper" }));

    await waitFor(() => expect(onCompleted).toHaveBeenCalledWith(result), { timeout: 3000 });
  });

  it("goes straight to the result when the server says nothing is left (resume after the end)", async () => {
    questions = [{ completed: true, result }];
    const onCompleted = vi.fn();
    renderWithQuery(<QuizStage session={session} onCompleted={onCompleted} />);

    await waitFor(() => expect(onCompleted).toHaveBeenCalledWith(result));
  });

  it("re-syncs to the server's current question when an answer is rejected", async () => {
    questions = [question(0, 5), question(1, 5)];
    answer = () => Promise.reject(apiError(409, "NOT_CURRENT_QUESTION", { currentIndex: 1 }));
    renderWithQuery(<QuizStage session={session} onCompleted={vi.fn()} />);

    await screen.findByText("Question text 1");
    await userEvent.click(screen.getByRole("button", { name: "Striker" }));

    expect(await screen.findByText("Question text 2")).toBeInTheDocument();
  });

  it("locks the options after a tap so a second tap can't answer twice", async () => {
    questions = [question(0, 5), question(1, 5)];
    answer = answered({ outcome: "wrong" });
    renderWithQuery(<QuizStage session={session} onCompleted={vi.fn()} />);

    await screen.findByText("Question text 1");
    await userEvent.click(screen.getByRole("button", { name: /Striker/ }));
    expect(await screen.findByText("Not quite")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Goalkeeper/ })).toBeDisabled();
    expect(answerCalls()).toHaveLength(1);
  });

  it("shows the picture credit on an image question", async () => {
    const withImage = question(0, 5) as { question: Record<string, unknown> };
    withImage.question.imageUrl = "https://img.example/dog.webp";
    withImage.question.attribution = "Markus Trienke · CC BY-SA 2.0 · Wikimedia Commons";
    questions = [withImage];
    answer = answered({});
    renderWithQuery(<QuizStage session={session} onCompleted={vi.fn()} />);

    expect(
      await screen.findByText("Markus Trienke · CC BY-SA 2.0 · Wikimedia Commons")
    ).toBeInTheDocument();
  });

  it("shows no pointer when practice is off", async () => {
    questions = [question(0, 5)];
    answer = answered({});
    renderWithQuery(<QuizStage session={session} onCompleted={vi.fn()} />);

    await screen.findByText("Question text 1");
    expect(screen.queryByTestId("practice-pointer")).not.toBeInTheDocument();
    expect(screen.queryByText("Practice")).not.toBeInTheDocument();
  });

  it("points at the correct option in practice, and still answers with a tap", async () => {
    const practiceQuestion = (index: number) => {
      const q = question(index, 5) as { question: Record<string, unknown> };
      q.question.correctOptionIndex = 1;
      return q;
    };
    questions = [practiceQuestion(0), practiceQuestion(1)];
    answer = answered({});
    renderWithQuery(<QuizStage session={{ ...session, practice: true }} onCompleted={vi.fn()} />);

    await screen.findByText("Question text 1");
    expect(screen.getByText("Practice")).toBeInTheDocument();
    const pointed = screen.getByRole("button", { name: /Goalkeeper/ });
    expect(pointed).toContainElement(screen.getByTestId("practice-pointer"));
    expect(screen.getByRole("button", { name: /Striker/ })).not.toContainElement(
      screen.getByTestId("practice-pointer")
    );

    await userEvent.click(pointed);
    expect(await screen.findByText("Correct!")).toBeInTheDocument();
    expect(answerCalls()).toEqual([
      ["/trivia/sessions/s1/answer", { questionIndex: 0, optionIndex: 1 }],
    ]);
    // The pointer gives way to the normal feedback once the question is answered.
    expect(screen.queryByTestId("practice-pointer")).not.toBeInTheDocument();
  });

  it("marks a wrong tap as wrong in practice too", async () => {
    const q = question(0, 5) as { question: Record<string, unknown> };
    q.question.correctOptionIndex = 1;
    questions = [q, question(1, 5)];
    answer = answered({ outcome: "wrong" });
    renderWithQuery(<QuizStage session={{ ...session, practice: true }} onCompleted={vi.fn()} />);

    await screen.findByText("Question text 1");
    await userEvent.click(screen.getByRole("button", { name: "Striker" }));
    expect(await screen.findByText("Not quite")).toBeInTheDocument();
  });

  it("blocks the browser back button while the quiz is running", async () => {
    questions = [question(0, 5)];
    answer = answered({});
    const pushState = vi.spyOn(window.history, "pushState");
    renderWithQuery(<QuizStage session={session} onCompleted={vi.fn()} />);
    await screen.findByText("Question text 1");

    const before = pushState.mock.calls.length;
    expect(before).toBeGreaterThan(0);
    // Going back is undone by pushing the current entry straight back on.
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(pushState.mock.calls.length).toBe(before + 1);
    pushState.mockRestore();
  });
});
