"use client";

import { Radio, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomQuizMode } from "@/types";

const MODES: { value: CustomQuizMode; title: string; description: string; icon: typeof Radio }[] = [
  {
    value: "broadcast",
    title: "Broadcast quiz",
    description: "Share a link. Everyone plays on their own and gets their own score.",
    icon: Radio,
  },
  {
    value: "team",
    title: "Team quiz",
    description:
      "Host a live game. Players join teams, talk it over in a team chat, and battle on a tic-tac-toe board.",
    icon: Users,
  },
];

export const quizModeLabel = (mode: CustomQuizMode) => (mode === "team" ? "Team" : "Broadcast");

interface QuizModePickerProps {
  value: CustomQuizMode;
  onChange: (mode: CustomQuizMode) => void;
  disabled?: boolean;
}

/** How the quiz is played: alone through a share link, or by teams in a hosted game. */
export function QuizModePicker({ value, onChange, disabled = false }: QuizModePickerProps) {
  return (
    <div role="radiogroup" aria-label="Quiz type" className="grid gap-3 sm:grid-cols-2">
      {MODES.map(({ value: mode, title, description, icon: Icon }) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={cn(
              "flex flex-col items-start justify-start rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-secondary bg-secondary/10"
                : "border-white/10 bg-white/5 hover:border-white/30"
            )}
          >
            <span className="flex items-center gap-2 font-fredoka text-white">
              <Icon className={cn("h-5 w-5", selected ? "text-secondary" : "text-white/60")} />
              {title}
            </span>
            <span className="mt-1 block text-sm text-white/60">{description}</span>
          </button>
        );
      })}
    </div>
  );
}
