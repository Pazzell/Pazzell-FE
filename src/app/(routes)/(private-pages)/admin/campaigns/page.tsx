"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { cn } from "@/lib/utils";
import type { AdminCampaignsResponse, CampaignStatus } from "@/types";

const PAGE_SIZE = 20;

const FILTERS: { id: CampaignStatus | ""; label: string }[] = [
  { id: "", label: "All" },
  { id: "live", label: "Live" },
  { id: "paused", label: "Paused" },
  { id: "awaiting_payment", label: "Awaiting payment" },
  { id: "draft", label: "Draft" },
  { id: "ended", label: "Ended" },
  { id: "taken_down", label: "Taken down" },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function AdminCampaignsPage() {
  const [status, setStatus] = useState<CampaignStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ["admin-campaigns", status, page],
    queryFn: () =>
      api
        .get<AdminCampaignsResponse>(ENDPOINTS.ADMIN_CAMPAIGNS, {
          params: { ...(status ? { status } : {}), page, limit: PAGE_SIZE },
        })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const campaigns = data?.campaigns ?? [];
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  const selectStatus = (next: CampaignStatus | "") => {
    setStatus(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Campaigns</h1>
        <p className="text-white/70">Review, pause or take down sponsored trivia</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((filter) => (
          <button
            key={filter.id || "all"}
            type="button"
            aria-pressed={status === filter.id}
            onClick={() => selectStatus(filter.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              status === filter.id
                ? "border-secondary bg-secondary/10 text-white"
                : "border-white/10 text-white/60 hover:border-white/30"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <PageError
          title="Couldn't load campaigns"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
          withLayout={false}
        />
      )}

      {data && campaigns.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 space-y-3">
          <Megaphone className="h-10 w-10 text-secondary mx-auto" />
          <p className="text-white/60">
            {page > 1 ? "No more campaigns." : "No campaigns match this filter."}
          </p>
        </div>
      )}

      {campaigns.length > 0 && (
        <ul className={cn("space-y-3", isPlaceholderData && "opacity-60")}>
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <Link
                href={routes.ADMIN.CAMPAIGN(campaign.id)}
                className="rounded-2xl border border-white/10 bg-card/50 hover:border-secondary/40 transition-colors p-4 flex items-center gap-4 flex-wrap"
              >
                <div className="flex-1 min-w-[12rem] space-y-1">
                  <p className="text-white font-semibold break-words">{campaign.title}</p>
                  <p className="text-white/50 text-sm flex items-center gap-3 flex-wrap">
                    <span>by {campaign.brandName}</span>
                    {campaign.startsAt && campaign.endsAt && (
                      <span>
                        {formatDate(campaign.startsAt)} – {formatDate(campaign.endsAt)}
                      </span>
                    )}
                  </p>
                </div>
                <CampaignStatusBadge status={campaign.status} />
                <ChevronRight className="h-5 w-5 text-white/40 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-white/60 text-sm">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= pageCount || isPlaceholderData}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
