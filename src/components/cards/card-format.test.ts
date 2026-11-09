import { describe, it, expect } from "vitest";
import { validateCard } from "./card-form-dialog";
import { BULK_FORMAT, parseBulkCards } from "./bulk-add-dialog";

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
    expect(validateCard(card(["Abuja", "Lagos"]))).toBe("A card needs 4 options.");
  });

  it("reads four-option bulk lines with the correct answer first", () => {
    expect(BULK_FORMAT).toBe("question | correct option | wrong 1 | wrong 2 | wrong 3");
    const parsed = parseBulkCards("Capital of Nigeria | Abuja | Lagos | Kano | Ibadan");
    expect(parsed.error).toBeNull();
    expect(parsed.cards?.[0]).toMatchObject({
      options: ["Abuja", "Lagos", "Kano", "Ibadan"],
      correctOptionIndex: 0,
    });

    const short = parseBulkCards("Capital of Nigeria | Abuja | Lagos");
    expect(short.error).toBe(
      'Line 1: use "question | correct option | wrong 1 | wrong 2 | wrong 3".'
    );
  });
});
