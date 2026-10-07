"use client";

import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { usePlan } from "@/hooks/use-plan";
import { formatPrice } from "@/lib/utils";
import type { ApiErrorBody, CheckoutResponse } from "@/types";
import { AlertTriangle, CalendarClock, Check, Loader2, Sparkles } from "lucide-react";

const RENEWAL_REMINDER_DAYS = 5;

const BENEFITS = [
  "Never interrupted by sponsored trivia",
  "Unlimited custom trivias to create and share",
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export default function ProPage() {
  const { data, isLoading, error, refetch, isPro, daysLeft } = usePlan();

  // One key per visit, so a double press returns the same checkout instead of a second one.
  const idempotencyKey = useRef<string>(crypto.randomUUID());

  const checkout = useMutation({
    mutationFn: () =>
      api
        .post<CheckoutResponse>(ENDPOINTS.PLAN_PRO_CHECKOUT, {
          idempotencyKey: idempotencyKey.current,
        })
        .then((res) => res.data),
    onSuccess: (response) => {
      window.location.href = response.checkout.authorizationUrl;
    },
    onError: (err: AxiosError<ApiErrorBody>) => {
      const body = err.response?.data;
      // The key belongs to a checkout that is finished: the next press needs a new one.
      if (body?.code === "ALREADY_PAID" || body?.code === "CHECKOUT_EXPIRED") {
        idempotencyKey.current = crypto.randomUUID();
        refetch();
      }
      toast.error(body?.message || "Couldn't start the checkout. Please try again.");
    },
  });

  if (isLoading) {
    return <PageLoader message="Loading your plan..." />;
  }

  if (error || !data) {
    return (
      <PageError
        title="Couldn't load your plan"
        message="Please check your connection and try again."
        onRetry={() => refetch()}
      />
    );
  }

  const { plan, pricing, history } = data;
  const price = formatPrice(pricing.amount, pricing.currency);
  const lastPeriod = history[0] ? history.reduce((a, b) => (a.endsAt > b.endsAt ? a : b)) : null;
  const expired = !isPro && lastPeriod !== null;
  const endingSoon = isPro && daysLeft <= RENEWAL_REMINDER_DAYS;
  // Redirecting to the gateway takes a moment; keep the button busy until the page unloads.
  const busy = checkout.isPending || checkout.isSuccess;

  return (
    <MainLayout maxWidth="2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-yellow-400" />
            Pazzell Pro
          </h1>
          <p className="text-white/70">Play without interruptions and build as many trivias as you like.</p>
        </div>

        <div className="bg-card/50 border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/60 text-sm">Your plan</p>
            <p className="text-2xl font-bold text-white font-fredoka capitalize">{plan.tier}</p>
          </div>
          {isPro && plan.proUntil && (
            <div className="text-right">
              <p className="text-white font-semibold flex items-center gap-2 justify-end">
                <CalendarClock className="h-4 w-4 text-secondary" />
                {daysLeft} {daysLeft === 1 ? "day" : "days"} left
              </p>
              <p className="text-white/60 text-sm">Until {formatDate(plan.proUntil)}</p>
            </div>
          )}
        </div>

        {(endingSoon || expired) && (
          <div className="flex items-start gap-3 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-yellow-100 text-sm">
              {expired && lastPeriod
                ? `Your Pro ended on ${formatDate(lastPeriod.endsAt)}. Renew to get it back.`
                : `Your Pro ends in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}. Renew now and the new ${pricing.durationDays} days are added on top.`}
            </p>
          </div>
        )}

        <div className="bg-card/50 border border-secondary/30 rounded-2xl p-6 space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white font-fredoka">{price}</span>
            <span className="text-white/60">for {pricing.durationDays} days</span>
          </div>

          <ul className="space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-white/80">
                <Check className="h-5 w-5 text-green-400 shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>

          <Button
            onClick={() => checkout.mutate()}
            disabled={busy}
            className="w-full bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-fredoka text-lg py-6"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPro ? (
              `Add ${pricing.durationDays} More Days`
            ) : expired ? (
              "Renew Pro"
            ) : (
              "Upgrade to Pro"
            )}
          </Button>
          <p className="text-white/50 text-xs text-center">
            One-time payment through Paystack. It does not renew automatically.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
