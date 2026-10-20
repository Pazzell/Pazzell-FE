import { TRIVIA_TIMER_STORAGE_KEY } from "@/hooks/use-start-trivia-session";

/** How a time-per-question choice reads; 0 means there is no countdown. */
export function timerLabel(seconds: number): string {
  return seconds === 0 ? "No timer" : `${seconds} sec`;
}

/** The player's last timer choice, or null when there is none (0 is a real choice). */
export function storedTimerSeconds(): number | null {
  const stored = localStorage.getItem(TRIVIA_TIMER_STORAGE_KEY);
  if (stored === null || stored === "") return null;
  const seconds = Number(stored);
  return Number.isFinite(seconds) ? seconds : null;
}
