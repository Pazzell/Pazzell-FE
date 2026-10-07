"use client";

import { Check, X } from "lucide-react";
import type { MatchArtifact } from "@/types";
import { cn } from "@/lib/utils";

interface ArtifactTileProps {
  artifact: MatchArtifact;
  size?: "lg" | "md";
  onClick?: () => void;
  disabled?: boolean;
  feedback?: "correct" | "wrong" | null;
  reducedMotion?: boolean;
}

export function ArtifactTile({
  artifact,
  size = "md",
  onClick,
  disabled,
  feedback,
  reducedMotion,
}: ArtifactTileProps) {
  const sizeClasses = size === "lg" ? "w-32 h-32 sm:w-40 sm:h-40" : "w-24 h-24 sm:w-28 sm:h-28";

  const feedbackClasses =
    feedback === "correct"
      ? "ring-4 ring-green-400 bg-green-500/10"
      : feedback === "wrong"
      ? `ring-4 ring-red-400 bg-red-500/10 ${!reducedMotion ? "animate-shake" : ""}`
      : "ring-2 ring-white/10 bg-white/5 hover:ring-white/30";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      aria-label={artifact.name}
      className={cn(
        "relative rounded-2xl flex items-center justify-center transition-all p-3",
        sizeClasses,
        feedbackClasses,
        onClick && !disabled ? "cursor-pointer active:scale-95" : "cursor-default"
      )}
    >
      {artifact.svg ? (
        <span
          className="w-full h-full [&_svg]:w-full [&_svg]:h-full"
          dangerouslySetInnerHTML={{ __html: artifact.svg }}
        />
      ) : (
        <span className="text-white text-sm">{artifact.name}</span>
      )}

      {feedback === "correct" && (
        <span className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
          <Check className="h-4 w-4 text-white" />
        </span>
      )}
      {feedback === "wrong" && (
        <span className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1">
          <X className="h-4 w-4 text-white" />
        </span>
      )}
    </button>
  );
}
