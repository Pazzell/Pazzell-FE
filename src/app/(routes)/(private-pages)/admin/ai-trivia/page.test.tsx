import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiError, renderWithQuery } from "@/test-utils";

const { api, push } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  push: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ id: "a1" }),
}));

import AdminAiTriviaPage from "./page";
import AdminAiTriviaReviewPage from "./[id]/page";

const trivia = (overrides: object = {}) => ({
  id: "a1",
  title: "Emperors of Rome",
  topic: { id: null, name: "Roman emperors" },
  prompt: "Hard questions about the first century",
  reviewStatus: "pending",
  reviewNote: null,
  reviewedAt: null,
  publishedTopicId: null,
  publishedCardCount: null,
  cardCount: 2,
  owner: { id: "u1", name: "ada" },
  createdAt: "2026-10-14T00:00:00.000Z",
  ...overrides,
});

const card = (n: number) => ({
  id: `c${n}`,
  type: "definition",
  imageUrl: null,
  text: `Question ${n}?`,
  options: [`Right ${n}`, `Wrong ${n}`],
  correctOptionIndex: 0,
  createdAt: "2026-10-14T00:00:00.000Z",
  updatedAt: "2026-10-14T00:00:00.000Z",
});

let detail: object;

beforeEach(() => {
  vi.clearAllMocks();
  detail = { trivia: trivia(), cards: [card(1), card(2)] };
  api.get.mockImplementation((url: string) => {
    if (url.startsWith("/admin/trivia/ai?status=")) {
      return Promise.resolve({ data: { trivias: url.endsWith("pending") ? [trivia()] : [] } });
    }
    if (url === "/admin/trivia/ai/a1") return Promise.resolve({ data: detail });
    if (url === "/admin/trivia/topics") {
      return Promise.resolve({
        data: { topics: [{ id: "t1", name: "History", isActive: true, cardCount: 4 }] },
      });
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
});

describe("Admin AI trivia list", () => {
  it("shows what is waiting and filters by review status", async () => {
    renderWithQuery(<AdminAiTriviaPage />);

    const link = await screen.findByRole("link", { name: /Emperors of Rome/ });
    expect(link).toHaveAttribute("href", "/admin/ai-trivia/a1");
    expect(screen.getByText(/by ada/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Approved" }));
    expect(await screen.findByText("Nothing here yet.")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/admin/trivia/ai?status=approved");
  });
});

describe("Admin AI trivia review", () => {
  const approved = {
    data: { trivia: trivia({ reviewStatus: "approved" }), topic: { name: "History" }, added: 1, skipped: 0 },
  };

  it("shows the prompt and every marked answer, and approves into the player's topic", async () => {
    api.post.mockResolvedValue(approved);
    renderWithQuery(<AdminAiTriviaReviewPage />);

    expect(await screen.findByText("Hard questions about the first century")).toBeInTheDocument();
    expect(screen.getByText("Question 1?")).toBeInTheDocument();
    expect(screen.getAllByText("(marked correct)")).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: /Approve 2 questions/ }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/trivia/ai/a1/approve", {}));
  });

  it("approves only the ticked questions, into a topic the admin picks", async () => {
    api.post.mockResolvedValue(approved);
    renderWithQuery(<AdminAiTriviaReviewPage />);

    await userEvent.click(await screen.findByRole("checkbox", { name: "Include question 2" }));
    await userEvent.selectOptions(await screen.findByLabelText("Add the questions to"), "t1");
    await userEvent.type(screen.getByLabelText("Note (optional)"), "One was wrong");
    await userEvent.click(screen.getByRole("button", { name: /Approve 1 question$/ }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/admin/trivia/ai/a1/approve", {
        topicId: "t1",
        cardIds: ["c1"],
        note: "One was wrong",
      })
    );
  });

  it("names a new topic when the admin asks for one", async () => {
    api.post.mockResolvedValue(approved);
    renderWithQuery(<AdminAiTriviaReviewPage />);

    await userEvent.selectOptions(await screen.findByLabelText("Add the questions to"), "new");
    await userEvent.click(screen.getByRole("button", { name: /Approve 2 questions/ }));
    expect(api.post).not.toHaveBeenCalled(); // no name yet

    await userEvent.type(screen.getByLabelText("New topic name"), "Ancient Rome");
    await userEvent.click(screen.getByRole("button", { name: /Approve 2 questions/ }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/admin/trivia/ai/a1/approve", { topicName: "Ancient Rome" })
    );
  });

  it("rejects after confirmation", async () => {
    api.post.mockResolvedValue({ data: { trivia: trivia({ reviewStatus: "rejected" }) } });
    renderWithQuery(<AdminAiTriviaReviewPage />);

    await userEvent.click(await screen.findByRole("button", { name: /Reject/ }));
    await userEvent.click(screen.getAllByRole("button", { name: "Reject" }).at(-1)!);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/trivia/ai/a1/reject", {}));
  });

  it("reloads when someone else already reviewed it", async () => {
    api.post.mockRejectedValue(apiError(409, "ALREADY_REVIEWED"));
    renderWithQuery(<AdminAiTriviaReviewPage />);

    await userEvent.click(await screen.findByRole("button", { name: /Approve 2 questions/ }));
    await waitFor(() =>
      expect(api.get.mock.calls.filter(([url]) => url === "/admin/trivia/ai/a1").length).toBeGreaterThan(1)
    );
  });

  it("shows a reviewed trivia without the review controls", async () => {
    detail = {
      trivia: trivia({ reviewStatus: "approved", publishedTopicId: "t1", publishedCardCount: 2 }),
      cards: [card(1), card(2)],
    };
    renderWithQuery(<AdminAiTriviaReviewPage />);

    expect(await screen.findByRole("link", { name: "History" })).toHaveAttribute("href", "/admin/topics/t1");
    expect(screen.queryByRole("button", { name: /Approve/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
