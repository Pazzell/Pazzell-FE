import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TEST_SETTINGS } from "@/test-utils";

vi.mock("@/hooks/use-game-settings", () => ({
  useGameSettings: () => ({ settings: TEST_SETTINGS }),
}));

import { SessionSetup } from "./session-setup";
import { TRIVIA_IMAGE_PERCENT_STORAGE_KEY } from "@/hooks/use-start-trivia-session";

const bounds = { min: 5, max: 20 };
const mixed = { imageCards: 20, definitionCards: 44, defaultImagePercent: 70 };
// After the timer and card-count sliders; absent when the trivia has one kind of card.
const mixSlider = () => screen.queryAllByRole("slider")[2] ?? null;
const start = () => userEvent.click(screen.getByRole("button", { name: "Start Quiz" }));

beforeEach(() => {
  localStorage.clear();
});

describe("SessionSetup picture share", () => {
  it("starts on the trivia's default and sends what the player picks", async () => {
    const onStart = vi.fn();
    render(<SessionSetup bounds={bounds} cardMix={mixed} isStarting={false} onStart={onStart} />);

    const slider = mixSlider()!;
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
    expect(slider).toHaveAttribute("aria-valuenow", "70");

    slider.focus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByText("0%")).toBeInTheDocument();
    await start();
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ imagePercent: 0 }));
    expect(localStorage.getItem(TRIVIA_IMAGE_PERCENT_STORAGE_KEY)).toBe("0");
  });

  it("sends the default without remembering it when the player leaves the slider alone", async () => {
    const onStart = vi.fn();
    render(<SessionSetup bounds={bounds} cardMix={mixed} isStarting={false} onStart={onStart} />);
    await start();
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ imagePercent: 70 }));
    expect(localStorage.getItem(TRIVIA_IMAGE_PERCENT_STORAGE_KEY)).toBeNull();
  });

  it("opens on the player's last choice instead of the default", () => {
    localStorage.setItem(TRIVIA_IMAGE_PERCENT_STORAGE_KEY, "30");
    render(<SessionSetup bounds={bounds} cardMix={mixed} isStarting={false} onStart={vi.fn()} />);
    expect(mixSlider()).toHaveAttribute("aria-valuenow", "30");
  });

  it("is hidden when the trivia has only one kind of card", async () => {
    const onStart = vi.fn();
    render(
      <SessionSetup
        bounds={bounds}
        cardMix={{ imageCards: 0, definitionCards: 20, defaultImagePercent: 70 }}
        isStarting={false}
        onStart={onStart}
      />
    );
    expect(mixSlider()).toBeNull();
    expect(screen.queryByText("Picture questions")).not.toBeInTheDocument();
    await start();
    expect(onStart.mock.calls[0][0]).not.toHaveProperty("imagePercent");
  });
});
