import { describe, it, expect } from "vitest";
import { msUntilNextMonday, formatCountdown, formatAvgTime } from "./leaderboard-utils";

// 2026-01-05 is a Monday, 2026-01-06 a Tuesday, 2026-01-11 a Sunday,
// 2026-01-12 the following Monday — verified against the real calendar.
describe("msUntilNextMonday", () => {
  it("returns exactly 7 days when now is Monday midnight", () => {
    const now = new Date(2026, 0, 5, 0, 0, 0);
    expect(msUntilNextMonday(now)).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("returns 6.5 days when now is Monday noon", () => {
    const now = new Date(2026, 0, 5, 12, 0, 0);
    expect(msUntilNextMonday(now)).toBe(6 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000);
  });

  it("returns 6 days when now is Tuesday midnight", () => {
    const now = new Date(2026, 0, 6, 0, 0, 0);
    expect(msUntilNextMonday(now)).toBe(6 * 24 * 60 * 60 * 1000);
  });

  it("returns 1 hour when now is Sunday 11pm", () => {
    const now = new Date(2026, 0, 11, 23, 0, 0);
    expect(msUntilNextMonday(now)).toBe(60 * 60 * 1000);
  });
});

describe("formatCountdown", () => {
  it("shows days, hours, and minutes when days > 0", () => {
    const ms = 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 5 * 60 * 1000;
    expect(formatCountdown(ms)).toBe("2d 3h 5m");
  });

  it("shows hours and minutes when under a day", () => {
    const ms = 5 * 60 * 60 * 1000 + 10 * 60 * 1000;
    expect(formatCountdown(ms)).toBe("5h 10m");
  });

  it("shows only minutes when under an hour", () => {
    expect(formatCountdown(45 * 60 * 1000)).toBe("45m");
  });
});

describe("formatAvgTime", () => {
  it("formats seconds as m:ss", () => {
    expect(formatAvgTime(65)).toBe("1:05");
    expect(formatAvgTime(5)).toBe("0:05");
  });

  it("returns an em dash for missing values", () => {
    expect(formatAvgTime(null)).toBe("—");
    expect(formatAvgTime(undefined)).toBe("—");
  });
});
