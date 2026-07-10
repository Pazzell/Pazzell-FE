// Pure helpers for the forum + winner-share submission flow, kept free of
// React so validation logic is easy to unit test in isolation.

import { WinnerSubmissionStatus } from "@/types";

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateThreadTitle(title: string): ValidationResult {
  if (title.trim().length < 3) {
    return { valid: false, message: "Title must be at least 3 characters." };
  }
  return { valid: true };
}

export function validatePostBody(body: string): ValidationResult {
  if (body.trim().length === 0) {
    return { valid: false, message: "Post cannot be empty." };
  }
  return { valid: true };
}

// Per the brief: a winner must post their win on social media and reach
// this many likes before submitting the link for verification. The backend
// re-checks the real post when an admin verifies it — this is just a
// client-side gate so players don't submit obviously-too-early posts.
export const WINNER_SUBMISSION_LIKE_THRESHOLD = 20;

export function validateWinnerSubmission(
  postUrl: string,
  claimedLikeCount: number | undefined
): ValidationResult {
  try {
    // eslint-disable-next-line no-new
    new URL(postUrl);
  } catch {
    return { valid: false, message: "Enter a valid post URL." };
  }
  if (claimedLikeCount === undefined || Number.isNaN(claimedLikeCount)) {
    return { valid: false, message: "Enter your post's current like count." };
  }
  if (claimedLikeCount < WINNER_SUBMISSION_LIKE_THRESHOLD) {
    return {
      valid: false,
      message: `Your post needs at least ${WINNER_SUBMISSION_LIKE_THRESHOLD} likes before submitting.`,
    };
  }
  return { valid: true };
}

export const WINNER_SUBMISSION_STATUS_STYLES: Record<WinnerSubmissionStatus, string> = {
  submitted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  verified: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};
