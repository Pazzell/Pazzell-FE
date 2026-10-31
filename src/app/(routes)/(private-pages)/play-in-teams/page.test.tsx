import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQuery } from "@/test-utils";
import { ENDPOINTS } from "@/app/_utils/endpoints";

const { api, push } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  push: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ api, getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import PlayInTeamsPage from "./page";

const topic = (id: string, name: string, cardCount: number) => ({
  id,
  name,
  slug: id,
  description: null,
  coverImageUrl: null,
  cardCount,
  cardCountBounds: { available: cardCount, min: 5, max: cardCount },
});

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({
    data: { topics: [topic("t1", "Football", 20), topic("t2", "Tiny", 5), topic("t3", "Food", 12)] },
  });
  api.post.mockResolvedValue({ data: { game: { code: "ABCdef123456" } } });
});

describe("Play in teams page", () => {
  it("creates a topic game with the chosen teams and time, then opens its lobby", async () => {
    renderWithQuery(<PlayInTeamsPage />);

    // A topic with too few questions for any board is not offered.
    expect(await screen.findByRole("radio", { name: /Football/ })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Tiny/ })).toBeNull();

    const create = screen.getByRole("button", { name: "Create game and get the link" });
    expect(create).toBeDisabled();

    await userEvent.click(screen.getByRole("radio", { name: /Food/ }));
    // Food has 12 questions: enough for 2 teams (9), not 3 (16).
    expect(screen.getByRole("radio", { name: "3 teams" })).toBeDisabled();

    await userEvent.click(screen.getByRole("radio", { name: /Football/ }));
    await userEvent.click(screen.getByRole("radio", { name: "3 teams" }));
    await userEvent.click(screen.getByRole("radio", { name: "15s" }));
    await userEvent.click(create);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(ENDPOINTS.TEAM_GAMES, {
        topicId: "t1",
        teamCount: 3,
        timerSeconds: 15,
      })
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/team/ABCdef123456"));
  });
});
