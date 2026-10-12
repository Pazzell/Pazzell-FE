import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiError, renderWithQuery } from "@/test-utils";

const { api, replace } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  replace: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useParams: () => ({ id: "t1" }),
}));

import AdminGenerateCardsPage from "./page";

const NOTES = "A sharp raises a note by a semitone. A flat lowers a note by a semitone.";

const draft = (n: number) => ({
  type: "definition",
  text: `Question ${n}?`,
  options: [`Right ${n}`, `Wrong ${n}`],
  correctOptionIndex: 0,
  quote: `Sentence ${n} from the notes.`,
});

const generated = (cards = [draft(1), draft(2)]) => ({
  data: {
    suggestedTitle: "Music theory",
    requested: 10,
    cards,
    document: { name: null, kind: "text", characters: 500, sampled: false },
  },
});

let info: object;

beforeEach(() => {
  vi.clearAllMocks();
  info = {
    enabled: true,
    fileTypes: ["pdf", "docx", "txt", "md"],
    maxFileBytes: 10 * 1024 * 1024,
    minCharacters: 300,
    count: { default: 10, min: 1, max: 30 },
  };
  api.get.mockImplementation((url: string) => {
    if (url === "/admin/trivia/generate") return Promise.resolve({ data: { generate: info } });
    if (url === "/admin/trivia/topics/t1") {
      return Promise.resolve({ data: { topic: { id: "t1", name: "Music Theory: Beginner" }, cards: [] } });
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
});

async function writeCards() {
  await userEvent.click(await screen.findByLabelText("Or paste your notes"));
  await userEvent.paste(NOTES);
  await userEvent.click(screen.getByRole("button", { name: "Write my cards" }));
}

describe("Admin: cards from a document", { timeout: 20000 }, () => {
  it("says so when the server has no AI key", async () => {
    info = { ...info, enabled: false };
    renderWithQuery(<AdminGenerateCardsPage />);
    expect(await screen.findByText(/not available/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Write my cards" })).not.toBeInTheDocument();
  });

  it("uploads the chosen file with the topic, as multipart", async () => {
    api.post.mockResolvedValue(generated());
    renderWithQuery(<AdminGenerateCardsPage />);
    const file = new File(["notes"], "theory.pdf", { type: "application/pdf" });
    await userEvent.upload(await screen.findByLabelText(/^Document/), file);
    await userEvent.click(screen.getByRole("button", { name: "Write my cards" }));

    await screen.findByText("Check the cards (2)");
    const [url, body] = api.post.mock.calls[0];
    expect(url).toBe("/admin/trivia/generate");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("document")).toBe(file);
    expect((body as FormData).get("count")).toBe("10");
    expect((body as FormData).get("topicId")).toBe("t1");
  });

  it("lets the admin review, edit and remove cards, then adds them to the topic", async () => {
    api.post.mockImplementation((url: string) =>
      url === "/admin/trivia/generate" ? Promise.resolve(generated()) : Promise.resolve({ data: {} })
    );
    renderWithQuery(<AdminGenerateCardsPage />);
    await writeCards();

    expect(await screen.findByText("Check the cards (2)")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/admin/trivia/generate", {
      text: NOTES,
      count: 10,
      topicId: "t1",
    });
    expect(screen.getByText(/Sentence 1 from the notes\./)).toBeInTheDocument();
    // The upload form is out of the way while the cards are checked.
    expect(screen.queryByRole("button", { name: "Write my cards" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Card 1 option 2 is correct"));
    await userEvent.click(screen.getByRole("button", { name: "Remove card 2" }));
    await userEvent.click(screen.getByRole("button", { name: "Save 1 card" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/topics/t1"));
    expect(api.post).toHaveBeenCalledWith("/admin/trivia/topics/t1/cards/bulk", {
      cards: [
        { type: "definition", text: "Question 1?", options: ["Right 1", "Wrong 1"], correctOptionIndex: 1 },
      ],
    });
  });

  it("does not save a card with a blank option", async () => {
    api.post.mockResolvedValue(generated());
    renderWithQuery(<AdminGenerateCardsPage />);
    await writeCards();
    await screen.findByText("Check the cards (2)");
    await userEvent.clear(screen.getByLabelText("Card 2 option 1"));
    await userEvent.click(screen.getByRole("button", { name: "Save 2 cards" }));
    expect(api.post).toHaveBeenCalledTimes(1); // only the generate call
  });

  it("stays on the form when the document can't be used", async () => {
    api.post.mockRejectedValue(apiError(400, "DOCUMENT_UNREADABLE"));
    renderWithQuery(<AdminGenerateCardsPage />);
    await writeCards();
    expect(await screen.findByRole("button", { name: "Write my cards" })).toBeEnabled();
    expect(screen.queryByText(/Check the cards/)).not.toBeInTheDocument();
  });

  it("comes back to the same notes on Start over", async () => {
    api.post.mockResolvedValue(generated());
    renderWithQuery(<AdminGenerateCardsPage />);
    await writeCards();
    await screen.findByText("Check the cards (2)");
    await userEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByLabelText("Or paste your notes")).toHaveValue(NOTES);
    expect(screen.getByRole("button", { name: "Write my cards" })).toBeEnabled();
  });
});
