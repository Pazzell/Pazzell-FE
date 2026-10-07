"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Layers, Megaphone, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { campaignHref } from "@/components/campaigns/campaign-links";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { BrandCampaignsResponse } from "@/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function BrandCampaignsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["brand-campaigns"],
    queryFn: () =>
      api.get<BrandCampaignsResponse>(ENDPOINTS.BRAND_CAMPAIGNS).then((res) => res.data.campaigns),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka">Campaigns</h1>
          <p className="text-white/70">Sponsored trivia for freemium players</p>
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
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

      {data && data.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 space-y-3">
          <Megaphone className="h-10 w-10 text-secondary mx-auto" />
          <p className="text-white/60">You haven&apos;t created a campaign yet.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((campaign) => {
            const isBuilding =
              campaign.status === "draft" || campaign.status === "awaiting_payment";
            return (
              <li
                key={campaign.id}
                className="rounded-2xl border border-white/10 bg-card/50 p-5 flex items-center gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-[12rem] space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={campaignHref(campaign)}
                      className="text-lg font-bold text-white font-fredoka hover:text-secondary"
                    >
                      {campaign.title}
                    </Link>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                  <p className="text-white/50 text-sm flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {campaign.cardCount} {campaign.cardCount === 1 ? "card" : "cards"}
                    </span>
                    {campaign.startsAt && campaign.endsAt && (
                      <span>
                        {formatDate(campaign.startsAt)} – {formatDate(campaign.endsAt)}
                      </span>
                    )}
                  </p>
                  {campaign.moderationReason && (
                    <p className="text-red-300 text-sm">Reason: {campaign.moderationReason}</p>
                  )}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 text-white/80 hover:bg-white/10"
                >
                  <Link href={campaignHref(campaign)}>
                    {isBuilding ? (
                      <>
                        <Pencil className="h-4 w-4 mr-2" />
                        {campaign.status === "draft" ? "Continue" : "Finish payment"}
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Results
                      </>
                    )}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
