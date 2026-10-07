import { CircleDot, EyeOff, Lock, PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomQuizStatus } from "@/types";

const STATUS = {
  draft: { label: "Draft", icon: PencilLine, className: "border-white/20 text-white/70" },
  live: { label: "Live", icon: CircleDot, className: "border-green-400/50 text-green-300 bg-green-500/10" },
  unpublished: { label: "Unpublished", icon: EyeOff, className: "border-yellow-400/50 text-yellow-200 bg-yellow-500/10" },
  locked: { label: "Locked", icon: Lock, className: "border-red-400/50 text-red-300 bg-red-500/10" },
} satisfies Record<CustomQuizStatus, unknown>;

export function QuizStatusBadge({ status }: { status: CustomQuizStatus }) {
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
