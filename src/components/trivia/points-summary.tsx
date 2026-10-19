import { cn } from "@/lib/utils";
import type { PlayerPoints } from "@/types";

interface PointsSummaryProps {
  points: PlayerPoints;
  className?: string;
}

/** This month's, lifetime and today's points, side by side. */
export function PointsSummary({ points, className }: PointsSummaryProps) {
  const stats = [
    { label: "This month", value: String(points.monthly) },
    { label: "Lifetime", value: String(points.lifetime) },
    { label: "Today", value: `${points.today}/${points.dailyCap}` },
  ];
  return (
    <dl className={cn("grid grid-cols-3 gap-2 text-center", className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-white/5 px-2 py-3">
          <dt className="text-white/50 text-xs">{stat.label}</dt>
          <dd className="text-white font-fredoka text-xl">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
