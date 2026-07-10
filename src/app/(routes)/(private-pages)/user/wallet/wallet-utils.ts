// Pure helpers for the wallet page, kept free of React so they're easy to
// unit test in isolation.

import { WithdrawalStatus } from "@/types";

// Client-generated, reused on retry per API_CONTRACT_WEEKLY_MIGRATION.md §5
// ("idempotencyKey required — client-generated, reused on retry to avoid
// double-withdrawal"). Falls back to a non-crypto id if crypto.randomUUID
// isn't available (older browsers / some test environments).
export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function formatCurrency(amount: number, currency: string = "NGN"): string {
  const symbol = currency === "NGN" ? "₦" : `${currency} `;
  return `${symbol}${amount.toLocaleString()}`;
}

export const WITHDRAWAL_STATUS_STYLES: Record<WithdrawalStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export interface AmountValidationResult {
  valid: boolean;
  message?: string;
}

export function validateWithdrawalAmount(
  amount: number,
  balance: number
): AmountValidationResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { valid: false, message: "Enter a valid amount." };
  }
  if (amount > balance) {
    return { valid: false, message: "Amount exceeds your available balance." };
  }
  return { valid: true };
}
