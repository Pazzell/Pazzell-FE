"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { campaignHref } from "@/components/campaigns/campaign-links";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import { formatPrice } from "@/lib/utils";
import type { BrandCampaignsResponse } from "@/types";

const RECENT_COUNT = 5;

export default function BrandDashboard() {
  const { settings } = useGameSettings();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["brand-campaigns"],
    queryFn: () =>
      api.get<BrandCampaignsResponse>(ENDPOINTS.BRAND_CAMPAIGNS).then((res) => res.data.campaigns),
  });

  const campaigns = data ?? [];
  const count = (...statuses: string[]) =>
    campaigns.filter((campaign) => statuses.includes(campaign.status)).length;
  const tiles = [
    { label: "Live", value: count("live") },
    { label: "Drafts", value: count("draft", "awaiting_payment") },
    { label: "Ended", value: count("ended") },
    { label: "All campaigns", value: campaigns.length },
  ];
  const recent = [...campaigns]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECENT_COUNT);
  const { amount, currency, durationDays } = settings.campaign;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka">Dashboard</h1>
          <p className="text-white/70">Track your sponsored trivia campaigns</p>
        </div>
        <Button
          asChild
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
        >
          <Link href={routes.BRAND.CAMPAIGN_NEW}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <PageError
          title="Couldn't load your campaigns"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
          withLayout={false}
        />
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-2xl border border-white/10 bg-card/50 p-5">
                <p className="text-white/60 text-sm">{tile.label}</p>
                <p className="text-3xl font-bold text-white font-fredoka mt-1">{tile.value}</p>
              </div>
            ))}
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-dashed border-white/10 space-y-3 px-4">
              <Megaphone className="h-10 w-10 text-secondary mx-auto" />
              <p className="text-white font-semibold">Put your brand in front of players</p>
              <p className="text-white/60 max-w-md mx-auto">
                Build a short trivia about your brand. Freemium players are shown it between their
                games, for {formatPrice(amount, currency)} per {durationDays} days.
              </p>
            </div>
          ) : (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white font-fredoka">Recent campaigns</h2>
                <Link
                  href={routes.BRAND.CAMPAIGNS}
                  className="text-secondary hover:text-secondary/80 text-sm font-medium inline-flex items-center gap-1"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <ul className="space-y-2">
                {recent.map((campaign) => (
                  <li key={campaign.id}>
                    <Link
                      href={campaignHref(campaign)}
                      className="rounded-xl border border-white/10 bg-card/50 hover:border-secondary/40 transition-colors p-4 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <span className="text-white font-medium break-words min-w-0">
                        {campaign.title}
                      </span>
                      <CampaignStatusBadge status={campaign.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
