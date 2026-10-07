"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Ban, ExternalLink, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardList } from "@/components/cards/card-manager";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { BrandCampaign, BrandCampaignDashboardResponse, TriviaCard } from "@/types";

interface AdminCampaignDetail {
  campaign: BrandCampaign;
  cards?: TriviaCard[];
  dashboard?: BrandCampaignDashboardResponse["dashboard"];
}

type ReasonAction = "pause" | "takedown";

const REASON_COPY: Record<ReasonAction, { title: string; description: string; confirm: string }> = {
  pause: {
    title: "Pause this campaign?",
    description:
      "Players stop seeing it until you resume it. Its paid days keep running while paused. The brand sees your reason.",
    confirm: "Pause campaign",
  },
  takedown: {
    title: "Take this campaign down?",
    description:
      "This is permanent: the campaign can never be shown again. The brand sees your reason.",
    confirm: "Take down permanently",
  },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function AdminCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [reason, setReason] = useState("");
  const [confirmResume, setConfirmResume] = useState(false);

  const campaignKey = ["admin-campaign", id];
  const { data, isLoading, error } = useQuery({
    queryKey: campaignKey,
    queryFn: () =>
      api.get<AdminCampaignDetail>(ENDPOINTS.ADMIN_CAMPAIGN(id)).then((res) => res.data),
  });

  const moderate = useMutation({
    mutationFn: (input: { action: ReasonAction | "resume"; reason?: string }) => {
      switch (input.action) {
        case "pause":
          return api.post(ENDPOINTS.ADMIN_CAMPAIGN_PAUSE(id), { reason: input.reason });
        case "takedown":
          return api.post(ENDPOINTS.ADMIN_CAMPAIGN_TAKEDOWN(id), { reason: input.reason });
        case "resume":
          return api.post(ENDPOINTS.ADMIN_CAMPAIGN_RESUME(id));
      }
    },
    onSuccess: (_res, input) => {
      toast.success(
        { pause: "Campaign paused.", takedown: "Campaign taken down.", resume: "Campaign resumed." }[
          input.action
        ]
      );
      setReasonAction(null);
      setConfirmResume(false);
      setReason("");
      queryClient.invalidateQueries({ queryKey: campaignKey });
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
    onError: (err) => {
      const body = getApiError(err);
      // Its status changed since this page loaded: show what it is now.
      if (body?.code === "INVALID_CAMPAIGN_STATE") {
        setReasonAction(null);
        setConfirmResume(false);
        queryClient.invalidateQueries({ queryKey: campaignKey });
      }
      toast.error(body?.message || "That didn't work. Please try again.");
    },
  });

  if (isLoading) {
    return <PageLoader message="Loading campaign..." withLayout={false} />;
  }

  if (error || !data) {
    return (
      <PageError
        title="Campaign not found"
        message="This campaign does not exist."
        onRetry={() => router.push(routes.ADMIN.CAMPAIGNS)}
        withLayout={false}
      />
    );
  }

  const { campaign, dashboard } = data;
  const cards = data.cards ?? [];
  const status = dashboard?.status ?? campaign.status;
  const canTakeDown = status !== "taken_down";

  const tiles = dashboard
    ? [
        { label: "Plays", value: dashboard.plays.toLocaleString() },
        { label: "Completions", value: dashboard.completions.toLocaleString() },
        {
          label: "Average score",
          value: dashboard.completions > 0 ? `${Math.round(dashboard.averageScorePercent)}%` : "—",
        },
        { label: "Link clicks", value: dashboard.urlClicks.toLocaleString() },
      ]
    : [];

  const submitReason = () => {
    if (!reasonAction) return;
    if (!reason.trim()) {
      toast.error("A reason is required.");
      return;
    }
    moderate.mutate({ action: reasonAction, reason: reason.trim() });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <Link
        href={routes.ADMIN.CAMPAIGNS}
        className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Campaigns
      </Link>

      <div className="flex items-start gap-4">
        {campaign.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.logoUrl}
            alt={`${campaign.brandName} logo`}
            className="h-16 w-16 rounded-xl object-contain bg-white p-1 shrink-0"
          />
        )}
        <div className="space-y-2 min-w-0">
          <h1 className="text-3xl font-bold text-white font-fredoka break-words">
            {campaign.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <CampaignStatusBadge status={status} />
            <span className="text-white/60 text-sm">by {campaign.brandName}</span>
            {campaign.startsAt && campaign.endsAt && (
              <span className="text-white/60 text-sm">
                {formatDate(campaign.startsAt)} – {formatDate(campaign.endsAt)}
              </span>
            )}
          </div>
          {campaign.description && <p className="text-white/70">{campaign.description}</p>}
          {campaign.websiteUrl && (
            <a
              href={campaign.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-secondary/80 text-sm inline-flex items-center gap-1 break-all"
            >
              {campaign.ctaText ?? "Visit our site"} → {campaign.websiteUrl}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          )}
        </div>
      </div>

      {campaign.moderationReason && (
        <p className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200 text-sm">
          Moderation reason: {campaign.moderationReason}
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-card/50 p-5 space-y-3">
        <h2 className="text-white font-semibold">Moderation</h2>
        <div className="flex gap-2 flex-wrap">
          {status === "live" && (
            <Button
              variant="outline"
              onClick={() => setReasonAction("pause")}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {status === "paused" && (
            <Button
              onClick={() => setConfirmResume(true)}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {canTakeDown && (
            <Button variant="destructive" onClick={() => setReasonAction("takedown")}>
              <Ban className="h-4 w-4 mr-2" />
              Take Down
            </Button>
          )}
          {!canTakeDown && (
            <p className="text-white/60 text-sm">This campaign was taken down permanently.</p>
          )}
        </div>
      </section>

      {tiles.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-white/10 bg-card/50 p-5">
              <p className="text-white/60 text-sm">{tile.label}</p>
              <p className="text-2xl font-bold text-white font-fredoka">{tile.value}</p>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white font-fredoka">Cards ({cards.length})</h2>
        {cards.length > 0 ? (
          <CardList cards={cards} />
        ) : (
          <p className="text-white/60">This campaign has no cards.</p>
        )}
      </section>

      <Dialog
        open={reasonAction !== null}
        onOpenChange={(open) => {
          if (!open) setReasonAction(null);
        }}
      >
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white font-fredoka text-xl">
              {reasonAction && REASON_COPY[reasonAction].title}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {reasonAction && REASON_COPY[reasonAction].description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="moderation-reason" className="text-white/80">
              Reason
            </Label>
            <Textarea
              id="moderation-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReasonAction(null)}
              disabled={moderate.isPending}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant={reasonAction === "takedown" ? "destructive" : "default"}
              onClick={submitReason}
              disabled={moderate.isPending}
            >
              {moderate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reasonAction && REASON_COPY[reasonAction].confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmResume}
        onOpenChange={setConfirmResume}
        title="Resume this campaign?"
        description="Players start seeing it again. If its paid days have run out it becomes ended instead."
        confirmLabel="Resume"
        pending={moderate.isPending}
        onConfirm={() => moderate.mutate({ action: "resume" })}
      />
    </div>
  );
}
