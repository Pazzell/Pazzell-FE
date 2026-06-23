import { BASE_URL } from "./constants";

// append endpoint url to base url
export const endpointUrl = (endpoint: string) => {
  return `${BASE_URL}${endpoint}`;
};

export const formatPuzzleType = (type: string) => {
  return type
    ?.split("_")
    ?.map((word) => word.charAt(0)?.toUpperCase() + word.slice(1))
    .join(" ");
};

export const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const DAILY_PLAYED_KEY = "pazzell_played_today";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// Call this inside onSuccess after a solved submit so the pre-play warning
// shows correctly on the next visit within the same calendar day.
export function markPlayedToday(campaignId: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored: Record<string, string> = JSON.parse(
      localStorage.getItem(DAILY_PLAYED_KEY) || "{}"
    );
    stored[campaignId] = todayStr();
    localStorage.setItem(DAILY_PLAYED_KEY, JSON.stringify(stored));
  } catch {}
}

// Returns true only if the player already completed this campaign today.
// Uses localStorage written by markPlayedToday so the check resets at midnight.
export function hasPlayedToday(campaignId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored: Record<string, string> = JSON.parse(
      localStorage.getItem(DAILY_PLAYED_KEY) || "{}"
    );
    return stored[campaignId] === todayStr();
  } catch {
    return false;
  }
}
