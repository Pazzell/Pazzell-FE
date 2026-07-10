"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  // epoch ms when the session (or fun-run) started
  startedAt: number;
  className?: string;
  label?: string;
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Single upward-counting timer meant to be mounted once for an entire
// gameplay session (all 4 games + video + quiz retries) so it keeps
// running across stage transitions instead of resetting per-stage.
// Display-only — the server's totalCompletionTimeMs on session complete
// is the authoritative recorded time, this is never submitted anywhere.
export function SessionTimer({ startedAt, className, label }: SessionTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.max(0, now - startedAt);

  return (
    <div
      role="timer"
      aria-live="off"
      className={`flex items-center gap-2 font-mono text-white ${className ?? ""}`}>
      <Clock className="h-4 w-4 text-secondary" />
      {label && <span className="text-white/60 text-xs uppercase tracking-wider">{label}</span>}
      <span data-testid="session-timer-value">{formatElapsed(elapsed)}</span>
    </div>
  );
}
