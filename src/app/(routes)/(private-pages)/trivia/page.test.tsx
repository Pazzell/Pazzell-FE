import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQuery } from "@/test-utils";
import { ENDPOINTS } from "@/app/_utils/endpoints";

const { api } = vi.hoisted(() => ({ api: { get: vi.fn() } }));

vi.mock("@/lib/api", () => ({ api }));
vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/trivia/campaign-gate", () => ({ CampaignGate: () => null }));

import TriviaTopicsPage from "./page";

const topic = (id: string, name: string, description: string | null = null) => ({
  id,
  name,
  slug: id,
  description,
  coverImageUrl: null,
  cardCount: 20,
  cardCountBounds: { available: 20, min: 5, max: 20 },
});

const topicNames = () => screen.queryAllByRole("heading", { level: 2 }).map((h) => h.textContent);

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockImplementation((url: string) =>
    Promise.resolve({
      data:
        url === ENDPOINTS.TRIVIA_TOPICS
          ? {
              topics: [
                topic("t1", "Biology", "Cells and the human body"),
                topic("t2", "Music Theory: Beginner", "Notes, rests and clefs"),
                topic("t3", "Musical Instruments"),
              ],
            }
          : { required: false },
    })
  );
});

describe("TriviaTopicsPage", () => {
  it("narrows the topics by name or description and clears the search", async () => {
    renderWithQuery(<TriviaTopicsPage />);
    await screen.findByText("Biology");
    // Shown in the order the server sends them (alphabetical).
    expect(topicNames()).toEqual(["Biology", "Music Theory: Beginner", "Musical Instruments"]);

    const search = screen.getByRole("searchbox", { name: "Search topics" });
    await userEvent.type(search, "MUSIC");
    expect(topicNames()).toEqual(["Music Theory: Beginner", "Musical Instruments"]);

    await userEvent.clear(search);
    await userEvent.type(search, "human body");
    expect(topicNames()).toEqual(["Biology"]);

    await userEvent.clear(search);
    await userEvent.type(search, "chemistry");
    expect(topicNames()).toEqual([]);
    expect(screen.getByText("No topics match your search.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(topicNames()).toHaveLength(3);
  });
});
