"use client";

import { useEffect, useState } from "react";
import { AlarmClock } from "lucide-react";
import { cn } from "@/lib/utils";

// The last seconds before a team forfeits are shown as a warning.
const WARNING_SECONDS = 10;

interface PickCountdownProps {
  /** When the team in turn must have chosen a question by (server time). */
  deadlineAt: string;
  serverTime: string;
  teamName: string;
  /** The waiting team (or the best placed of the others) that would win on a forfeit. */
  waitingTeamName: string | null;
  /** Whether the viewer is on the team that has to choose. */
  isMyTeam: boolean;
}

/**
 * Topic games: the team in turn has 30 seconds to choose a question, or it forfeits the game.
 * Driven by the server's deadline with the device clock's offset taken out, like the
 * question timer. The server ends the game itself when the time runs out.
 */
export function PickCountdown({ deadlineAt, serverTime, teamName, waitingTeamName, isMyTeam }: PickCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const clockOffsetMs = Date.now() - new Date(serverTime).getTime();
    const deadlineMs = new Date(deadlineAt).getTime() + clockOffsetMs;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [deadlineAt, serverTime]);

  if (secondsLeft === null) return null;
  const warning = secondsLeft <= WARNING_SECONDS;
  const forfeitsTo = waitingTeamName ? `${waitingTeamName} wins` : "the game is abandoned";

  return (
    <div
      role="timer"
      aria-live={warning ? "assertive" : "off"}
      className={cn(
        "mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm",
        warning
          ? "border-red-400/60 bg-red-500/10 text-red-200 motion-safe:animate-pulse"
          : "border-white/10 bg-white/5 text-white/70"
      )}
    >
      <AlarmClock className={cn("h-4 w-4 shrink-0", warning ? "text-red-300" : "text-white/50")} />
      <span>
        {isMyTeam ? "Choose your question" : `${teamName} is choosing`}
        {" · "}
        <span className="font-fredoka font-bold tabular-nums">{secondsLeft}s</span>
        {warning &&
          (isMyTeam
            ? ` left, or the game is abandoned and ${forfeitsTo}`
            : ` left before ${teamName} forfeits`)}
      </span>
    </div>
  );
}
