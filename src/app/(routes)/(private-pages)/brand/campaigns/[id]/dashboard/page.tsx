"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  MousePointerClick,
  Play,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { BrandCampaignDashboardResponse } from "@/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function CampaignDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["brand-campaign-dashboard", id],
    queryFn: () =>
      api
        .get<BrandCampaignDashboardResponse>(ENDPOINTS.BRAND_CAMPAIGN_DASHBOARD(id))
        .then((res) => res.data),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return <PageLoader message="Loading results..." withLayout={false} />;
  }

  if (error || !data) {
    return (
      <PageError
        title="Campaign not found"
        message="This campaign does not exist or isn't yours."
        onRetry={() => router.push(routes.BRAND.CAMPAIGNS)}
        withLayout={false}
      />
    );
  }

  const { campaign, dashboard } = data;
  const completionRate =
    dashboard.plays > 0 ? Math.round((dashboard.completions / dashboard.plays) * 100) : null;

  const tiles = [
    { label: "Plays", value: dashboard.plays.toLocaleString(), icon: Play },
    {
      label: "Completions",
      value: dashboard.completions.toLocaleString(),
      hint: completionRate !== null ? `${completionRate}% of plays` : undefined,
      icon: CheckCircle2,
    },
    {
      label: "Average score",
      value: dashboard.completions > 0 ? `${Math.round(dashboard.averageScorePercent)}%` : "—",
      hint:
        dashboard.completions > 0
          ? `${dashboard.averageScore.toFixed(1)} of ${campaign.cardCount} cards`
          : undefined,
      icon: Target,
    },
    { label: "Link clicks", value: dashboard.urlClicks.toLocaleString(), icon: MousePointerClick },
    {
      label: "People who clicked",
      value: dashboard.uniqueUrlClickers.toLocaleString(),
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href={routes.BRAND.CAMPAIGNS}
        className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Campaigns
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl font-bold text-white font-fredoka break-words">
            {campaign.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <CampaignStatusBadge status={dashboard.status} />
            {dashboard.startsAt && dashboard.endsAt && (
              <span className="text-white/60 text-sm">
                {formatDate(dashboard.startsAt)} – {formatDate(dashboard.endsAt)}
              </span>
            )}
            {dashboard.status === "live" && (
              <span className="text-white/80 text-sm font-medium">
                {dashboard.daysRemaining} {dashboard.daysRemaining === 1 ? "day" : "days"} left
              </span>
            )}
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-white/20 text-white/80 hover:bg-white/10"
        >
          <Link href={routes.BRAND.CAMPAIGN_EDIT(campaign.id)}>
            <Eye className="h-4 w-4 mr-2" />
            Cards &amp; Test Play
          </Link>
        </Button>
      </div>

      {campaign.moderationReason && (
        <p className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200 text-sm">
          {dashboard.status === "paused" ? "Paused" : "Taken down"} by Pazzell:{" "}
          {campaign.moderationReason}
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-white/10 bg-card/50 p-5">
            <p className="text-white/60 text-sm flex items-center gap-2">
              <tile.icon className="h-4 w-4" />
              {tile.label}
            </p>
            <p className="text-3xl font-bold text-white font-fredoka mt-1">{tile.value}</p>
            {tile.hint && <p className="text-white/50 text-xs mt-1">{tile.hint}</p>}
          </div>
        ))}
      </div>

      <p className="text-white/50 text-sm">
        These are totals for the whole campaign. Individual players are never shown.
      </p>
    </div>
  );
}
