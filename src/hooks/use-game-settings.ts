import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type { GameSettings, GameSettingsResponse } from "@/types";

// Sensible fallbacks only — never hard-code these for real decisions.
// Used only while the request is in flight or if it fails.
const FALLBACK_SETTINGS: GameSettings = {
  timer: { minSeconds: 1, maxSeconds: 7, matchDefaultSeconds: 5 },
  trivia: { minCards: 5, maxCards: 30 },
  customQuiz: { freeLimit: 1, minCardsToPublish: 5 },
  pro: { amount: 1330.21, currency: "NGN", durationDays: 30 },
  campaign: { amount: 13302.07, currency: "NGN", durationDays: 30, interruptionThreshold: 10 },
};

export function useGameSettings() {
  const query = useQuery<GameSettings>({
    queryKey: ["game-settings"],
    queryFn: () =>
      api
        .get<GameSettingsResponse>(ENDPOINTS.GAME_SETTINGS)
        .then((res) => res.data.settings),
    staleTime: Infinity,
  });

  return {
    ...query,
    settings: query.data ?? FALLBACK_SETTINGS,
  };
}
