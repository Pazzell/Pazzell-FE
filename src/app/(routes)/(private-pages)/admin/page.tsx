"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { cn, formatPrice } from "@/lib/utils";
import type {
  AdminPaymentsResponse,
  AdminRevenueResponse,
  PaymentPurpose,
  PaymentStatus,
} from "@/types";

const PAGE_SIZE = 20;

const PURPOSE_LABEL: Record<PaymentPurpose, string> = { pro: "Pro", campaign: "Campaign" };

const STATUS_CLASS: Record<PaymentStatus, string> = {
  success: "text-green-300",
  pending: "text-yellow-200",
  failed: "text-red-300",
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T | ""; label: string }[];
  value: T | "";
  onChange: (value: T | "") => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id || "all"}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition-colors",
            value === option.id
              ? "border-secondary bg-secondary/10 text-white"
              : "border-white/10 text-white/60 hover:border-white/30"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [purpose, setPurpose] = useState<PaymentPurpose | "">("");
  const [page, setPage] = useState(1);

  const revenue = useQuery({
    queryKey: ["admin-revenue", from, to],
    queryFn: () =>
      api
        .get<AdminRevenueResponse>(ENDPOINTS.ADMIN_REVENUE, {
          params: { ...(from ? { from } : {}), ...(to ? { to } : {}) },
        })
        .then((res) => res.data),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const payments = useQuery({
    queryKey: ["admin-payments", status, purpose, page],
    queryFn: () =>
      api
        .get<AdminPaymentsResponse>(ENDPOINTS.ADMIN_PAYMENTS, {
          params: {
            ...(status ? { status } : {}),
            ...(purpose ? { purpose } : {}),
            page,
            limit: PAGE_SIZE,
          },
        })
        .then((res) => res.data.payments),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const totals = Object.entries(revenue.data?.totalsByCurrency ?? {});
  const rows = payments.data ?? [];
  const inputClass = "bg-white/5 border-white/10 text-white [color-scheme:dark]";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Admin</h1>
        <p className="text-white/70">Revenue and payments across the platform</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-bold text-white font-fredoka">Revenue</h2>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label htmlFor="revenue-from" className="text-white/60 text-xs">
                From
              </Label>
              <Input
                id="revenue-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="revenue-to" className="text-white/60 text-xs">
                To
              </Label>
              <Input
                id="revenue-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
                className={inputClass}
              />
            </div>
            {(from || to) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                className="text-white/60 hover:text-white"
              >
                All time
              </Button>
            )}
          </div>
        </div>

        {revenue.isLoading && <Skeleton className="h-32 rounded-2xl" />}

        {revenue.error && (
          <PageError
            title="Couldn't load revenue"
            message="Please check your connection and try again."
            onRetry={() => revenue.refetch()}
            withLayout={false}
          />
        )}

        {revenue.data && (
          <div className={cn("space-y-4", revenue.isPlaceholderData && "opacity-60")}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {totals.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-card/50 p-5">
                  <p className="text-white/60 text-sm">Confirmed revenue</p>
                  <p className="text-3xl font-bold text-white font-fredoka mt-1">—</p>
                </div>
              )}
              {totals.map(([currency, total]) => (
                <div key={currency} className="rounded-2xl border border-white/10 bg-card/50 p-5">
                  <p className="text-white/60 text-sm">Confirmed revenue ({currency})</p>
                  <p className="text-3xl font-bold text-white font-fredoka mt-1">
                    {formatPrice(total, currency)}
                  </p>
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-card/50 p-5">
                <p className="text-white/60 text-sm">Pending payments</p>
                <p className="text-3xl font-bold text-white font-fredoka mt-1">
                  {revenue.data.pendingPayments}
                </p>
              </div>
            </div>

            {revenue.data.breakdown.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-card/50 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/60 text-left border-b border-white/10">
                      <th className="p-4 font-medium">Source</th>
                      <th className="p-4 font-medium text-right">Payments</th>
                      <th className="p-4 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {revenue.data.breakdown.map((row) => (
                      <tr key={`${row.purpose}-${row.currency}`} className="text-white">
                        <td className="p-4">{PURPOSE_LABEL[row.purpose] ?? row.purpose}</td>
                        <td className="p-4 text-right tabular-nums">{row.payments}</td>
                        <td className="p-4 text-right tabular-nums">
                          {formatPrice(row.total, row.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white font-fredoka">Payments</h2>
        <div className="flex gap-x-6 gap-y-3 flex-wrap">
          <FilterChips<PaymentStatus>
            label="Filter by status"
            value={status}
            onChange={(next) => {
              setStatus(next);
              setPage(1);
            }}
            options={[
              { id: "", label: "Any status" },
              { id: "success", label: "Success" },
              { id: "pending", label: "Pending" },
              { id: "failed", label: "Failed" },
            ]}
          />
          <FilterChips<PaymentPurpose>
            label="Filter by purpose"
            value={purpose}
            onChange={(next) => {
              setPurpose(next);
              setPage(1);
            }}
            options={[
              { id: "", label: "Any purpose" },
              { id: "pro", label: "Pro" },
              { id: "campaign", label: "Campaign" },
            ]}
          />
        </div>

        {payments.isLoading && <Skeleton className="h-48 rounded-2xl" />}

        {payments.error && (
          <PageError
            title="Couldn't load payments"
            message="Please check your connection and try again."
            onRetry={() => payments.refetch()}
            withLayout={false}
          />
        )}

        {payments.data && rows.length === 0 && (
          <p className="text-white/60 text-center py-10 rounded-2xl border border-dashed border-white/10">
            {page > 1 ? "No more payments." : "No payments match these filters."}
          </p>
        )}

        {rows.length > 0 && (
          <div
            className={cn(
              "rounded-2xl border border-white/10 bg-card/50 overflow-x-auto",
              payments.isPlaceholderData && "opacity-60"
            )}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/60 text-left border-b border-white/10">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Purpose</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rows.map((payment) => {
                  const when = payment.paidAt ?? payment.createdAt;
                  return (
                    <tr key={payment.id} className="text-white">
                      <td className="p-4 whitespace-nowrap">{when ? formatDateTime(when) : "—"}</td>
                      <td className="p-4">{PURPOSE_LABEL[payment.purpose] ?? payment.purpose}</td>
                      <td className={cn("p-4 capitalize font-medium", STATUS_CLASS[payment.status])}>
                        {payment.status}
                      </td>
                      <td className="p-4 text-right tabular-nums whitespace-nowrap">
                        {formatPrice(payment.amount, payment.currency)}
                      </td>
                      <td className="p-4 font-mono text-xs text-white/70">{payment.reference}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {payments.data && (page > 1 || rows.length === PAGE_SIZE) && (
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
            <span className="text-white/60 text-sm">Page {page}</span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={rows.length < PAGE_SIZE || payments.isPlaceholderData}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
