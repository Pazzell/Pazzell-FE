"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import { formatPrice } from "@/lib/utils";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Why the player hit the limit; defaults to the server's `UPGRADE_REQUIRED` message. */
  message?: string;
}

/** Shown when the server answers `UPGRADE_REQUIRED` (a freemium limit was reached). */
export function UpgradePrompt({ open, onOpenChange, message }: UpgradePromptProps) {
  const { settings } = useGameSettings();
  const { amount, currency, durationDays } = settings.pro;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white font-fredoka text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {message || "You've reached the limit of the free plan."}
          </DialogDescription>
        </DialogHeader>
        <p className="text-white/80 text-sm">
          Pro gives you unlimited custom trivias and no sponsored interruptions for{" "}
          {formatPrice(amount, currency)} per {durationDays} days.
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Not now
          </Button>
          <Button
            asChild
            className="bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-fredoka"
          >
            <Link href={routes.USER.PRO}>See Pro</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
