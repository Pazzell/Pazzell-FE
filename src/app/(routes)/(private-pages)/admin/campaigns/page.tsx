"use client";

import { Megaphone } from "lucide-react";
import { ComingSoonCard } from "@/components/ui/coming-soon";

export default function AdminCampaignsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Campaigns</h1>
        <p className="text-white/70">Moderate sponsored trivia campaigns</p>
      </div>
      <ComingSoonCard
        icon={Megaphone}
        title="Campaign moderation is coming"
        description="Listing, pausing, resuming and taking down campaigns (with a reason) lands in the admin phase of the brain-training rebuild."
      />
    </div>
  );
}
