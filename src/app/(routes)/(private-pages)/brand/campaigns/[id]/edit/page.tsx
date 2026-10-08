"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, BarChart3, CreditCard, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CardList, CardManager } from "@/components/cards/card-manager";
import {
  CampaignDetailsForm,
  type CampaignDetailsPayload,
} from "@/components/campaigns/campaign-details-form";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { SessionSetup } from "@/components/trivia/session-setup";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import { useStartTriviaSession } from "@/hooks/use-start-trivia-session";
import { cn, formatPrice } from "@/lib/utils";
import type {
  BrandCampaignPricingResponse,
  BrandCampaignResponse,
  CheckoutResponse,
} from "@/types";

const STEPS = [
  { id: "details", label: "Details" },
  { id: "cards", label: "Cards" },
  { id: "review", label: "Review & Pay" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

function CampaignBuilder() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { settings } = useGameSettings();
  const { start, isStarting } = useStartTriviaSession();

  const requestedStep = searchParams.get("step");
  const [step, setStep] = useState<StepId>(
    STEPS.some((s) => s.id === requestedStep) ? (requestedStep as StepId) : "details"
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  // One key per visit, so a double press returns the same checkout instead of a second one.
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const campaignKey = ["brand-campaign", id];
  const { data, isLoading, error } = useQuery({
    queryKey: campaignKey,
    queryFn: () =>
      api.get<BrandCampaignResponse>(ENDPOINTS.BRAND_CAMPAIGN(id)).then((res) => res.data),
  });

  const { data: pricingData } = useQuery({
    queryKey: ["brand-campaign-pricing"],
    queryFn: () =>
      api
        .get<BrandCampaignPricingResponse>(ENDPOINTS.BRAND_CAMPAIGNS_PRICING)
        .then((res) => res.data),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: campaignKey });
    queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
  };

  const onActionError = (err: unknown, fallback: string) => {
    const body = getApiError(err);
    // Its status moved on (paid, moderated) since this page loaded.
    if (body?.code === "CAMPAIGN_NOT_EDITABLE" || body?.code === "CAMPAIGN_NOT_PAYABLE") refresh();
    toast.error(body?.message || fallback);
  };

  const saveDetails = useMutation({
    mutationFn: (payload: CampaignDetailsPayload) =>
      api.patch(ENDPOINTS.BRAND_CAMPAIGN(id), payload),
    onSuccess: () => {
      toast.success("Details saved.");
      refresh();
      setStep("cards");
    },
    onError: (err) => onActionError(err, "Couldn't save the campaign. Please try again."),
  });

  const checkout = useMutation({
    // Resuming an unpaid checkout sends no key: the API then hands back the checkout
    // that is already open instead of starting a second one.
    mutationFn: (mode: "new" | "resume") =>
      api
        .post<CheckoutResponse>(
          ENDPOINTS.BRAND_CAMPAIGN_CHECKOUT(id),
          mode === "new" ? { idempotencyKey: idempotencyKey.current } : {}
        )
        .then((res) => res.data),
    onSuccess: (response) => {
      window.location.href = response.checkout.authorizationUrl;
    },
    onError: (err) => {
      // A key that has failed once is dead on the server: the next press needs a new one.
      idempotencyKey.current = crypto.randomUUID();
      onActionError(err, "Couldn't start the checkout. Please try again.");
    },
  });

  const cancelCheckout = useMutation({
    mutationFn: () => api.post(ENDPOINTS.BRAND_CAMPAIGN_CANCEL_CHECKOUT(id)),
    onSuccess: () => {
      toast.success("Checkout cancelled. You can edit the campaign again.");
      refresh();
    },
    onError: (err) => onActionError(err, "Couldn't cancel the checkout. Please try again."),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(ENDPOINTS.BRAND_CAMPAIGN(id)),
    onSuccess: () => {
      toast.success("Draft deleted.");
      queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
      router.replace(routes.BRAND.CAMPAIGNS);
    },
    onError: (err) => {
      setConfirmDelete(false);
      onActionError(err, "Couldn't delete the campaign. Please try again.");
    },
  });

  if (isLoading) {
    return <PageLoader message="Loading campaign..." withLayout={false} />;
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

  const { campaign } = data;
  const cards = data.cards ?? [];
  const pricing = data.pricing ?? pricingData?.pricing ?? settings.campaign;
  const minCards =
    data.minCardsToPublish ??
    pricingData?.minCardsToPublish ??
    settings.customQuiz.minCardsToPublish;
  const price = formatPrice(pricing.amount, pricing.currency);
  const isDraft = campaign.status === "draft";
  const awaitingPayment = campaign.status === "awaiting_payment";
  const enoughCards = cards.length >= minCards;
  // Redirecting to the gateway takes a moment; keep the button busy until the page unloads.
  const paying = checkout.isPending || checkout.isSuccess;

  const max = Math.min(cards.length, settings.trivia.maxCards);
  const testPlay = cards.length > 0 && (
    <section className="flex flex-col items-center gap-3">
      <h2 className="text-xl font-bold text-white font-fredoka">Test play</h2>
      <p className="text-white/60 text-sm text-center max-w-sm">
        See it the way players will. Test plays are never counted.
      </p>
      <SessionSetup
        bounds={data.cardCountBounds ?? { min: Math.min(settings.trivia.minCards, max), max }}
        startLabel="Start Test Play"
        isStarting={isStarting}
        onStart={(picked) => start({ sourceType: "campaign", sourceId: campaign.id, ...picked })}
      />
    </section>
  );

  const header = (
    <>
      <Link
        href={routes.BRAND.CAMPAIGNS}
        className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Campaigns
      </Link>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white font-fredoka break-words">{campaign.title}</h1>
        <CampaignStatusBadge status={campaign.status} />
      </div>
    </>
  );

  // Only a draft is editable. Anything else is shown as it stands.
  if (!isDraft) {
    return (
      <div className="space-y-8 max-w-3xl">
        {header}

        {awaitingPayment ? (
          <section className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-5 space-y-4">
            <p className="text-yellow-100">
              This campaign is waiting for payment of {price}. It goes live for{" "}
              {pricing.durationDays} days as soon as the payment is confirmed.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => checkout.mutate("resume")}
                disabled={paying || cancelCheckout.isPending}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                {paying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Continue to Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => cancelCheckout.mutate()}
                disabled={paying || cancelCheckout.isPending}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                Cancel and Edit
              </Button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-card/50 p-5 space-y-4">
            <p className="text-white/70">
              This campaign can no longer be edited.
              {campaign.moderationReason && ` Reason: ${campaign.moderationReason}`}
            </p>
            <Button
              asChild
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            >
              <Link href={routes.BRAND.CAMPAIGN_DASHBOARD(campaign.id)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Results
              </Link>
            </Button>
          </section>
        )}

        {testPlay}

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white font-fredoka">Cards ({cards.length})</h2>
          <CardList cards={cards} />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {header}

      <nav aria-label="Campaign steps" className="grid grid-cols-3 gap-2">
        {STEPS.map((s, index) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            aria-current={step === s.id ? "step" : undefined}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors text-left",
              step === s.id
                ? "border-secondary bg-secondary/10 text-white"
                : "border-white/10 text-white/60 hover:border-white/30"
            )}
          >
            <span className="text-white/40 mr-1.5">{index + 1}.</span>
            {s.label}
          </button>
        ))}
      </nav>

      {step === "details" && (
        <section className="rounded-2xl border border-white/10 bg-card/50 p-6">
          <CampaignDetailsForm
            key={campaign.id}
            campaign={campaign}
            submitLabel="Save and Continue"
            pending={saveDetails.isPending}
            onSubmit={(payload) => saveDetails.mutate(payload)}
          />
        </section>
      )}

      {step === "cards" && (
        <>
          <CardManager
            cards={cards}
            minCards={minCards}
            onChanged={refresh}
            endpoints={{
              create: ENDPOINTS.BRAND_CAMPAIGN_CARDS(id),
              bulk: ENDPOINTS.BRAND_CAMPAIGN_CARDS_BULK(id),
              card: (cardId) => ENDPOINTS.BRAND_CAMPAIGN_CARD(id, cardId),
            }}
          />
          <Button
            onClick={() => setStep("review")}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
          >
            Continue to Review
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </>
      )}

      {step === "review" && (
        <>
          <section className="rounded-2xl border border-secondary/30 bg-card/50 p-6 space-y-5">
            <div className="flex items-center gap-4">
              {campaign.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={campaign.logoUrl}
                  alt={`${campaign.brandName} logo`}
                  className="h-14 w-14 rounded-xl object-contain bg-white p-1"
                />
              )}
              <div className="min-w-0">
                <p className="text-white font-semibold break-words">{campaign.title}</p>
                <p className="text-white/60 text-sm">by {campaign.brandName}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-white/60">Cards</dt>
                <dd className="text-white font-semibold">{cards.length}</dd>
              </div>
              <div>
                <dt className="text-white/60">Link button</dt>
                <dd className="text-white font-semibold break-words">
                  {campaign.websiteUrl ? campaign.ctaText ?? "Visit our site" : "No link set"}
                </dd>
              </div>
              <div>
                <dt className="text-white/60">Price</dt>
                <dd className="text-white font-semibold">{price}</dd>
              </div>
              <div>
                <dt className="text-white/60">Runs for</dt>
                <dd className="text-white font-semibold">{pricing.durationDays} days</dd>
              </div>
            </dl>
            <p className="text-white/60 text-sm">
              One flat price. The {pricing.durationDays} days start when your payment is confirmed,
              and the campaign can&apos;t be edited after that.
            </p>
            {!enoughCards && (
              <p className="text-yellow-300 text-sm">
                Add {minCards - cards.length} more {minCards - cards.length === 1 ? "card" : "cards"}{" "}
                to reach the minimum of {minCards} before paying.
              </p>
            )}
            <Button
              onClick={() => checkout.mutate("new")}
              disabled={paying || !enoughCards}
              className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg py-6"
            >
              {paying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay {price} and Go Live
                </>
              )}
            </Button>
          </section>

          {testPlay}
        </>
      )}

      <div className="pt-4 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={() => setConfirmDelete(true)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete draft
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${campaign.title}"?`}
        description="The draft and its cards are removed. This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

export default function EditCampaignPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading campaign..." withLayout={false} />}>
      <CampaignBuilder />
    </Suspense>
  );
}
