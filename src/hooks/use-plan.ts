import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type { PlanMeResponse } from "@/types";

export const PLAN_QUERY_KEY = ["plan"];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days of Pro remaining, rounded up; 0 when not Pro. */
export function proDaysLeft(proUntil: string | null | undefined): number {
  if (!proUntil) return 0;
  return Math.max(0, Math.ceil((new Date(proUntil).getTime() - Date.now()) / DAY_MS));
}

/**
 * The player's plan from `GET /plan/me`. The tier is computed on the server on
 * every request, so always read it from here rather than from stored user data.
 */
export function usePlan(options: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: PLAN_QUERY_KEY,
    queryFn: () => api.get<PlanMeResponse>(ENDPOINTS.PLAN_ME).then((res) => res.data),
    staleTime: 60 * 1000,
    enabled: options.enabled ?? true,
  });

  return {
    ...query,
    plan: query.data?.plan,
    isPro: query.data?.plan.isPro ?? false,
    daysLeft: proDaysLeft(query.data?.plan.proUntil),
  };
}
