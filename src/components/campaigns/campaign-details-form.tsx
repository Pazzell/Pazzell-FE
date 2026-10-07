"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import type { BrandCampaign } from "@/types";

const CTA_TEXT_MAX = 40;
const MAX_TAGS = 8;

export interface CampaignDetailsPayload {
  title: string;
  brandName?: string | null;
  websiteUrl?: string | null;
  ctaText?: string | null;
  description?: string | null;
  tags?: string[];
  logoUrl?: string | null;
  coverImageUrl?: string | null;
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
  submitLabel: string;
  pending: boolean;
  onSubmit: (payload: CampaignDetailsPayload) => void;
}

export function CampaignDetailsForm({
  campaign,
  submitLabel,
  pending,
  onSubmit,
}: CampaignDetailsFormProps) {
  const [title, setTitle] = useState(campaign?.title ?? "");
  const [brandName, setBrandName] = useState(campaign?.brandName ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(campaign?.websiteUrl ?? "");
  const [ctaText, setCtaText] = useState(campaign?.ctaText ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [tags, setTags] = useState(campaign?.tags.join(", ") ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(campaign?.logoUrl ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    campaign?.coverImageUrl ?? null
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const tagList = [...new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))];

    if (!title.trim()) return toast.error("Give your campaign a title.");
    if (websiteUrl.trim() && !isHttpUrl(websiteUrl.trim())) {
      return toast.error("The website must be a full link starting with http:// or https://.");
    }
    if (tagList.length > MAX_TAGS) return toast.error(`Use at most ${MAX_TAGS} tags.`);

    // An empty optional field is left out so the server keeps its default (the brand
    // profile on create); it is sent as null only to clear a value the campaign has.
    const optional = <T,>(value: T | "", previous: unknown) =>
      value !== "" && value !== null ? value : previous ? null : undefined;

    const payload: CampaignDetailsPayload = {
      title: title.trim(),
      brandName: optional(brandName.trim(), campaign?.brandName),
      websiteUrl: optional(websiteUrl.trim(), campaign?.websiteUrl),
      ctaText: optional(ctaText.trim(), campaign?.ctaText),
      description: optional(description.trim(), campaign?.description),
      logoUrl: optional(logoUrl, campaign?.logoUrl),
      coverImageUrl: optional(coverImageUrl, campaign?.coverImageUrl),
      ...(tagList.length > 0 || campaign?.tags.length ? { tags: tagList } : {}),
    };
    onSubmit(payload);
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
          maxLength={120}
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
          maxLength={500}
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
            maxLength={80}
            onChange={(event) => setBrandName(event.target.value)}
            placeholder="Defaults to your brand profile"
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
            Link button text
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
            Tags (comma separated, up to {MAX_TAGS})
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
          <ImageUpload value={logoUrl} onChange={setLogoUrl} kind="logos" label="Add logo" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Cover image (optional)</Label>
          <ImageUpload
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            kind="covers"
            label="Add cover"
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
