// Pure helpers for the v2 session play flow, kept free of React so the
// scoring/ordering logic is easy to unit test in isolation.

import axios from "axios";
import { CampaignData, CampaignV2Data, GameType } from "@/types";

// The reused game components (built for legacy single-game campaigns)
// expect a CampaignData shape. This adapts the fields they actually read
// (image, words, brand name) — quiz-related fields are unused in
// sessionMode since those components skip their own embedded quiz.
export function toLegacyShapedCampaign(
  campaign: CampaignV2Data,
  gameType: GameType
): CampaignData {
  return {
    _id: campaign._id,
    brandId: campaign.brandId,
    brandName: campaign.brandName,
    gameType,
    title: campaign.title,
    description: campaign.description,
    puzzleImageUrl: campaign.puzzleImageUrl,
    words: campaign.words,
    timeLimit: 0,
    questions: [],
    createdAt: campaign.createdAt,
    endDate: campaign.endDate,
    brandUrl: campaign.brandUrl ?? "",
    campaignUrl: campaign.campaignUrl ?? "",
    packageId: campaign.packageId,
    packageName: campaign.packageName,
    status: campaign.status,
    budgetRemaining: 0,
    budgetUsed: 0,
    paymentStatus: campaign.paymentStatus,
  };
}

export interface QuizQuestionLike {
  question: string;
  choices: string[];
  correctIndex: number;
}

// The session quiz-attempt endpoint only returns { score, allCorrect,
// attemptsSoFar, firstAttemptScore } — no per-question breakdown. The
// wizard bakes correctIndex into the campaign's questions client-side
// already, so "which were wrong" is computed locally against that,
// while allCorrect/score from the server remain the authoritative gate.
export function computeWrongIndices(
  questions: QuizQuestionLike[],
  answers: number[]
): number[] {
  return questions.reduce<number[]>((wrong, q, i) => {
    if (answers[i] !== q.correctIndex) wrong.push(i);
    return wrong;
  }, []);
}

export function isAllAnswered(answers: (number | null)[]): answers is number[] {
  return answers.length > 0 && answers.every((a) => a !== null);
}

// The backend sends specific, user-facing 400 messages for session errors
// (e.g. "All four games must be completed first", "Session is abandoned,
// cannot be completed") — surface those directly instead of a generic
// fallback, per the Frontend Integration Notes.
export function extractSessionErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) return message;
  }
  return fallback;
}

// A session left in_progress for 6+ hours is auto-marked abandoned
// server-side and can never be completed — the client must start a new
// session rather than retrying the dead sessionId.
export function isAbandonedSessionError(message: string): boolean {
  return message.toLowerCase().includes("abandoned");
}
