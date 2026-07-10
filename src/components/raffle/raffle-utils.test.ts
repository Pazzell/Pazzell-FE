import { describe, it, expect } from "vitest";
import { computeRaffleRequirement, formatEligibilityProgressText } from "./raffle-utils";

describe("computeRaffleRequirement", () => {
  it("is capped at the floor cap even with many active campaigns", () => {
    expect(computeRaffleRequirement(10, 3)).toBe(3);
  });

  it("is the active campaign count when below the floor cap", () => {
    expect(computeRaffleRequirement(2, 3)).toBe(2);
  });

  it("is zero when there are no active campaigns", () => {
    expect(computeRaffleRequirement(0, 3)).toBe(0);
  });

  it("respects a custom floor cap from config", () => {
    expect(computeRaffleRequirement(10, 5)).toBe(5);
  });
});

describe("formatEligibilityProgressText", () => {
  it("matches the spec's example phrasing exactly", () => {
    expect(formatEligibilityProgressText(2, 3)).toBe(
      "2 of 3 campaigns completed — complete 1 more to activate your raffle tickets."
    );
  });

  it("announces activation once the requirement is met", () => {
    expect(formatEligibilityProgressText(3, 3)).toBe(
      "3 of 3 campaigns completed — your raffle tickets are activated!"
    );
  });

  it("still announces activation if completions exceed the requirement", () => {
    expect(formatEligibilityProgressText(5, 3)).toBe(
      "3 of 3 campaigns completed — your raffle tickets are activated!"
    );
  });

  it("handles the no-active-campaigns case", () => {
    expect(formatEligibilityProgressText(0, 0)).toBe(
      "No active campaigns this week yet."
    );
  });
});
