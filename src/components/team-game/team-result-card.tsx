"use client";

import { forwardRef, RefObject, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Crown, Download, Loader2, Share2, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamBoard } from "@/components/team-game/team-board";
import { teamMark } from "@/components/team-game/team-helpers";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { TeamGameResult, TeamGameTeam } from "@/types";

const END_REASON: Record<string, string> = {
  line: "Won with a line on the board",
  board_full: "Board full: the highest score wins",
  host_ended: "Ended by the host: the highest score wins",
};

/** The result summary: the winner, the final board and every team's line-up. */
export const TeamResultCard = forwardRef<HTMLDivElement, { result: TeamGameResult }>(
  function TeamResultCard({ result }, ref) {
    const winner = result.teams.find((t) => t.isWinner) ?? null;
    // A topic game has no host running it: whoever started it played too.
    const isTopic = result.kind === "topic";
    // The board only needs each team's id and colour.
    const boardTeams = result.teams.map(
      (t): TeamGameTeam => ({ id: t.id, name: t.name, color: t.color, leaderId: null, score: t.score, members: [] })
    );
    const date = result.finishedAt ? new Date(result.finishedAt).toLocaleDateString() : null;

    return (
      <div
        ref={ref}
        className="w-full max-w-xl mx-auto overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 text-white"
      >
        <div
          className="px-6 py-6 text-center space-y-2"
          style={{
            background: winner
              ? `linear-gradient(180deg, ${winner.color}55, transparent)`
              : "linear-gradient(180deg, rgba(148,163,184,0.25), transparent)",
          }}
        >
          <p className="text-xs uppercase tracking-widest text-white/60">
            {isTopic ? "Team game result" : "Team quiz result"}
          </p>
          <h2 className="font-fredoka text-xl font-bold break-words">{result.quiz.title}</h2>
          {winner ? (
            <div className="flex flex-col items-center gap-1 pt-2">
              <Trophy className="h-10 w-10 text-yellow-300" />
              <p className="font-fredoka text-3xl font-bold" style={{ color: winner.color }}>
                {winner.name} wins!
              </p>
            </div>
          ) : (
            <p className="font-fredoka text-3xl font-bold pt-2">It&apos;s a draw!</p>
          )}
          {result.endReason && (
            <p className="text-sm text-white/60">
              {isTopic && result.endReason === "host_ended"
                ? "Ended early: the highest score wins"
                : END_REASON[result.endReason]}
            </p>
          )}
        </div>

        <div className="px-6 pb-2">
          <TeamBoard board={result.board} teams={boardTeams} winningLine={result.winningLine} compact />
        </div>

        <ul className="px-6 py-4 space-y-3">
          {result.teams.map((team) => (
            <li
              key={team.id}
              className={cn("rounded-2xl border p-3 space-y-2", team.isWinner ? "bg-white/10" : "bg-white/5")}
              style={{ borderColor: team.isWinner ? team.color : "rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                  style={{ backgroundColor: team.color }}
                  aria-hidden="true"
                >
                  {teamMark(team.id)}
                </span>
                <span className="font-semibold">{team.name}</span>
                {team.isWinner && <Trophy className="h-4 w-4 text-yellow-300" aria-label="Winner" />}
                <span className="ml-auto font-fredoka text-2xl font-bold">{team.score}</span>
                <span className="text-xs text-white/50">pts</span>
              </div>
              <p className="text-xs text-white/50">
                {team.correctAnswers} of {team.questionsAnswered} answered correctly · {team.cellsClaimed}{" "}
                {team.cellsClaimed === 1 ? "cell" : "cells"}
              </p>
              <ul className="flex flex-wrap gap-1.5" aria-label={`${team.name} players`}>
                {team.members.map((member, i) => (
                  <li
                    key={`${member.name}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs"
                  >
                    {member.isLeader && <Crown className="h-3 w-3 text-yellow-300" aria-label="Leader" />}
                    {member.name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="flex items-center justify-center gap-1.5 border-t border-white/10 px-6 py-3 text-xs text-white/40">
          <Users className="h-3.5 w-3.5" />
          {isTopic ? "Started by" : "Hosted by"} {result.host.name}
          {date && ` · ${date}`} · {result.questionsPlayed} questions · Pazzell
        </p>
      </div>
    );
  }
);

/** Confetti once, in the winning team's colour. */
export function useWinnerConfetti(color: string | null | undefined, celebrate: boolean) {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!celebrate || reducedMotion) return;
    const colors = [color || "#facc15", "#facc15", "#ffffff"];
    confetti({ particleCount: 200, spread: 110, startVelocity: 50, origin: { y: 0.6 }, colors });
    let rounds = 0;
    const sides = setInterval(() => {
      confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
      if (++rounds >= 4) clearInterval(sides);
    }, 400);
    return () => clearInterval(sides);
  }, [celebrate, color, reducedMotion]);
}

/** Share the result link, or save the card as a picture. */
export function ShareResultActions({
  result,
  cardRef,
}: {
  result: TeamGameResult;
  cardRef: RefObject<HTMLDivElement | null>;
}) {
  const [saving, setSaving] = useState(false);
  const winner = result.teams.find((t) => t.isWinner);
  const text = winner
    ? `${winner.name} won "${result.quiz.title}" on Pazzell!`
    : `"${result.quiz.title}" ended in a draw on Pazzell!`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: result.kind === "topic" ? "Team game result" : "Team quiz result",
          text,
          url: result.resultUrl,
        });
        return;
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${result.resultUrl}`);
      toast.success("Result link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const saveImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#020617" });
      const link = document.createElement("a");
      link.download = `pazzell-team-result-${result.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Couldn't save the picture. Try sharing the link instead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button onClick={share} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka">
        <Share2 className="h-4 w-4 mr-2" />
        Share result
      </Button>
      <Button
        onClick={saveImage}
        disabled={saving}
        variant="outline"
        className="border-white/20 text-white/80 hover:bg-white/10 font-fredoka"
      >
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
        Save image
      </Button>
    </div>
  );
}
