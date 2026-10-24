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

  return (
    <Dialog open={quiz !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-secondary" />
            Play &ldquo;{quiz?.title}&rdquo; as teams
          </DialogTitle>
          <DialogDescription>
            Teams take turns picking a number on a tic-tac-toe board. Each team talks it over in
            its own chat and the leader answers. A right answer wins the cell; a full line wins
            the game. You&apos;ll get a link to share once the lobby is open.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team-count">Teams</Label>
            <Select value={String(teamCount)} onValueChange={(v) => setTeamCount(Number(v))}>
              <SelectTrigger id="team-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_COUNTS.map((count) => (
                  <SelectItem key={count} value={String(count)} disabled={cards < cardsNeeded(count)}>
                    {count} teams
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-timer">Time to answer</Label>
            <Select value={String(timerSeconds)} onValueChange={(v) => setTimerSeconds(Number(v))}>
              <SelectTrigger id="team-timer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
