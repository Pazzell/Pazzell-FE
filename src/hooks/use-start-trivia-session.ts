import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type {
  ApiErrorBody,
  CampaignGateDetails,
  TriviaSessionResponse,
  TriviaSourceType,
} from "@/types";

export const TRIVIA_TIMER_STORAGE_KEY = "pazzell_trivia_timer_seconds";
export const TRIVIA_PRACTICE_STORAGE_KEY = "pazzell_trivia_practice";
export const TRIVIA_IMAGE_PERCENT_STORAGE_KEY = "pazzell_trivia_image_percent";

export interface StartTriviaSessionPayload {
  sourceType: TriviaSourceType;
  sourceId?: string;
  slug?: string;
  timerSeconds?: number;
  cardCount?: number;
  /** Share of picture cards, 0 to 100; left out, the server's default mix applies. */
  imagePercent?: number;
  /** Practice mode: the correct option is pointed at on every question. */
  practice?: boolean;
}

/**
 * Starts (or resumes) a trivia session and routes to the play page. One engine
 * serves topics, custom quizzes and campaigns, so every entry point uses this.
 * When the server answers `CAMPAIGN_REQUIRED`, the owed campaign is exposed as
 * `gate` for the caller to render instead of an error.
 */
export function useStartTriviaSession(options: { replace?: boolean } = {}) {
  const router = useRouter();
  const [gate, setGate] = useState<CampaignGateDetails | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: StartTriviaSessionPayload) =>
      api.post<TriviaSessionResponse>(ENDPOINTS.TRIVIA_SESSIONS, payload).then((res) => res.data),
    onSuccess: (data) => {
      const href = routes.USER.SESSION_PLAY(data.session.id);
      if (options.replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    onError: (error: AxiosError<ApiErrorBody>) => {
      const body = error.response?.data;
      const campaign = body?.details?.campaign as CampaignGateDetails | undefined;
      if (body?.code === "CAMPAIGN_REQUIRED" && campaign) {
        setGate(campaign);
        return;
      }
      toast.error(body?.message || "Couldn't start the trivia. Please try again.");
    },
  });

  return {
    start: mutation.mutate,
    // Stay "starting" through the route change so the button can't be pressed twice.
    isStarting: mutation.isPending || mutation.isSuccess,
    gate,
  };
}
