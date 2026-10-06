"use client";

import { Settings } from "lucide-react";
import { ComingSoonCard } from "@/components/ui/coming-soon";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Global Settings</h1>
        <p className="text-white/70">Timer range, pricing and the campaign interruption threshold</p>
      </div>
      <ComingSoonCard
        icon={Settings}
        title="Settings editor is coming"
        description="Editing the campaign interruption threshold, Pro price/duration, and campaign price/duration (GET/PUT /admin/config) lands in the admin phase of the brain-training rebuild."
      />
    </div>
  );
}
