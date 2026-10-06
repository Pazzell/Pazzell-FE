"use client";

import { Settings } from "lucide-react";
import { ComingSoonCard } from "@/components/ui/coming-soon";

export default function BrandSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Settings</h1>
        <p className="text-white/70">Brand profile and account settings</p>
      </div>
      <ComingSoonCard
        icon={Settings}
        title="Brand profile editor is coming"
        description="Editing your brand name, logo and website URL lands alongside the campaign builder in a later phase of the brain-training rebuild."
      />
    </div>
  );
}
