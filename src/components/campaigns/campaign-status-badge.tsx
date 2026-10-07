import { Ban, CircleDot, Clock3, CreditCard, Pause, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/types";

const STATUS = {
  draft: { label: "Draft", icon: PencilLine, className: "border-white/20 text-white/70" },
  awaiting_payment: { label: "Awaiting payment", icon: CreditCard, className: "border-yellow-400/50 text-yellow-200 bg-yellow-500/10" },
  live: { label: "Live", icon: CircleDot, className: "border-green-400/50 text-green-300 bg-green-500/10" },
  ended: { label: "Ended", icon: Clock3, className: "border-white/20 text-white/60 bg-white/5" },
  paused: { label: "Paused", icon: Pause, className: "border-orange-400/50 text-orange-200 bg-orange-500/10" },
  taken_down: { label: "Taken down", icon: Ban, className: "border-red-400/50 text-red-300 bg-red-500/10" },
} satisfies Record<CampaignStatus, unknown>;

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
