import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignV2Data } from "@/types";

vi.mock("@/components/games/SlidingPuzzleGame", () => ({
  SlidingPuzzleGame: ({ sessionMode, onGameComplete }: any) => (
    <button onClick={() => sessionMode && onGameComplete(5, 3000)}>
      Complete sliding_puzzle
    </button>
  ),
}));
vi.mock("@/components/games/CardMatchingGame", () => ({
  CardMatchingGame: ({ sessionMode, onGameComplete }: any) => (
    <button onClick={() => sessionMode && onGameComplete(4, 2000)}>
      Complete card_matching
    </button>
  ),
}));
vi.mock("@/components/games/SpotTheDifferenceGame", () => ({
  SpotTheDifferenceGame: ({ sessionMode, onGameComplete }: any) => (
    <button onClick={() => sessionMode && onGameComplete(10, 4000)}>
      Complete spot_the_difference
    </button>
  ),
}));
vi.mock("@/components/games/WordHuntGame", () => ({
  WordHuntGame: ({ sessionMode, onGameComplete }: any) => (
    <button onClick={() => sessionMode && onGameComplete(7, 5000)}>
      Complete word_hunt
    </button>
  ),
}));

const axiosGet = vi.fn();
const axiosPost = vi.fn();
vi.mock("axios", () => ({
  default: { get: (...args: unknown[]) => axiosGet(...args), post: (...args: unknown[]) => axiosPost(...args) },
}));

import { FunRunFlow } from "./fun-run-flow";

const campaign: CampaignV2Data = {
  _id: "camp1",
  schemaVersion: 2,
  brandId: "brand1",
  brandName: "Acme",
  gameTypes: ["sliding_puzzle", "word_hunt"],
  title: "Summer Splash",
  description: "desc",
  puzzleImageUrl: "https://example.com/img.png",
  videoUrl: "https://example.com/vid.mp4",
  videoDurationSeconds: 90,
  videoSizeBytes: 1000,
  videoMimeType: "video/mp4",
  words: ["apple", "banana"],
  questions: [
    { _id: "q1", question: "Q1?", choices: ["A", "B", "C", "D"], correctIndex: 0 },
    { _id: "q2", question: "Q2?", choices: ["A", "B", "C", "D"], correctIndex: 1 },
    { _id: "q3", question: "Q3?", choices: ["A", "B", "C", "D"], correctIndex: 2 },
  ],
  prizeDescription: "Headphones",
  prizeUnitsAvailable: 1,
  createdAt: "2026-01-01",
  endDate: "2026-02-01",
  durationWeeks: 4,
  weeklyPrice: 7000,
  packageId: "pkg1",
  packageName: "basic",
  status: "active",
  paymentStatus: "paid",
};

function answerQuiz(answers: number[]) {
  const letters = ["A", "B", "C", "D"];
  answers.forEach((answerIndex, qIndex) => {
    const question = screen.getByTestId(`quiz-question-${qIndex}`);
    const buttons = question.querySelectorAll("button");
    const target = Array.from(buttons).find((b) =>
      b.textContent?.startsWith(`${letters[answerIndex]}.`)
    );
    target?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("FunRunFlow", () => {
  beforeEach(() => {
    axiosGet.mockReset();
    axiosPost.mockReset();
  });

  it("plays through games, video, and quiz without ever calling the network", async () => {
    const user = userEvent.setup();
    render(<FunRunFlow campaign={campaign} campaignId="camp1" />);

    expect(screen.getAllByTestId("fun-run-badge").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /start fun run/i }));

    await user.click(await screen.findByText("Complete sliding_puzzle"));
    await user.click(await screen.findByText("Complete word_hunt"));

    await screen.findByRole("heading", { name: /watch to continue/i });
    await user.click(screen.getByRole("button", { name: /continue to quiz/i }));

    await screen.findByTestId("quiz-question-0");
    answerQuiz([0, 1, 2]);
    await user.click(screen.getByRole("button", { name: /submit answers/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /fun run complete/i })
      ).toBeInTheDocument()
    );
    expect(screen.getByText(/no points or raffle ticket were awarded/i)).toBeInTheDocument();

    // The whole point of a fun run: zero backend calls, ever.
    expect(axiosGet).not.toHaveBeenCalled();
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it("shows which questions were wrong locally and lets the player retry, all still offline", async () => {
    const user = userEvent.setup();
    render(<FunRunFlow campaign={campaign} campaignId="camp1" />);

    await user.click(screen.getByRole("button", { name: /start fun run/i }));
    await user.click(await screen.findByText("Complete sliding_puzzle"));
    await user.click(await screen.findByText("Complete word_hunt"));
    await screen.findByRole("heading", { name: /watch to continue/i });
    await user.click(screen.getByRole("button", { name: /continue to quiz/i }));

    await screen.findByTestId("quiz-question-0");
    answerQuiz([0, 0, 2]); // question index 1 wrong (correct is B/1)
    await user.click(screen.getByRole("button", { name: /submit answers/i }));

    expect(await screen.findByText(/1 question wrong/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /fun run complete/i })
    ).not.toBeInTheDocument();

    answerQuiz([0, 1, 2]);
    await user.click(screen.getByRole("button", { name: /submit answers/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /fun run complete/i })
      ).toBeInTheDocument()
    );
    expect(axiosGet).not.toHaveBeenCalled();
    expect(axiosPost).not.toHaveBeenCalled();
  });
});
