"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { cardsNeeded, TEAM_TIMER_CHOICES } from "@/components/team-game/team-helpers";
import type { CustomQuiz, TeamGameResponse } from "@/types";

const TEAM_COUNTS = [2, 3, 4, 5, 6];

interface HostTeamGameDialogProps {
  quiz: CustomQuiz | null;
  onOpenChange: (open: boolean) => void;
}

/** Sets up a team game from one of the player's own quizzes and opens its lobby. */
export function HostTeamGameDialog({ quiz, onOpenChange }: HostTeamGameDialogProps) {
  const router = useRouter();
  const [teamCount, setTeamCount] = useState(2);
  const [timerSeconds, setTimerSeconds] = useState(30);

  const create = useMutation({
    mutationFn: () =>
      api
        .post<TeamGameResponse>(ENDPOINTS.TEAM_GAMES, { quizId: quiz!.id, teamCount, timerSeconds })
        .then((res) => res.data.game),
    onSuccess: (game) => router.push(routes.TEAM_GAME(game.code)),
    onError: (error) => toast.error(getApiError(error)?.message || "Couldn't set up the game."),
  });

  const cards = quiz?.cardCount ?? 0;
  const needed = cardsNeeded(teamCount);
  // Why some team counts can't be picked: the bigger boards need more questions.
  const firstLocked = TEAM_COUNTS.find((count) => cards < cardsNeeded(count));
  const lockedHint =
    firstLocked !== undefined && cards >= cardsNeeded(TEAM_COUNTS[0])
      ? `Add ${cardsNeeded(firstLocked) - cards} more ${
          cardsNeeded(firstLocked) - cards === 1 ? "question" : "questions"
        } to play with ${firstLocked} teams: a bigger board needs a question for every cell.`
      : null;

  return (
    <Dialog open={quiz !== null} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            Host &ldquo;{quiz?.title}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Teams take turns picking a number on a tic-tac-toe board. Each team talks it over in
            its own chat and the leader answers. A right answer wins the cell; a full line wins
            the game. You run the game and don&apos;t play; you&apos;ll get a link to share once the
            lobby is open.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team-count">Teams</Label>
            <Select value={String(teamCount)} onValueChange={(v) => setTeamCount(Number(v))}>
              <SelectTrigger id="team-count" className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-white">
                {TEAM_COUNTS.map((count) => (
                  <SelectItem key={count} value={String(count)} disabled={cards < cardsNeeded(count)}>
                    {count} teams
                    {cards < cardsNeeded(count) && ` (needs ${cardsNeeded(count)} questions)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-timer">Time to answer</Label>
            <Select value={String(timerSeconds)} onValueChange={(v) => setTimerSeconds(Number(v))}>
              <SelectTrigger id="team-timer" className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-white">
                {TEAM_TIMER_CHOICES.map((seconds) => (
                  <SelectItem key={seconds} value={String(seconds)}>
                    {seconds} seconds
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className={cards < needed ? "text-sm text-red-300" : "text-sm text-muted-foreground"}>
          {cards < needed
            ? `This board needs at least ${needed} questions; the quiz has ${cards}. Add more cards first.`
            : `${teamCount <= 2 ? "3×3" : teamCount === 3 ? "4×4" : "5×5"} board · uses ${needed} of ${cards} questions, plus extras for missed cells.`}
        </p>
        {lockedHint && <p className="text-xs text-white/50">{lockedHint}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!quiz || cards < needed || create.isPending}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
          >
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Open lobby
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
