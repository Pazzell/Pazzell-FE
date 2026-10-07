"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  CampaignDetailsForm,
  type CampaignDetailsPayload,
} from "@/components/campaigns/campaign-details-form";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { BrandCampaignResponse, BrandProfileData } from "@/types";

export default function NewCampaignPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // A campaign starts from the brand profile's name, website and logo.
  const { data: profile } = useQuery({
    queryKey: ["brand-profile"],
    queryFn: () =>
      api
        .get<{ profile: BrandProfileData }>(ENDPOINTS.BRAND_PROFILE)
        .then((res) => res.data.profile),
  });

  const create = useMutation({
    mutationFn: (payload: CampaignDetailsPayload) =>
      api.post<BrandCampaignResponse>(ENDPOINTS.BRAND_CAMPAIGNS, payload).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
      toast.success("Draft created. Now add your cards.");
      router.replace(`${routes.BRAND.CAMPAIGN_EDIT(data.campaign.id)}?step=cards`);
    },
    onError: (error) => {
      toast.error(getApiError(error)?.message || "Couldn't create the campaign. Please try again.");
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={routes.BRAND.CAMPAIGNS}
        className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Campaigns
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">New Campaign</h1>
        <p className="text-white/70">
          Start with the details. You&apos;ll add cards and pay on the next steps.
        </p>
      </div>
      <div className="bg-card/50 border border-white/10 rounded-2xl p-6">
        <CampaignDetailsForm
          defaults={{
            brandName: profile?.brandDetails?.companyName ?? profile?.companyName,
            websiteUrl: profile?.brandDetails?.websiteUrl,
            logoUrl: profile?.brandDetails?.logoUrl,
          }}
          submitLabel="Save and Add Cards"
          pending={create.isPending || create.isSuccess}
          onSubmit={(payload) => create.mutate(payload)}
        />
      </div>
    </div>
  );
}
