"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { AnyCampaignsResponse, MyRaffleTicketsResponse, isV2Campaign } from "@/types";
import { useAdminConfig } from "@/hooks/use-admin-config";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Ticket, CheckCircle2 } from "lucide-react";
import { computeRaffleRequirement, formatEligibilityProgressText } from "./raffle-utils";

interface EligibilityProgressProps {
  className?: string;
}

export function EligibilityProgress({ className }: EligibilityProgressProps) {
  const user = useAtomValue(userAtom);
  const { get: getConfig } = useAdminConfig();
  const authHeaders = { headers: { Authorization: `Bearer ${user?.accessToken}` } };

  const { data: myTickets, isLoading: loadingTickets } = useQuery({
    queryKey: ["raffle-my-tickets"],
    queryFn: () =>
      axios
        .get<MyRaffleTicketsResponse>(endpointUrl(ENDPOINTS.RAFFLE_MY_TICKETS), authHeaders)
        .then((res) => res.data),
    enabled: !!user?.accessToken,
  });

  const { data: campaigns, isLoading: loadingCampaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () =>
      axios
        .get<AnyCampaignsResponse>(endpointUrl(ENDPOINTS.CAMPAIGNS), authHeaders)
        .then((res) => res.data.campaigns),
    enabled: !!user?.accessToken,
  });

  if (!user || (loadingTickets && loadingCampaigns)) return null;

  const activeCampaignCount = (campaigns || []).filter(
    (c) => isV2Campaign(c) && c.status === "active"
  ).length;
  const floorCap = getConfig("raffle.eligibilityFloorCap");
  const required = computeRaffleRequirement(activeCampaignCount, floorCap);
  const completedCount = myTickets?.tickets?.length ?? 0;
  const isEligible = myTickets?.eligibleThisWeek ?? completedCount >= required;
  const progressPercent = required > 0 ? Math.min(100, (completedCount / required) * 100) : 0;

  return (
    <Card
      data-testid="eligibility-progress"
      className={`bg-card/50 backdrop-blur-sm border-white/10 ${className ?? ""}`}>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center gap-2">
          {isEligible ? (
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          ) : (
            <Ticket className="h-5 w-5 text-secondary" />
          )}
          <span className="text-white font-semibold text-sm">
            Raffle Eligibility
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <p className="text-white/70 text-sm" data-testid="eligibility-progress-text">
          {formatEligibilityProgressText(completedCount, required)}
        </p>
      </CardContent>
    </Card>
  );
}
