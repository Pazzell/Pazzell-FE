import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEST_SETTINGS, apiError, renderWithQuery } from "@/test-utils";

const { api, replace } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  replace: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import GenerateQuizPage from "./page";

const NOTES = "Assets equal liabilities plus equity. Depreciation spreads cost over useful life.";

const generateInfo = (overrides: object = {}) => ({
  enabled: true,
  fileTypes: ["pdf", "docx", "txt", "md"],
  maxFileBytes: 10 * 1024 * 1024,
  minCharacters: 300,
  count: { default: 10, min: 1, max: 30 },
  dailyLimit: 3,
  usedToday: 0,
  remaining: 3,
  resetsAt: "2026-10-12T00:00:00.000Z",
  ...overrides,
});

const draft = (n: number) => ({
  type: "definition",
  text: `Question ${n}?`,
  options: [`Right ${n}`, `Wrong ${n}`],
  correctOptionIndex: 0,
  quote: `Sentence ${n} from the notes.`,
});

const generated = (cards = [draft(1), draft(2)]) => ({
  data: {
    suggestedTitle: "Accounting basics",
    requested: 10,
    cards,
    document: { name: null, kind: "text", characters: 500, sampled: false },
    usage: { dailyLimit: 3, usedToday: 1, remaining: 2, resetsAt: "2026-10-12T00:00:00.000Z" },
  },
});

let info: object;
let list: object;

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/my-quizzes/generate");
  info = generateInfo();
  list = { quizzes: [], plan: "freemium", limit: 1 };
  api.get.mockImplementation((url: string) => {
    if (url === "/settings/game") return Promise.resolve({ data: { settings: TEST_SETTINGS } });
    if (url === "/custom-quizzes/generate") return Promise.resolve({ data: { generate: info } });
    if (url === "/custom-quizzes") return Promise.resolve({ data: list });
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
});

async function writeCards() {
  // Pasted rather than typed key by key, which is slow when the whole suite runs.
  await userEvent.click(await screen.findByLabelText("Or paste your notes"));
  await userEvent.paste(NOTES);
  await userEvent.click(screen.getByRole("button", { name: "Write my cards" }));
}

describe("Quiz from a document", { timeout: 20000 }, () => {
  it("says so when the feature is switched off on the server", async () => {
    info = generateInfo({ enabled: false });
    renderWithQuery(<GenerateQuizPage />);
    expect(await screen.findByText(/not available yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Write my cards" })).not.toBeInTheDocument();
  });

  it("shows the daily allowance and blocks the button when it is used up", async () => {
    info = generateInfo({ usedToday: 3, remaining: 0 });
    renderWithQuery(<GenerateQuizPage />);
    expect(await screen.findByText("0 of 3 documents left today")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Write my cards" })).toBeDisabled();
  });

  it("asks for a document before calling the server", async () => {
    renderWithQuery(<GenerateQuizPage />);
    await userEvent.click(await screen.findByRole("button", { name: "Write my cards" }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("uploads the chosen file as multipart", async () => {
    api.post.mockResolvedValue(generated());
    renderWithQuery(<GenerateQuizPage />);
    const file = new File(["notes"], "accounting.pdf", { type: "application/pdf" });
    await userEvent.upload(await screen.findByLabelText(/^Document/), file);
    expect(screen.getByText("accounting.pdf")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Write my cards" }));

    await screen.findByText("Check your cards (2)");
    const [url, body] = api.post.mock.calls[0];
    expect(url).toBe("/custom-quizzes/generate");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("document")).toBe(file);
    expect((body as FormData).get("count")).toBe("10");
  });

  it("lets the player review, edit and remove cards, then creates the quiz with them", async () => {
    api.post.mockImplementation((url: string) => {
      if (url === "/custom-quizzes/generate") return Promise.resolve(generated());
      if (url === "/custom-quizzes") return Promise.resolve({ data: { quiz: { id: "q9" } } });
      return Promise.resolve({ data: {} });
    });
    renderWithQuery(<GenerateQuizPage />);
    await writeCards();

    expect(await screen.findByText("Check your cards (2)")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/custom-quizzes/generate", { text: NOTES, count: 10 });
    expect(screen.getByLabelText("Title")).toHaveValue("Accounting basics");
    expect(screen.getByText(/Sentence 1 from the notes\./)).toBeInTheDocument();

    // Fix a question, flip the correct option, and drop the second card.
    const question = screen.getByLabelText("Card 1 question");
    await userEvent.clear(question);
    await userEvent.type(question, "What do assets equal?");
    await userEvent.click(screen.getByLabelText("Card 1 option 2 is correct"));
    await userEvent.click(screen.getByRole("button", { name: "Remove card 2" }));
    await userEvent.click(screen.getByRole("button", { name: "Save 1 card" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-quizzes/q9/edit"));
    expect(api.post).toHaveBeenCalledWith("/custom-quizzes", {
      title: "Accounting basics",
      description: "",
      defaultTimerSeconds: 5,
      defaultCardCount: 5,
    });
    expect(api.post).toHaveBeenCalledWith("/custom-quizzes/q9/cards/bulk", {
      cards: [
        {
          type: "definition",
          text: "What do assets equal?",
          options: ["Right 1", "Wrong 1"],
          correctOptionIndex: 1,
        },
      ],
    });
  });

  it("adds the cards to an existing quiz when the free plan has no room for a new one", async () => {
    list = { quizzes: [{ id: "q1", title: "My only quiz" }], plan: "freemium", limit: 1 };
    api.post.mockImplementation((url: string) =>
      url === "/custom-quizzes/generate" ? Promise.resolve(generated()) : Promise.resolve({ data: {} })
    );
    renderWithQuery(<GenerateQuizPage />);
    await writeCards();

    await screen.findByText("Check your cards (2)");
    expect(screen.getByLabelText("Save to")).toHaveValue("q1");
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save 2 cards" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-quizzes/q1/edit"));
    expect(api.post).not.toHaveBeenCalledWith("/custom-quizzes", expect.anything());
    expect(api.post).toHaveBeenCalledWith("/custom-quizzes/q1/cards/bulk", expect.anything());
  });

  it("does not save a card with a blank option", async () => {
    api.post.mockResolvedValue(generated());
    renderWithQuery(<GenerateQuizPage />);
    await writeCards();
    await screen.findByText("Check your cards (2)");
    await userEvent.clear(screen.getByLabelText("Card 2 option 1"));
    await userEvent.click(screen.getByRole("button", { name: "Save 2 cards" }));
    expect(api.post).toHaveBeenCalledTimes(1); // only the generate call
  });

  it("offers Pro when a freemium player runs out of documents", async () => {
    api.post.mockRejectedValue(apiError(429, "GENERATION_LIMIT_REACHED", { dailyLimit: 3, isPro: false }));
    renderWithQuery(<GenerateQuizPage />);
    await writeCards();
    expect(await screen.findByText("Upgrade to Pro")).toBeInTheDocument();
  });
});
