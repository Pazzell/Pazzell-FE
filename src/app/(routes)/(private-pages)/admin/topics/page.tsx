"use client";

import { BookOpen } from "lucide-react";
import { ComingSoonCard } from "@/components/ui/coming-soon";

export default function AdminTopicsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Trivia Topics</h1>
        <p className="text-white/70">Create and manage topics and their cards</p>
      </div>
      <ComingSoonCard
        icon={BookOpen}
        title="Topic & card CRUD is coming"
        description="Full topic management (name, cover image, cards with image/definition, bulk entry and preview) lands in the admin phase of the brain-training rebuild."
      />
    </div>
  );
}
