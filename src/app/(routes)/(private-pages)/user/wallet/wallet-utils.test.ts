import { describe, it, expect } from "vitest";
import {
  generateIdempotencyKey,
  formatCurrency,
  validateWithdrawalAmount,
  WITHDRAWAL_STATUS_STYLES,
} from "./wallet-utils";

describe("generateIdempotencyKey", () => {
  it("generates a non-empty string", () => {
    expect(generateIdempotencyKey().length).toBeGreaterThan(0);
  });

  it("generates a different key on each call", () => {
    const a = generateIdempotencyKey();
    const b = generateIdempotencyKey();
    expect(a).not.toBe(b);
  });
});

describe("formatCurrency", () => {
  it("formats NGN with a naira symbol by default", () => {
    expect(formatCurrency(7000)).toBe("₦7,000");
  });

  it("formats other currencies with a code prefix", () => {
    expect(formatCurrency(50, "USD")).toBe("USD 50");
  });
});

describe("validateWithdrawalAmount", () => {
  it("rejects zero or negative amounts", () => {
    expect(validateWithdrawalAmount(0, 1000).valid).toBe(false);
    expect(validateWithdrawalAmount(-5, 1000).valid).toBe(false);
  });

  it("rejects non-finite amounts", () => {
    expect(validateWithdrawalAmount(NaN, 1000).valid).toBe(false);
  });

  it("rejects amounts over the available balance", () => {
    const result = validateWithdrawalAmount(1500, 1000);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/exceeds/i);
  });

  it("accepts a valid amount within balance", () => {
    expect(validateWithdrawalAmount(500, 1000).valid).toBe(true);
  });

  it("accepts an amount exactly equal to the balance", () => {
    expect(validateWithdrawalAmount(1000, 1000).valid).toBe(true);
  });
});

describe("WITHDRAWAL_STATUS_STYLES", () => {
  it("has a style entry for every documented status", () => {
    for (const status of ["pending", "processing", "paid", "failed"] as const) {
      expect(WITHDRAWAL_STATUS_STYLES[status]).toBeTruthy();
    }
  });
});
