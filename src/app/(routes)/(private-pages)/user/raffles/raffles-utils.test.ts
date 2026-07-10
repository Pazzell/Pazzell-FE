import { describe, it, expect } from "vitest";
import { getRankRewardPercent } from "./raffles-utils";

describe("getRankRewardPercent", () => {
  const rankDistribution = [30, 20, 15, 10, 8, 6, 4, 3, 2, 2];

  it("returns the percent for a rank within the distribution", () => {
    expect(getRankRewardPercent(1, rankDistribution)).toBe(30);
    expect(getRankRewardPercent(10, rankDistribution)).toBe(2);
  });

  it("returns null for a rank outside the distribution", () => {
    expect(getRankRewardPercent(11, rankDistribution)).toBeNull();
    expect(getRankRewardPercent(0, rankDistribution)).toBeNull();
  });
});
