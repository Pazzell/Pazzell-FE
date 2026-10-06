"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";

export default function BrandDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Dashboard</h1>
        <p className="text-white/70">Track your sponsored trivia campaigns</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="p-3 bg-secondary/20 rounded-lg w-fit mb-2">
            <Megaphone className="h-6 w-6 text-secondary" />
          </div>
          <CardTitle className="text-white font-fredoka text-xl">
            Campaign dashboard is being rebuilt
          </CardTitle>
          <CardDescription className="text-white/70">
            Sponsored trivia campaigns (status, days remaining, plays, completions, average
            score, and link clicks) are coming in the next phase of the brain-training rebuild.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={routes.BRAND.CAMPAIGNS}>
            <Button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              View Campaigns
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
