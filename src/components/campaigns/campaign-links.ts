import { routes } from "@/app/_utils/routes";
import type { BrandCampaign } from "@/types";

/** Drafts (and unpaid checkouts) open in the builder; everything else has numbers to show. */
export function campaignHref(campaign: Pick<BrandCampaign, "id" | "status">) {
  return campaign.status === "draft" || campaign.status === "awaiting_payment"
    ? routes.BRAND.CAMPAIGN_EDIT(campaign.id)
    : routes.BRAND.CAMPAIGN_DASHBOARD(campaign.id);
}
