// Pure helpers for the raffle results page.

export function getRankRewardPercent(
  rank: number,
  rankDistribution: number[]
): number | null {
  const idx = rank - 1;
  if (idx < 0 || idx >= rankDistribution.length) return null;
  return rankDistribution[idx];
}
