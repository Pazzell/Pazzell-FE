import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type { MeResponse, NoPointReason, PointsRules } from "@/types";

export const POINTS_QUERY_KEY = ["points"];

/**
 * The player's points from `GET /me`. The server applies the day and month changes on
 * every read, so always show these numbers as they come.
 */
export function usePoints(options: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: POINTS_QUERY_KEY,
    queryFn: () => api.get<MeResponse>(ENDPOINTS.ME).then((res) => res.data.points),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });
  return { ...query, points: query.data };
}

/** One line on what a quiz needs to earn a point, from the rules an admin set. */
export function pointRulesSummary(rules: PointsRules): string {
  const score =
    rules.minScorePercent >= 100 ? "get every question right" : `score at least ${rules.minScorePercent}%`;
  return `Play ${rules.minCards}+ cards and ${score} to earn 1 point (up to ${rules.dailyCap} a day).`;
}

/** Why a completed quiz earned no point, in the player's words. */
export function noPointMessage(reason: NoPointReason, rules: PointsRules): string {
  switch (reason) {
    case "practice":
      return "Practice doesn't earn points. Press Play Now to earn one for this set.";
    case "score_too_low":
      return rules.minScorePercent >= 100
        ? "Get every question right to earn a point."
        : `Score at least ${rules.minScorePercent}% to earn a point.`;
    case "too_few_cards":
      return `Play ${rules.minCards} or more cards to earn a point.`;
    case "set_already_earned":
      return "You've already earned a point for this set. Try a new set to earn another.";
    case "daily_cap":
      return `You've reached today's limit of ${rules.dailyCap} points. Come back tomorrow for more.`;
  }
}
