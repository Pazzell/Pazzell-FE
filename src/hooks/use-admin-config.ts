import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { endpointUrl } from "@/app/_utils/helper";
import { AdminConfigResponse } from "@/types";

// Documented defaults from API_CONTRACT_WEEKLY_MIGRATION.md §7/§10.
// GET /admin/config is admin-only, and this app has no admin user type,
// so for everyone else these defaults are the only source of truth
// until a public config-subset endpoint exists. Weekly campaign pricing
// specifically should prefer GET /payments/calculate-weekly-price (public)
// over this hook, since that endpoint is live and package/week-aware.
export const ADMIN_CONFIG_DEFAULTS = {
  "pricing.basic.weeklyPrice": 7000,
  "pricing.premium.weeklyPrice": 10000,
  "payout.playerSharePercent": 50,
  "payout.platformSharePercent": 50,
  "payout.rankDistribution": [
    30, 20, 15, 10, 8, 6, 4, 3, 2, 2,
  ] as number[],
  "raffle.eligibilityFloorCap": 3,
  "referral.pointsThreshold": 21,
  "referral.referrerBonusPoints": 5,
  "points.sessionCompletionPoints": 7,
  "forum.winnerShareBonusPoints": 5,
  "campaign.quizQuestionCount": 3,
  "video.maxDurationSeconds": 130,
  "video.maxSizeBytes": 100 * 1024 * 1024,
} as const;

export type AdminConfigKey = keyof typeof ADMIN_CONFIG_DEFAULTS;

/**
 * Resolves config values that are admin-adjustable server-side (pricing,
 * payout split, thresholds, etc.) rather than hardcoding them. Attempts
 * the live GET /admin/config endpoint and merges any values it returns
 * over the documented defaults; silently falls back to defaults on any
 * error (401/403 for non-admins, network failure, etc.) since there's
 * currently no public equivalent endpoint.
 */
export function useAdminConfig() {
  const user = useAtomValue(userAtom);

  const query = useQuery({
    queryKey: ["admin-config"],
    queryFn: async () => {
      const res = await axios.get<AdminConfigResponse>(
        endpointUrl(ENDPOINTS.ADMIN_CONFIG),
        { headers: { Authorization: `Bearer ${user?.accessToken}` } }
      );
      return res.data.config;
    },
    enabled: !!user?.accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });

  const get = <K extends AdminConfigKey>(
    key: K
  ): (typeof ADMIN_CONFIG_DEFAULTS)[K] => {
    const live = query.data?.[key]?.value;
    return live !== undefined
      ? (live as (typeof ADMIN_CONFIG_DEFAULTS)[K])
      : ADMIN_CONFIG_DEFAULTS[key];
  };

  return { get, isLoading: query.isLoading, isFromServer: !!query.data };
}
