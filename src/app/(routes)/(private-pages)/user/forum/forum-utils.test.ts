import { describe, it, expect } from "vitest";
import {
  validateThreadTitle,
  validatePostBody,
  validateWinnerSubmission,
  WINNER_SUBMISSION_LIKE_THRESHOLD,
  WINNER_SUBMISSION_STATUS_STYLES,
} from "./forum-utils";

describe("validateThreadTitle", () => {
  it("rejects titles under 3 characters", () => {
    expect(validateThreadTitle("ab").valid).toBe(false);
  });

  it("accepts a valid title", () => {
    expect(validateThreadTitle("My first thread").valid).toBe(true);
  });
});

describe("validatePostBody", () => {
  it("rejects an empty or whitespace-only body", () => {
    expect(validatePostBody("").valid).toBe(false);
    expect(validatePostBody("   ").valid).toBe(false);
  });

  it("accepts a non-empty body", () => {
    expect(validatePostBody("Great campaign!").valid).toBe(true);
  });
});

describe("validateWinnerSubmission", () => {
  it("rejects an invalid URL", () => {
    const result = validateWinnerSubmission("not-a-url", 25);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/valid post url/i);
  });

  it("rejects a missing like count", () => {
    const result = validateWinnerSubmission("https://x.com/post/1", undefined);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/like count/i);
  });

  it("rejects a like count below the threshold", () => {
    const result = validateWinnerSubmission("https://x.com/post/1", 5);
    expect(result.valid).toBe(false);
    expect(result.message).toContain(String(WINNER_SUBMISSION_LIKE_THRESHOLD));
  });

  it("accepts a valid URL with enough likes", () => {
    expect(validateWinnerSubmission("https://x.com/post/1", 20).valid).toBe(true);
    expect(validateWinnerSubmission("https://x.com/post/1", 45).valid).toBe(true);
  });
});

describe("WINNER_SUBMISSION_STATUS_STYLES", () => {
  it("has a style entry for every documented status", () => {
    for (const status of ["submitted", "verified", "rejected"] as const) {
      expect(WINNER_SUBMISSION_STATUS_STYLES[status]).toBeTruthy();
    }
  });
});
