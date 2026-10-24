"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { teamMark } from "@/components/team-game/team-helpers";
import type { TeamGameBoard, TeamGameTeam } from "@/types";

interface TeamBoardProps {
  board: TeamGameBoard;
  teams: TeamGameTeam[];
  /** Open cells can be clicked (the leader of the team in turn). */
  canPick?: boolean;
  onPick?: (cellIndex: number) => void;
  /** The cell whose question is open right now. */
  activeCell?: number | null;
  winningLine?: number[] | null;
  pending?: boolean;
  compact?: boolean;
}

/**
 * The tic-tac-toe board, tilted back in 3D. Each cell is a raised tile showing its
 * number; a claimed tile flips over to the team's colour and mark.
 */
export function TeamBoard({
  board,
  teams,
  canPick = false,
  onPick,
  activeCell = null,
  winningLine = null,
  pending = false,
  compact = false,
}: TeamBoardProps) {
  const reducedMotion = useReducedMotion();
  const colorOf = (teamId: string) => teams.find((t) => t.id === teamId)?.color ?? "#64748b";
  const nameOf = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? "A team";
  const winning = new Set(winningLine ?? []);

  return (
    <div
      className={cn("mx-auto w-full [perspective:1100px]", compact ? "max-w-[15rem]" : "max-w-md")}
    >
      <div
        className={cn(
          "grid rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] [transform-style:preserve-3d]",
          compact ? "gap-1.5 p-2" : "gap-2 p-3 sm:gap-3 sm:p-4",
          !reducedMotion && "transition-transform duration-700"
        )}
        style={{
          gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))`,
          transform: reducedMotion ? undefined : "rotateX(18deg)",
        }}
        role="grid"
        aria-label={`${board.size} by ${board.size} board, ${board.lineLength} in a row wins`}
      >
        {board.cells.map((cell) => {
          const owner = cell.owner;
          const open = !owner;
          const clickable = canPick && open && !pending && activeCell === null;
          const isActive = activeCell === cell.index;
          const isWinning = winning.has(cell.index);
          const tileStyle: CSSProperties = {
            transform: owner ? "rotateY(180deg)" : undefined,
          };
          return (
            <button
              key={cell.index}
              type="button"
              role="gridcell"
              disabled={!clickable}
              onClick={() => clickable && onPick?.(cell.index)}
              aria-label={
                owner ? `Cell ${cell.number}, claimed by ${nameOf(owner)}` : `Cell ${cell.number}, open`
              }
              className={cn(
                "group relative aspect-square [transform-style:preserve-3d]",
                !reducedMotion && "transition-transform duration-700",
                clickable ? "cursor-pointer" : "cursor-default"
              )}
              style={tileStyle}
            >
              {/* Front: the number */}
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-xl border font-fredoka font-bold text-white [backface-visibility:hidden]",
                  compact ? "text-sm" : "text-2xl sm:text-3xl",
                  "bg-gradient-to-b from-slate-600 to-slate-700 border-white/15",
                  "shadow-[0_6px_0_0_#1e293b,0_10px_18px_-6px_rgba(0,0,0,0.7)]",
                  clickable &&
                    !reducedMotion &&
                    "transition-all duration-150 group-hover:-translate-y-1 group-hover:from-secondary/80 group-hover:to-secondary group-hover:text-secondary-foreground group-active:translate-y-0.5",
                  isActive && "ring-4 ring-secondary from-secondary/70 to-secondary text-secondary-foreground",
                  isActive && !reducedMotion && "animate-pulse",
                  !clickable && !isActive && "opacity-90"
                )}
              >
                {cell.number}
              </span>
              {/* Back: the claiming team's mark */}
              <span
                className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-xl border border-white/20 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]",
                  compact ? "text-base" : "text-3xl sm:text-4xl",
                  isWinning && "ring-4 ring-yellow-300 shadow-[0_0_24px_4px_rgba(253,224,71,0.6)]"
                )}
                style={{
                  background: owner
                    ? `linear-gradient(180deg, ${colorOf(owner)}, ${colorOf(owner)}cc)`
                    : undefined,
                  boxShadow: owner && !isWinning ? `0 6px 0 0 ${colorOf(owner)}66` : undefined,
                }}
                aria-hidden="true"
              >
                {owner ? teamMark(owner) : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
