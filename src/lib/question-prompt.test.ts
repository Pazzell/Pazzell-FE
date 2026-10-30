import { describe, it, expect } from "vitest";
import { questionPrompt } from "./question-prompt";

describe("questionPrompt", () => {
  it("asks 'What is this?' for a picture with no caption, and keeps any text it has", () => {
    expect(questionPrompt({ type: "image", text: null })).toBe("What is this?");
    expect(questionPrompt({ type: "image", text: "  " })).toBe("What is this?");
    expect(questionPrompt({ type: "image", text: "Who is this?" })).toBe("Who is this?");
    expect(questionPrompt({ type: "definition", text: "Capital of Kenya" })).toBe("Capital of Kenya");
    expect(questionPrompt({ type: "definition", text: null })).toBeNull();
  });
});
