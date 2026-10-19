"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Megaphone, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import { TRIVIA_TIMER_STORAGE_KEY } from "@/hooks/use-start-trivia-session";
import type {
  ApiErrorBody,
  CampaignByIdResponse,
  CampaignGateDetails,
  TriviaSessionResponse,
} from "@/types";

const DEFAULT_CARD_COUNT = 10;

interface CampaignGateProps {
  campaign: CampaignGateDetails;
  /** The player's choices for the trivia they were about to play, when known. */
  timerSeconds?: number;
  cardCount?: number;
  practice?: boolean;
}

/**
 * The interstitial shown when a freemium player owes a sponsored trivia
 * (`CAMPAIGN_REQUIRED`, or `campaignGate.required` on a result).
 */
export function CampaignGate({ campaign, timerSeconds, cardCount, practice }: CampaignGateProps) {
  const router = useRouter();
  const { settings } = useGameSettings();

  const play = useMutation({
    mutationFn: async () => {
      const { data } = await api.get<CampaignByIdResponse>(ENDPOINTS.CAMPAIGN_BY_ID(campaign.id));
      const { min, max } = data.cardCountBounds;
      const { minSeconds, maxSeconds, defaultSeconds } = settings.timer;
      const stored = Number(localStorage.getItem(TRIVIA_TIMER_STORAGE_KEY));
      const timer = timerSeconds ?? (stored || defaultSeconds);
      const res = await api.post<TriviaSessionResponse>(ENDPOINTS.TRIVIA_SESSIONS, {
        sourceType: "campaign",
        sourceId: campaign.id,
        timerSeconds: Math.min(maxSeconds, Math.max(minSeconds, Math.round(timer))),
        cardCount: Math.min(
          max,
          Math.max(min, cardCount ?? Math.max(DEFAULT_CARD_COUNT, settings.points.minCards))
        ),
        ...(practice ? { practice: true } : {}),
      });
      return res.data;
    },
    onSuccess: (data) => router.push(routes.USER.SESSION_PLAY(data.session.id)),
    onError: (error: AxiosError<ApiErrorBody>) => {
      toast.error(
        error.response?.data?.message || "Couldn't start the sponsored trivia. Please try again."
      );
    },
  });

  const busy = play.isPending || play.isSuccess;

  return (
    <div className="w-full max-w-md mx-auto bg-card/50 border border-secondary/30 rounded-2xl p-6 space-y-5 text-center">
      <div className="flex items-center justify-center gap-2 text-secondary text-sm font-medium uppercase tracking-wider">
        <Megaphone className="h-4 w-4" />
        Sponsored trivia
      </div>
      <div className="flex flex-col items-center gap-3">
        {campaign.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.logoUrl}
            alt={`${campaign.brandName} logo`}
            className="h-16 w-16 rounded-xl object-contain bg-white p-1"
          />
        )}
        <div>
          <h2 className="text-xl font-bold text-white font-fredoka">{campaign.title}</h2>
          <p className="text-white/60 text-sm">by {campaign.brandName}</p>
        </div>
        {campaign.description && <p className="text-white/70 text-sm">{campaign.description}</p>}
      </div>
      <p className="text-white/70 text-sm">
        Play this short sponsored trivia to keep going.{" "}
        <Link href={routes.USER.PRO} className="text-secondary hover:text-secondary/80 font-medium">
          Pro players are never interrupted.
        </Link>
      </p>
      <Button
        onClick={() => play.mutate()}
        disabled={busy}
        className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg py-6"
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Play Sponsored Trivia
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}
