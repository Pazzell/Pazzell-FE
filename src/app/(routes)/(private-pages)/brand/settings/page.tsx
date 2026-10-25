"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { toast } from "sonner";
import { Building2, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { isHttpUrl } from "@/components/campaigns/campaign-details-form";
import { userAtom } from "@/atom/user";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/upload";
import type { BrandProfileData } from "@/types";

export default function BrandSettingsPage() {
  const queryClient = useQueryClient();
  const setUser = useSetAtom(userAtom);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["brand-profile"],
    queryFn: () =>
      api
        .get<{ profile: BrandProfileData }>(ENDPOINTS.BRAND_PROFILE)
        .then((res) => res.data.profile),
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setCompanyName(profile.brandDetails?.companyName ?? profile.companyName ?? "");
    setWebsiteUrl(profile.brandDetails?.websiteUrl ?? "");
    setLogoFile(null);
    // The logo doubles as the account avatar, which is all an account without a brand
    // record has.
    setLogoPreview(profile.brandDetails?.logoUrl ?? profile.avatar ?? null);
  }, [profile]);

  // Release the local preview of a picked file when it is replaced or the page closes.
  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const save = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("companyName", companyName.trim());
      if (websiteUrl.trim()) formData.append("websiteUrl", websiteUrl.trim());
      // The brand logo travels in the `avatar` field.
      if (logoFile) formData.append("avatar", logoFile);
      return api
        .put<{ profile: { websiteUrl: string | null } }>(ENDPOINTS.UPDATE_BRAND_PROFILE, formData)
        .then((res) => res.data.profile);
    },
    onSuccess: (saved) => {
      // The website lives on the brand record; say so if the server had nowhere to put it.
      if (websiteUrl.trim() && !saved?.websiteUrl) {
        toast.warning("Saved, but your website could not be stored. Add it on each campaign for now.");
      } else {
        toast.success("Brand profile saved.");
      }
      setUser((current) =>
        current ? { ...current, fullName: name.trim(), companyName: companyName.trim() } : current
      );
      queryClient.invalidateQueries({ queryKey: ["brand-profile"] });
    },
    onError: (err) => {
      toast.error(getApiError(err)?.message || "Couldn't save your profile. Please try again.");
    },
  });

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setLogoFile(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !companyName.trim()) {
      toast.error("Your name and brand name are both needed.");
      return;
    }
    if (websiteUrl.trim() && !isHttpUrl(websiteUrl.trim())) {
      toast.error("The website must be a full link starting with http:// or https://.");
      return;
    }
    save.mutate();
  };

  const inputClass = "bg-white/5 border-white/10 text-white";

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Settings</h1>
        <p className="text-white/70">
          Your brand profile. New campaigns start with this name, logo and website.
        </p>
      </div>

      {isLoading && <PageLoader message="Loading profile..." withLayout={false} />}

      {error && (
        <PageError
          title="Couldn't load your profile"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
          withLayout={false}
        />
      )}

      {profile && (
        <form method="post"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-card/50 p-6 space-y-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Brand logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-white/40" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {logoPreview ? "Replace logo" : "Add logo"}
              </Button>
              <p className="text-white/40 text-xs">JPG, PNG or WEBP, up to 5 MB.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-company" className="text-white/80">
              Brand name
            </Label>
            <Input
              id="brand-company"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-name" className="text-white/80">
              Your name
            </Label>
            <Input
              id="brand-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-website" className="text-white/80">
              Website
            </Label>
            <Input
              id="brand-website"
              type="url"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="https://your-site.example"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-email" className="text-white/80">
              Email
            </Label>
            <Input id="brand-email" value={profile.email} disabled className={inputClass} />
          </div>

          <Button
            type="submit"
            disabled={save.isPending}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
          >
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Profile
          </Button>
        </form>
      )}
    </div>
  );
}
