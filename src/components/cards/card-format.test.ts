import { describe, it, expect } from "vitest";
import { validateCard } from "./card-form-dialog";
import { bulkFormat, parseBulkCards } from "./bulk-add-dialog";

describe("card options", () => {
  const card = (options: string[]) => ({
    type: "definition" as const,
    text: "Capital of Nigeria",
    options,
    correctOptionIndex: 0,
  });

  it("accepts four different options and rejects blanks or repeats", () => {
    expect(validateCard(card(["Abuja", "Lagos", "Kano", "Ibadan"]))).toBeNull();
    expect(validateCard(card(["Abuja", "Lagos", "", "Ibadan"]))).toBe("Fill in all 4 options.");
    expect(validateCard(card(["Abuja", "Lagos", "abuja", "Ibadan"]))).toBe(
      "The options must all be different."
    );
    expect(validateCard(card(["Abuja", "Lagos"]))).toBeNull();
  });

  it("reads four-option bulk lines with the correct answer first", () => {
    expect(bulkFormat(4)).toBe("question | correct option | wrong 1 | wrong 2 | wrong 3");
    const parsed = parseBulkCards("Capital of Nigeria | Abuja | Lagos | Kano | Ibadan", 4);
    expect(parsed.error).toBeNull();
    expect(parsed.cards?.[0]).toMatchObject({
      options: ["Abuja", "Lagos", "Kano", "Ibadan"],
      correctOptionIndex: 0,
    });

    const short = parseBulkCards("Capital of Nigeria | Abuja | Lagos", 4);
    expect(short.error).toBe(
      'Line 1: use "question | correct option | wrong 1 | wrong 2 | wrong 3".'
    );
    // Topics and campaigns keep the two-option format.
    expect(parseBulkCards("Capital of Nigeria | Abuja | Lagos").error).toBeNull();
  });
});
