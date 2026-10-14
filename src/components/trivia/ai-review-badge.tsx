import { CircleCheck, CircleSlash, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiReviewStatus } from "@/types";

const STATUS = {
  pending: {
    player: "Under review",
    admin: "Pending",
    icon: Hourglass,
    className: "border-yellow-400/50 text-yellow-200 bg-yellow-500/10",
  },
  approved: {
    player: "In General Trivia",
    admin: "Approved",
    icon: CircleCheck,
    className: "border-green-400/50 text-green-300 bg-green-500/10",
  },
  rejected: {
    player: "Yours only",
    admin: "Rejected",
    icon: CircleSlash,
    className: "border-white/20 text-white/70",
  },
} satisfies Record<AiReviewStatus, unknown>;

/** Whether an AI generated trivia's cards have been added to General Trivia. */
export function AiReviewBadge({
  status,
  audience = "player",
}: {
  status: AiReviewStatus;
  audience?: "player" | "admin";
}) {
  const { icon: Icon, className, ...labels } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {labels[audience]}
    </span>
  );
}
