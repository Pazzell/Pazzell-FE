import Link from "next/link";
import { Brain, Sparkles } from "lucide-react";
import { routes } from "@/app/_utils/routes";
import { cn } from "@/lib/utils";

const KINDS = [
  { key: "general", label: "General Trivia", href: routes.USER.TRIVIA, icon: Brain },
  { key: "ai", label: "AI Generated Trivia", href: routes.USER.AI_TRIVIA, icon: Sparkles },
] as const;

export type TriviaKind = (typeof KINDS)[number]["key"];

/** Switches between the two kinds of trivia a player can play. */
export function TriviaKindTabs({ active }: { active: TriviaKind }) {
  return (
    <nav aria-label="Kind of trivia" className="flex gap-2 flex-wrap">
      {KINDS.map(({ key, label, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={key === active ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            key === active
              ? "border-secondary bg-secondary text-secondary-foreground"
              : "border-white/15 text-white/70 hover:text-white hover:border-white/40"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
