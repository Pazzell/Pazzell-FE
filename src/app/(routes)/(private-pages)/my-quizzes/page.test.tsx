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
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import MyQuizzesPage from "./page";
import NewQuizPage from "./new/page";

const quiz = (overrides: object = {}) => ({
  id: "q1",
  title: "Capital cities",
  description: null,
  coverImageUrl: null,
  status: "draft",
  shareSlug: null,
  shareUrl: null,
  defaultTimerSeconds: 5,
  defaultCardCount: 5,
  cardCount: 3,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

let listResponse: object;

beforeEach(() => {
  vi.clearAllMocks();
  listResponse = { quizzes: [quiz()], plan: "freemium", limit: 1 };
  api.get.mockImplementation((url: string) => {
    if (url === "/settings/game") return Promise.resolve({ data: { settings: TEST_SETTINGS } });
    if (url === "/custom-quizzes") return Promise.resolve({ data: listResponse });
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });
});

describe("My Quizzes page", () => {
  it("shows the upgrade prompt instead of the builder when the free limit is reached", async () => {
    renderWithQuery(<MyQuizzesPage />);

    expect(await screen.findByText("1 of 1 free quiz used")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /New Quiz/ }));

    expect(await screen.findByText("Upgrade to Pro")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See Pro" })).toHaveAttribute("href", "/pro");
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the builder when there is room for another quiz", async () => {
    listResponse = { quizzes: [quiz()], plan: "pro", limit: null };
    renderWithQuery(<MyQuizzesPage />);

    await screen.findByText(/unlimited with Pro/);
    await userEvent.click(screen.getByRole("button", { name: /New Quiz/ }));

    expect(push).toHaveBeenCalledWith("/my-quizzes/new");
    expect(screen.queryByText("Upgrade to Pro")).not.toBeInTheDocument();
  });

  it("tells the owner a locked quiz needs Pro renewed", async () => {
    listResponse = { quizzes: [quiz({ status: "locked" })], plan: "freemium", limit: 1 };
    renderWithQuery(<MyQuizzesPage />);

    expect(await screen.findByText("Locked")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Renew Pro" })).toHaveAttribute("href", "/pro");
  });
});

describe("New Quiz page", () => {
  it("shows the upgrade prompt when the server rejects creation with UPGRADE_REQUIRED", async () => {
    api.post.mockRejectedValue(
      apiError(403, "UPGRADE_REQUIRED", { feature: "custom_quiz", limit: 1, current: 1 })
    );
    renderWithQuery(<NewQuizPage />);

    await userEvent.type(screen.getByLabelText("Title"), "Rivers");
    await userEvent.click(screen.getByRole("button", { name: "Create Quiz" }));

    expect(await screen.findByText("Upgrade to Pro")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("creates the draft and goes on to the builder", async () => {
    api.post.mockResolvedValue({ data: { quiz: quiz({ id: "q2", title: "Rivers" }) } });
    renderWithQuery(<NewQuizPage />);

    await userEvent.type(screen.getByLabelText("Title"), "Rivers");
    await userEvent.click(screen.getByRole("button", { name: "Create Quiz" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/my-quizzes/q2/edit"));
    expect(api.post).toHaveBeenCalledWith("/custom-quizzes", {
      title: "Rivers",
      description: "",
      defaultTimerSeconds: 5,
      defaultCardCount: 5,
    });
  });
});
