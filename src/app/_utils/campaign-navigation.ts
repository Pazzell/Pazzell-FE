import { CampaignData } from "@/types";

/**
 * Get the next available campaign from the list
 * @param availableCampaigns - Array of all available campaigns
 * @param currentCampaignId - Current campaign ID
 * @returns Next campaign object or null if no campaigns available
 */
export function getNextCampaign(
  availableCampaigns: CampaignData[] | undefined,
  currentCampaignId: string | null
): CampaignData | null {
  if (
    !availableCampaigns ||
    !currentCampaignId ||
    availableCampaigns.length === 0
  ) {
    return availableCampaigns?.[0] || null;
  }

  const currentIndex = availableCampaigns.findIndex(
    (campaign) => campaign._id === currentCampaignId
  );

  if (currentIndex === -1) {
    // If current campaign not found in list, return first available
    return availableCampaigns[0];
  }

  // Get next campaign, if we're at the end, wrap to first
  const nextIndex = (currentIndex + 1) % availableCampaigns.length;
  return availableCampaigns[nextIndex];
}

/**
 * Generate the URL for playing a specific game type with a campaign
 * @param gameType - Type of game (card_matching, spot_the_difference, sliding_puzzle)
 * @param campaignId - Campaign ID to play
 * @returns Full URL path for the game
 */
export function getGameUrl(gameType: string, campaignId: string): string {
  const gameRoutes: Record<string, string> = {
    card_matching: "/user/puzzle/card-matching",
    spot_the_difference: "/user/puzzle/spot-the-difference",
    sliding_puzzle: "/user/puzzle/sliding-puzzle",
    word_hunt: "/user/puzzle/word-hunt",
  };

  const basePath = gameRoutes[gameType] || "/user/puzzle/card-matching";
  return `${basePath}?campaign=${campaignId}`;
}

/**
 * Get the next campaign URL for the same game type
 * @param availableCampaigns - Array of all available campaigns
 * @param currentCampaignId - Current campaign ID
 * @param gameType - Current game type
 * @returns URL for next campaign or null if no next campaign
 */
export function getNextCampaignUrl(
  availableCampaigns: CampaignData[] | undefined,
  currentCampaignId: string | null,
  gameType: string
): string | null {
  const nextCampaign = getNextCampaign(availableCampaigns, currentCampaignId);

  if (!nextCampaign) return null;

  return getGameUrl(nextCampaign.gameType, nextCampaign._id);
}
