"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default function BrandCampaignsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Campaigns</h1>
        <p className="text-white/70">Sponsored trivia for freemium players</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="p-3 bg-secondary/20 rounded-lg w-fit mb-2">
            <Megaphone className="h-6 w-6 text-secondary" />
          </div>
          <CardTitle className="text-white font-fredoka text-xl">
            Campaign builder is being rebuilt
          </CardTitle>
          <CardDescription className="text-white/70">
            The old puzzle-campaign wizard has been removed. The new sponsored-trivia campaign
            wizard (brand details, cards, flat $10/30-day pricing, Paystack checkout) lands in a
            later phase of the brain-training rebuild.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
