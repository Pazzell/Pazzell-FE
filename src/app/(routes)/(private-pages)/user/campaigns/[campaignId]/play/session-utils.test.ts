import { describe, it, expect } from "vitest";
import { AxiosError } from "axios";
import {
  computeWrongIndices,
  extractSessionErrorMessage,
  isAbandonedSessionError,
  isAllAnswered,
  toLegacyShapedCampaign,
} from "./session-utils";
import { CampaignV2Data } from "@/types";

describe("computeWrongIndices", () => {
  const questions = [
    { question: "Q1", choices: ["A", "B", "C", "D"], correctIndex: 0 },
    { question: "Q2", choices: ["A", "B", "C", "D"], correctIndex: 1 },
    { question: "Q3", choices: ["A", "B", "C", "D"], correctIndex: 2 },
  ];

  it("returns an empty array when all answers are correct", () => {
    expect(computeWrongIndices(questions, [0, 1, 2])).toEqual([]);
  });

  it("returns the indices of every wrong answer", () => {
    expect(computeWrongIndices(questions, [1, 1, 0])).toEqual([0, 2]);
  });

  it("treats a missing answer as wrong", () => {
    expect(computeWrongIndices(questions, [0, 1])).toEqual([2]);
  });
});

describe("isAllAnswered", () => {
  it("is false when any answer is null", () => {
    expect(isAllAnswered([0, null, 1])).toBe(false);
  });

  it("is false for an empty array", () => {
    expect(isAllAnswered([])).toBe(false);
  });

  it("is true when every slot has an answer", () => {
    expect(isAllAnswered([0, 1, 2])).toBe(true);
  });
});

describe("toLegacyShapedCampaign", () => {
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
    questions: [{ _id: "q1", question: "Q1?", choices: ["A", "B", "C", "D"], correctIndex: 0 }],
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

  it("carries over the image, words, and brand name for the given game type", () => {
    const legacy = toLegacyShapedCampaign(campaign, "word_hunt");
    expect(legacy.gameType).toBe("word_hunt");
    expect(legacy.puzzleImageUrl).toBe(campaign.puzzleImageUrl);
    expect(legacy.words).toEqual(campaign.words);
    expect(legacy.brandName).toBe("Acme");
    expect(legacy._id).toBe("camp1");
  });

  it("does not leak the v2 quiz questions into the legacy shape (session orchestrator owns the quiz)", () => {
    const legacy = toLegacyShapedCampaign(campaign, "sliding_puzzle");
    expect(legacy.questions).toEqual([]);
  });
});

function makeAxiosError(message: string): AxiosError {
  return new AxiosError(
    "Request failed",
    "400",
    undefined,
    undefined,
    // @ts-expect-error — only the fields extractSessionErrorMessage reads are needed
    { data: { message } }
  );
}

describe("extractSessionErrorMessage", () => {
  it("surfaces the backend's specific message from an axios error response", () => {
    expect(
      extractSessionErrorMessage(
        makeAxiosError("All four games must be completed first"),
        "fallback"
      )
    ).toBe("All four games must be completed first");
  });

  it("falls back when the error has no response message", () => {
    expect(extractSessionErrorMessage(new Error("network down"), "fallback")).toBe(
      "fallback"
    );
  });

  it("falls back for a non-axios error", () => {
    expect(extractSessionErrorMessage("oops", "fallback")).toBe("fallback");
  });
});

describe("isAbandonedSessionError", () => {
  it("recognizes the abandoned-session message", () => {
    expect(
      isAbandonedSessionError("Session is abandoned, cannot be completed")
    ).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAbandonedSessionError("SESSION IS ABANDONED")).toBe(true);
  });

  it("is false for unrelated messages", () => {
    expect(isAbandonedSessionError("The video must be watched first")).toBe(false);
  });
});
