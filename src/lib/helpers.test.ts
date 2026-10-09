import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/api", () => ({ api: {}, getApiError: () => undefined }));

import { parseBulkCards } from "@/components/cards/bulk-add-dialog";
import { validateCard } from "@/components/cards/card-form-dialog";
import { isHttpUrl } from "@/components/campaigns/campaign-details-form";
import { proDaysLeft } from "@/hooks/use-plan";
import {
  clearReturnPath,
  getReturnPath,
  recallQuizSlug,
  rememberQuizSlug,
  setReturnPath,
} from "@/lib/return-path";
import { sessionExit } from "@/lib/session-exit";
import { validateImageFile } from "@/lib/upload";
import { formatPrice } from "@/lib/utils";

describe("validateCard", () => {
  const card = { type: "definition", text: "Capital of Nigeria", options: ["Abuja", "Lagos"], correctOptionIndex: 0 } as const;

  it("accepts a complete text card", () => {
    expect(validateCard({ ...card, options: ["Abuja", "Lagos"] })).toBeNull();
  });

  it("needs text on a text card and an image on an image card", () => {
    expect(validateCard({ ...card, text: "  ", options: ["Abuja", "Lagos"] })).toMatch(/text/);
    expect(validateCard({ ...card, type: "image", options: ["Abuja", "Lagos"] })).toMatch(/image/);
    expect(
      validateCard({ ...card, type: "image", text: "", imageUrl: "https://x/a.webp", options: ["Abuja", "Lagos"] })
    ).toBeNull();
  });

  it("needs two different, non-empty options within the length limit", () => {
    expect(validateCard({ ...card, options: ["Abuja", " "] })).toMatch(/both options/);
    expect(validateCard({ ...card, options: ["Abuja", "abuja "] })).toMatch(/different/);
    expect(validateCard({ ...card, options: ["Abuja", "x".repeat(81)] })).toMatch(/80/);
  });

  it("limits the text length", () => {
    expect(validateCard({ ...card, text: "x".repeat(301), options: ["Abuja", "Lagos"] })).toMatch(/300/);
  });
});

describe("parseBulkCards", () => {
  it("turns each line into a text card with the first option correct", () => {
    const parsed = parseBulkCards("Capital of Nigeria | Abuja | Lagos\n\n  Largest planet|Jupiter|Saturn  ");
    expect(parsed.error).toBeNull();
    expect(parsed.cards).toEqual([
      { type: "definition", text: "Capital of Nigeria", options: ["Abuja", "Lagos"], correctOptionIndex: 0 },
      { type: "definition", text: "Largest planet", options: ["Jupiter", "Saturn"], correctOptionIndex: 0 },
    ]);
  });

  it("names the line that is wrong", () => {
    expect(parseBulkCards("A | B | C\nonly two | parts").error).toMatch(/^Line 2:/);
    expect(parseBulkCards("A | Same | same").error).toMatch(/^Line 1:.*different/);
  });

  it("rejects nothing at all and more than 100 cards", () => {
    expect(parseBulkCards(" \n ").error).toMatch(/at least one/);
    const many = Array.from({ length: 101 }, (_, i) => `Q${i} | A | B`).join("\n");
    expect(parseBulkCards(many).error).toMatch(/100/);
  });
});

describe("return path", () => {
  beforeEach(() => sessionStorage.clear());

  it("round-trips a shared quiz link and clears it", () => {
    setReturnPath("/q/Zk3vQ0a1b2_c-3");
    expect(getReturnPath()).toBe("/q/Zk3vQ0a1b2_c-3");
    clearReturnPath();
    expect(getReturnPath()).toBeNull();
  });

  it("ignores anything that is not an in-app share link", () => {
    for (const path of ["https://evil.example/q/abc", "//evil.example", "/admin", "/q/abc/../../admin", "/q/"]) {
      setReturnPath(path);
      expect(getReturnPath()).toBeNull();
    }
  });

  it("remembers which slug a quiz id was started from", () => {
    rememberQuizSlug("quiz1", "slugA");
    expect(recallQuizSlug("quiz1")).toBe("slugA");
    expect(recallQuizSlug("quiz2")).toBeNull();
  });
});

describe("sessionExit", () => {
  it("sends players back to the topics", () => {
    expect(sessionExit({ type: "topic", id: "t1" }, false).href).toBe("/trivia");
    expect(sessionExit({ type: "custom", id: "q1" }, false).href).toBe("/trivia");
    expect(sessionExit({ type: "campaign", id: "c1" }, false).href).toBe("/trivia");
  });

  it("sends a test play back to what was being built", () => {
    expect(sessionExit({ type: "custom", id: "q1" }, true).href).toBe("/my-quizzes/q1/edit");
    expect(sessionExit({ type: "campaign", id: "c1" }, true).href).toBe("/brand/campaigns/c1/edit");
  });
});

describe("proDaysLeft", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T12:00:00.000Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("rounds a part day up and never goes negative", () => {
    expect(proDaysLeft("2026-10-06T13:00:00.000Z")).toBe(1);
    expect(proDaysLeft("2026-11-05T12:00:00.000Z")).toBe(30);
    expect(proDaysLeft("2026-10-01T12:00:00.000Z")).toBe(0);
    expect(proDaysLeft(null)).toBe(0);
  });
});

describe("small helpers", () => {
  it("isHttpUrl accepts only absolute http(s) links", () => {
    expect(isHttpUrl("https://acme.example/")).toBe(true);
    expect(isHttpUrl("http://acme.example")).toBe(true);
    expect(isHttpUrl("acme.example")).toBe(false);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("validateImageFile checks type and size", () => {
    expect(validateImageFile(new File(["x"], "a.png", { type: "image/png" }))).toBeNull();
    expect(validateImageFile(new File(["x"], "a.gif", { type: "image/gif" }))).toMatch(/JPG, PNG or WEBP/);
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "a.png", { type: "image/png" });
    expect(validateImageFile(big)).toMatch(/5 MB/);
  });

  it("formatPrice shows whole amounts without decimals", () => {
    expect(formatPrice(1500, "NGN")).toMatch(/1,500$/);
    expect(formatPrice(1.5, "NGN")).toMatch(/1\.50?$/);
  });
});
