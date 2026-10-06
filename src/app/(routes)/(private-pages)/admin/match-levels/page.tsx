"use client";

import { Puzzle } from "lucide-react";
import { ComingSoonCard } from "@/components/ui/coming-soon";

export default function AdminMatchLevelsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Match Levels</h1>
        <p className="text-white/70">Configure difficulty and progression for the Match game</p>
      </div>
      <ComingSoonCard
        icon={Puzzle}
        title="Level config editor is coming"
        description="Editing question count, option count, categories, similarity and variants per level lands in the admin phase of the brain-training rebuild."
      />
    </div>
  );
}
