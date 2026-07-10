// Pure helpers for raffle eligibility, kept free of React so the
// requirement/progress math is easy to unit test in isolation.

// Per API_CONTRACT_WEEKLY_MIGRATION.md §6: N = min(3, number of active v2
// campaigns that week). floorCap (default 3) comes from
// raffle.eligibilityFloorCap in admin config.
export function computeRaffleRequirement(
  activeCampaignCount: number,
  floorCap: number = 3
): number {
  return Math.max(0, Math.min(floorCap, activeCampaignCount));
}

export function formatEligibilityProgressText(
  completedCount: number,
  required: number
): string {
  if (required === 0) {
    return "No active campaigns this week yet.";
  }
  if (completedCount >= required) {
    return `${required} of ${required} campaigns completed — your raffle tickets are activated!`;
  }
  const remaining = required - completedCount;
  return `${completedCount} of ${required} campaigns completed — complete ${remaining} more to activate your raffle tickets.`;
}
