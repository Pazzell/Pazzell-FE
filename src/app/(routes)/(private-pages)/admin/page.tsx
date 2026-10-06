"use client";

import { LayoutDashboard } from "lucide-react";
import { ComingSoonCard } from "@/components/ui/coming-soon";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Admin</h1>
        <p className="text-white/70">Platform overview and moderation</p>
      </div>
      <ComingSoonCard
        icon={LayoutDashboard}
        title="Admin dashboard is being rebuilt"
        description="Revenue, payment, and platform-wide stats land in a later phase of the brain-training rebuild. Use the sidebar to manage trivia topics, Match levels, campaigns and global settings."
      />
    </div>
  );
}
