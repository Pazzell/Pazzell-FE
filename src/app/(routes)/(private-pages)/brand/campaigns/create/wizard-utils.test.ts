import { describe, it, expect } from "vitest";
import {
  validateWords,
  validateVideoFile,
  validateQuizQuestions,
  buildCampaignFormData,
  WORD_HUNT_MIN_WORDS,
  QUIZ_QUESTION_COUNT,
} from "./wizard-utils";

describe("validateWords", () => {
  it("rejects fewer than the minimum number of valid words", () => {
    const result = validateWords(["cat", "dog"]);
    expect(result.valid).toBe(false);
    expect(result.message).toContain(String(WORD_HUNT_MIN_WORDS));
  });

  it("ignores words shorter than the minimum length when counting", () => {
    const words = ["a", "b", "cat", "dog", "fish", "bird", "lion", "bear", "wolf"];
    // "a" and "b" are too short (< 2 chars) and don't count, leaving 7 valid words.
    const result = validateWords(words);
    expect(result.valid).toBe(true);
  });

  it("accepts exactly the minimum number of valid words", () => {
    const words = Array.from({ length: WORD_HUNT_MIN_WORDS }, (_, i) => `word${i}`);
    expect(validateWords(words).valid).toBe(true);
  });

  it("treats blank/whitespace-only entries as invalid", () => {
    const words = ["", "  ", "ok", "go", "hi", "we", "up", "at"];
    // only "ok","go","hi","we","up","at" are >= 2 chars = 6, still short of 7
    expect(validateWords(words).valid).toBe(false);
  });
});

describe("validateVideoFile", () => {
  const config = { maxDurationSeconds: 130, maxSizeBytes: 100 * 1024 * 1024 };

  it("rejects non-video files", () => {
    const file = new File(["x"], "clip.jpg", { type: "image/jpeg" });
    const result = validateVideoFile(file, 30, config);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/video file/i);
  });

  it("rejects files over the max size", () => {
    const file = new File([new Uint8Array(10)], "clip.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: config.maxSizeBytes + 1 });
    const result = validateVideoFile(file, 30, config);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/MB/);
  });

  it("rejects videos longer than the max duration", () => {
    const file = new File([new Uint8Array(10)], "clip.mp4", { type: "video/mp4" });
    const result = validateVideoFile(file, 200, config);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/seconds/);
  });

  it("accepts a valid video within limits", () => {
    const file = new File([new Uint8Array(10)], "clip.mp4", { type: "video/mp4" });
    const result = validateVideoFile(file, 125, config);
    expect(result.valid).toBe(true);
  });
});

describe("validateQuizQuestions", () => {
  const validQuestion = () => ({
    question: "What color is the sky?",
    choices: ["Red", "Blue", "Green", "Yellow"],
    correctIndex: 1,
  });

  it("requires exactly QUIZ_QUESTION_COUNT questions", () => {
    const result = validateQuizQuestions([validQuestion(), validQuestion()]);
    expect(result.valid).toBe(false);
    expect(result.message).toContain(String(QUIZ_QUESTION_COUNT));
  });

  it("rejects a question that is too short", () => {
    const questions = [validQuestion(), validQuestion(), { ...validQuestion(), question: "Hi" }];
    const result = validateQuizQuestions(questions);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/5 characters/);
  });

  it("rejects a question missing a choice", () => {
    const questions = [
      validQuestion(),
      validQuestion(),
      { ...validQuestion(), choices: ["Red", "Blue", "", "Yellow"] },
    ];
    const result = validateQuizQuestions(questions);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/4 non-empty choices/);
  });

  it("rejects an out-of-range correctIndex", () => {
    const questions = [validQuestion(), validQuestion(), { ...validQuestion(), correctIndex: 9 }];
    const result = validateQuizQuestions(questions);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/correct answer/);
  });

  it("accepts exactly 3 well-formed questions", () => {
    const questions = [validQuestion(), validQuestion(), validQuestion()];
    expect(validateQuizQuestions(questions).valid).toBe(true);
  });
});

describe("buildCampaignFormData", () => {
  const baseData = {
    title: "Summer Splash",
    description: "A fun summer campaign",
    brandUrl: "https://brand.example.com",
    campaignUrl: "",
    image: new File(["img"], "image.png", { type: "image/png" }),
    video: new File(["vid"], "video.mp4", { type: "video/mp4" }),
    words: ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", ""],
    questions: [
      { question: "Q1 goes here", choices: ["A", "B", "C", "D"], correctIndex: 0 },
      { question: "Q2 goes here", choices: ["A", "B", "C", "D"], correctIndex: 1 },
      { question: "Q3 goes here", choices: ["A", "B", "C", "D"], correctIndex: 2 },
    ],
    prizeDescription: "A brand-new pair of headphones",
    prizeUnitsAvailable: 2,
    packageId: "pkg_basic_id",
    durationWeeks: 4,
  };

  it("includes every contract-required field", () => {
    const fd = buildCampaignFormData(baseData);
    expect(fd.get("title")).toBe("Summer Splash");
    expect(fd.get("description")).toBe("A fun summer campaign");
    expect(fd.get("brandUrl")).toBe("https://brand.example.com");
    expect(fd.get("campaignUrl")).toBeNull(); // empty string omitted
    expect(fd.get("image")).toBeInstanceOf(File);
    expect(fd.get("video")).toBeInstanceOf(File);
    expect(fd.get("prizeDescription")).toBe("A brand-new pair of headphones");
    expect(fd.get("prizeUnitsAvailable")).toBe("2");
    expect(fd.get("packageId")).toBe("pkg_basic_id");
    expect(fd.get("durationWeeks")).toBe("4");
  });

  it("filters out blank/too-short words before submitting", () => {
    const fd = buildCampaignFormData(baseData);
    const words = JSON.parse(fd.get("words") as string);
    expect(words).toEqual(["apple", "banana", "cherry", "date", "elderberry", "fig", "grape"]);
  });

  it("serializes exactly 3 questions as JSON", () => {
    const fd = buildCampaignFormData(baseData);
    const questions = JSON.parse(fd.get("questions") as string);
    expect(questions).toHaveLength(3);
    expect(questions[0]).toEqual(baseData.questions[0]);
  });

  it("omits removed legacy fields (gameType, endMonth, timeLimit, weeksToRun, passage)", () => {
    const fd = buildCampaignFormData(baseData);
    for (const removedField of ["gameType", "endMonth", "timeLimit", "weeksToRun", "passage"]) {
      expect(fd.has(removedField)).toBe(false);
    }
  });
});
