"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import type { BrandCampaign } from "@/types";

const TITLE_MAX = 80;
const BRAND_NAME_MAX = 80;
const DESCRIPTION_MAX = 300;
const CTA_TEXT_MAX = 40;
const MAX_TAGS = 8;
const TAG_MAX = 24;

export interface CampaignDetailsPayload {
  title: string;
  brandName: string;
  websiteUrl: string;
  ctaText: string;
  description: string;
  tags: string[];
  logoUrl?: string;
  coverImageUrl?: string;
}

/** What a new campaign starts from: the brand's own profile. */
export interface CampaignDefaults {
  brandName?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

interface CampaignDetailsFormProps {
  campaign?: BrandCampaign;
  defaults?: CampaignDefaults;
  submitLabel: string;
  pending: boolean;
  onSubmit: (payload: CampaignDetailsPayload) => void;
}

export function CampaignDetailsForm({
  campaign,
  defaults,
  submitLabel,
  pending,
  onSubmit,
}: CampaignDetailsFormProps) {
  // The images already stored for this campaign (or on the brand profile). They are
  // only sent when replaced: the API accepts a URL solely from a fresh upload.
  const savedLogo = campaign?.logoUrl ?? defaults?.logoUrl ?? null;
  const savedCover = campaign?.coverImageUrl ?? null;

  const [title, setTitle] = useState(campaign?.title ?? "");
  const [brandName, setBrandName] = useState(campaign?.brandName ?? defaults?.brandName ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(campaign?.websiteUrl ?? defaults?.websiteUrl ?? "");
  const [ctaText, setCtaText] = useState(campaign?.ctaText ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [tags, setTags] = useState(campaign?.tags.join(", ") ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(savedLogo);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(savedCover);

  // The brand profile can arrive after the form has mounted; fill what is still empty.
  useEffect(() => {
    if (campaign || !defaults) return;
    setBrandName((current) => current || defaults.brandName || "");
    setWebsiteUrl((current) => current || defaults.websiteUrl || "");
    setLogoUrl((current) => current ?? defaults.logoUrl ?? null);
  }, [campaign, defaults]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const tagList = [...new Set(tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))];

    if (!title.trim()) return toast.error("Give your campaign a title.");
    if (!brandName.trim()) return toast.error("Add your brand name.");
    if (!isHttpUrl(websiteUrl.trim())) {
      return toast.error("Add your website as a full link starting with http:// or https://.");
    }
    if (!logoUrl) return toast.error("Add your brand logo.");
    if (tagList.length > MAX_TAGS) return toast.error(`Use at most ${MAX_TAGS} tags.`);
    if (tagList.some((tag) => tag.length > TAG_MAX)) {
      return toast.error(`Each tag can be at most ${TAG_MAX} characters.`);
    }

    onSubmit({
      title: title.trim(),
      brandName: brandName.trim(),
      websiteUrl: websiteUrl.trim(),
      // Empty text clears these two on the server.
      ctaText: ctaText.trim(),
      description: description.trim(),
      tags: tagList,
      ...(logoUrl !== savedLogo ? { logoUrl } : {}),
      ...(coverImageUrl && coverImageUrl !== savedCover ? { coverImageUrl } : {}),
    });
  };

  const inputClass = "bg-white/5 border-white/10 text-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="campaign-title" className="text-white/80">
          Campaign title
        </Label>
        <Input
          id="campaign-title"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Spring launch"
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-description" className="text-white/80">
          Description (optional)
        </Label>
        <Textarea
          id="campaign-description"
          value={description}
          maxLength={DESCRIPTION_MAX}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="campaign-brand" className="text-white/80">
            Brand name
          </Label>
          <Input
            id="campaign-brand"
            value={brandName}
            maxLength={BRAND_NAME_MAX}
            onChange={(event) => setBrandName(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-website" className="text-white/80">
            Website link
          </Label>
          <Input
            id="campaign-website"
            type="url"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://your-site.example"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-cta" className="text-white/80">
            Link button text (optional)
          </Label>
          <Input
            id="campaign-cta"
            value={ctaText}
            maxLength={CTA_TEXT_MAX}
            onChange={(event) => setCtaText(event.target.value)}
            placeholder="Visit our site"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaign-tags" className="text-white/80">
            Tags (optional, comma separated, up to {MAX_TAGS})
          </Label>
          <Input
            id="campaign-tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="food, drinks"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-white/80">Logo</Label>
          <ImageUpload
            value={logoUrl}
            onChange={(url) => setLogoUrl(url ?? savedLogo)}
            kind="logos"
            label="Add logo"
            allowRemove={logoUrl !== savedLogo}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Cover image (optional)</Label>
          <ImageUpload
            value={coverImageUrl}
            onChange={(url) => setCoverImageUrl(url ?? savedCover)}
            kind="covers"
            label="Add cover"
            allowRemove={coverImageUrl !== savedCover}
          />
        </div>
      </div>
      <p className="text-white/50 text-xs">
        Players see your brand name and logo on the study cards and the result screen, with the
        link button under their score.
      </p>

      <Button
        type="submit"
        disabled={pending}
        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
      >
        {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
