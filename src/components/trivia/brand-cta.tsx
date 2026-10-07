"use client";

import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { cn } from "@/lib/utils";
import type { CampaignBrand } from "@/types";

interface BrandCtaProps {
  brand: CampaignBrand;
  variant?: "link" | "button";
  className?: string;
}

/** The sponsoring brand's outbound link on a campaign trivia. */
export function BrandCta({ brand, variant = "link", className }: BrandCtaProps) {
  if (!brand.websiteUrl) return null;

  // Fire and forget: the click is counted without holding up the new tab.
  const reportClick = () => {
    api.post(ENDPOINTS.CAMPAIGN_CLICK(brand.id)).catch(() => {});
  };

  return (
    <a
      href={brand.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={reportClick}
      onAuxClick={reportClick}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        variant === "button"
          ? "rounded-md bg-white text-black hover:bg-white/90 px-5 py-2.5"
          : "text-secondary hover:text-secondary/80 text-sm",
        className
      )}
    >
      {brand.ctaText ?? "Visit our site"}
      <ExternalLink className={variant === "button" ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </a>
  );
}
