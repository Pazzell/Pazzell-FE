// Pure helpers for the weekly leaderboard page — kept free of React so the
// countdown/formatting math is easy to unit test in isolation.

// The backend's weekly leaderboard resets every Monday (raffle draws and
// payouts both run "automatically every Monday" per the API contract).
// There's no explicit week-end timestamp on the leaderboard response, so
// this computes the reset target client-side from the current time.
export function msUntilNextMonday(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0); // start of tomorrow, local time
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysUntilMonday = ((8 - currentDay) % 7) || 7;
  next.setDate(next.getDate() + daysUntilMonday - 1);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatAvgTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}
