"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Crown, Link2, LogOut, Play, Settings2, Square, WifiOff } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageError } from "@/components/ui/page-error";
import { PageLoader } from "@/components/ui/page-loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamBoard } from "@/components/team-game/team-board";
import { TeamChat } from "@/components/team-game/team-chat";
import { TeamQuestion, type QuestionReveal } from "@/components/team-game/team-question";
import { TeamRoster } from "@/components/team-game/team-roster";
import { TeamScoreboard } from "@/components/team-game/team-scoreboard";
import {
  ShareResultActions,
  TeamResultCard,
  useWinnerConfetti,
} from "@/components/team-game/team-result-card";
import { leaderName, TEAM_TIMER_CHOICES, teamById } from "@/components/team-game/team-helpers";
import { useTeamGame } from "@/hooks/use-team-game";
import { api } from "@/lib/api";
import { playSuccessSound, playWrongSound } from "@/lib/sound";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { TeamGameResultResponse, TeamGameState } from "@/types";

// How long a settled question stays up, with the right answer marked, before the board returns.
const REVEAL_MS = 2800;

type OpenQuestion = NonNullable<TeamGameState["current"]>;

/** A team game, from lobby to result, kept live over the socket. */
export function TeamGame({ code }: { code: string }) {
  const { game, state, userId, myTeamId, connected, messages, act, sendMessage } = useTeamGame(code, true);
  const [pending, setPending] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const run = async (path: string, body?: unknown, method?: "post" | "patch") => {
    setPending(true);
    const ok = await act(path, body, method);
    setPending(false);
    return ok;
  };

  // Keep a settled question on screen for a moment, with the right answer marked.
  const lastOpen = useRef<OpenQuestion | null>(null);
  const seenPlays = useRef<number | null>(null);
  const [reveal, setReveal] = useState<{ current: OpenQuestion; reveal: QuestionReveal } | null>(null);
  useEffect(() => {
    if (!state) return;
    if (state.current) lastOpen.current = state.current;
    const before = seenPlays.current;
    seenPlays.current = state.playCount;
    const play = state.lastPlay;
    const asked = lastOpen.current;
    if (before === null || state.playCount <= before || !play || !asked || asked.cellIndex !== play.cellIndex) return;
    lastOpen.current = null;
    setReveal({
      current: asked,
      reveal: { outcome: play.outcome, optionIndex: play.optionIndex, correctOptionIndex: play.correctOptionIndex },
    });
    if (play.teamId === myTeamId) {
      if (play.outcome === "correct") playSuccessSound();
      else playWrongSound();
    }
  }, [state, myTeamId]);
  useEffect(() => {
    if (!reveal) return;
    const timer = setTimeout(() => setReveal(null), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [reveal]);

  const finished = state?.status === "finished";
  const result = useQuery({
    queryKey: ["team-game-result", code],
    queryFn: () =>
      api.get<TeamGameResultResponse>(ENDPOINTS.TEAM_GAME_RESULT(code)).then((res) => res.data.result),
    enabled: finished,
  });

  if (game.isLoading) return <PageLoader message="Opening the game..." />;
  if (game.error || !state) {
    return (
      <PageError
        title="This team game isn't available"
        message="The link may be wrong, or the game was removed."
        showRetry={false}
      />
    );
  }

  const isHost = state.host.userId === userId;
  // In a topic game whoever started it is also a player; a quiz host only runs the game.
  const isTopic = state.kind === "topic";
  const myTeam = teamById(state, myTeamId);
  const inGame = Boolean(myTeamId) || state.unassigned.some((p) => p.userId === userId);

  if (state.status === "cancelled") {
    return (
      <PageError title="This game was cancelled" message="The host ended it before it started." showRetry={false} />
    );
  }

  if (finished && !reveal) {
    if (!result.data) return <PageLoader message="Adding up the scores..." />;
    return (
      <FinishedView state={state} myTeamId={myTeamId} isHost={isHost && !isTopic} result={result.data} />
    );
  }

  const header = (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-white font-fredoka break-words">{state.quiz.title}</h1>
        <p className="text-white/60 text-sm">
          {isTopic
            ? `Team game · started by ${isHost ? "you" : state.host.name}`
            : `Team quiz hosted by ${isHost ? "you" : state.host.name}`}
          {!connected && (
            <span className="ml-2 inline-flex items-center gap-1 text-yellow-300">
              <WifiOff className="h-3.5 w-3.5" /> Reconnecting...
            </span>
          )}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {isHost && state.status === "playing" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManageOpen(true)}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <Settings2 className="h-4 w-4 mr-1.5" />
            Manage teams
          </Button>
        )}
        {isHost && !finished && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmEnd(true)}
            className="border-red-400/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            <Square className="h-3.5 w-3.5 mr-1.5 fill-current" />
            {state.status === "lobby" ? "Cancel game" : "End game"}
          </Button>
        )}
        {(!isHost || isTopic) && state.status === "lobby" && inGame && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => run(ENDPOINTS.TEAM_GAME_LEAVE(code))}
            className="text-white/60 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Leave
          </Button>
        )}
      </div>
    </div>
  );

  const dialogs = (
    <>
      <ConfirmDialog
        open={confirmEnd}
        onOpenChange={setConfirmEnd}
        title={state.status === "lobby" ? "Cancel this game?" : "End the game now?"}
        description={
          state.status === "lobby"
            ? "Everyone in the lobby is sent away. The link stops working."
            : "The team with the highest score wins. A tie at the top is a draw."
        }
        confirmLabel={state.status === "lobby" ? "Cancel game" : "End game"}
        onConfirm={async () => {
          await run(ENDPOINTS.TEAM_GAME_END(code));
          setConfirmEnd(false);
        }}
        pending={pending}
        destructive
      />
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="bg-card border-white/10 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage teams</DialogTitle>
          </DialogHeader>
          <TeamRoster
            state={state}
            userId={userId}
            isHost
            hostPlays={isTopic}
            myTeamId={myTeamId}
            act={run}
            pending={pending}
          />
        </DialogContent>
      </Dialog>
    </>
  );

  const chat = myTeam && (
    <TeamChat team={myTeam} messages={messages} userId={userId} onSend={sendMessage} />
  );

  if (state.status === "lobby") {
    return (
      <MainLayout maxWidth="6xl">
        <div className="space-y-6">
          {header}
          <LobbyPanel state={state} isHost={isHost} run={run} pending={pending} />
          <div className={myTeam ? "grid gap-6 lg:grid-cols-[1fr_20rem]" : ""}>
            <TeamRoster
              state={state}
              userId={userId}
              isHost={isHost}
              hostPlays={isTopic}
              myTeamId={myTeamId}
              act={run}
              pending={pending}
            />
            {chat}
          </div>
        </div>
        {dialogs}
      </MainLayout>
    );
  }

  // In play
  const turnTeam = teamById(state, state.turnTeamId);
  const turnLeader = leaderName(turnTeam);
  const isTurnLeader = Boolean(turnTeam && turnTeam.leaderId === userId);
  const shown = state.current ?? reveal?.current ?? null;
  const askedTeam = teamById(state, shown?.teamId);

  let prompt: string;
  if (!turnTeam) prompt = "Waiting for the next turn...";
  else if (!turnTeam.leaderId) prompt = `${turnTeam.name} has no leader. The host needs to choose one.`;
  else if (isTurnLeader) prompt = "Your turn! Pick a number to reveal its question.";
  else if (turnTeam.id === myTeamId) prompt = `Your team's turn. ${turnLeader} picks the number; suggest one in the chat.`;
  else prompt = `${turnTeam.name} is choosing a number...`;

  return (
    <MainLayout maxWidth="6xl">
      <div className="space-y-6">
        {header}
        <TeamScoreboard state={state} myTeamId={myTeamId} />

        <div className={chat ? "grid gap-6 lg:grid-cols-[1fr_20rem]" : ""}>
          <div className="space-y-5 min-w-0">
            {shown && askedTeam ? (
              <TeamQuestion
                current={shown}
                serverTime={state.serverTime}
                teamName={askedTeam.name}
                teamColor={askedTeam.color}
                leaderName={leaderName(askedTeam)}
                canAnswer={Boolean(state.current) && askedTeam.leaderId === userId}
                isTeammate={askedTeam.id === myTeamId}
                pending={pending}
                onAnswer={(optionIndex) => run(ENDPOINTS.TEAM_GAME_ANSWER(code), { optionIndex })}
                reveal={state.current ? null : reveal?.reveal}
              />
            ) : (
              <>
                <p
                  className="text-center font-fredoka text-lg text-white"
                  style={{ color: isTurnLeader ? turnTeam?.color : undefined }}
                >
                  {isTurnLeader && <Crown className="inline h-5 w-5 mr-1 text-yellow-300" />}
                  {prompt}
                </p>
                <TeamBoard
                  board={state.board}
                  teams={state.teams}
                  canPick={isTurnLeader}
                  pending={pending}
                  onPick={(cellIndex) => run(ENDPOINTS.TEAM_GAME_PICK(code), { cellIndex })}
                />
                <p className="text-center text-xs text-white/40">
                  {state.board.lineLength} in a row wins · {state.timerSeconds} seconds per question
                </p>
              </>
            )}

            {!myTeam && (!isHost || isTopic) && (
              <section className="space-y-3">
                <h2 className="font-fredoka text-lg font-bold text-white">Join a team to play</h2>
                <TeamRoster state={state} userId={userId} isHost={false} myTeamId={null} act={run} pending={pending} />
              </section>
            )}
          </div>
          {chat}
        </div>
      </div>
      {dialogs}
    </MainLayout>
  );
}

function LobbyPanel({
  state,
  isHost,
  run,
  pending,
}: {
  state: TeamGameState;
  isHost: boolean;
  run: (path: string, body?: unknown, method?: "post" | "patch") => Promise<boolean>;
  pending: boolean;
}) {
  const code = state.code;
  const teamsWithPlayers = state.teams.filter((t) => t.members.length > 0).length;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(state.joinUrl);
      toast.success("Join link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_16rem] rounded-2xl border border-white/10 bg-card/50 p-5">
      <div className="space-y-4 min-w-0">
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 font-fredoka text-lg font-bold text-white">
            <Link2 className="h-5 w-5 text-secondary" />
            Invite players
          </h2>
          <p className="text-sm text-white/60">Share this link. Players open it, log in and pick a team.</p>
          <div className="flex gap-2">
            <code className="flex-1 min-w-0 truncate rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80">
              {state.joinUrl}
            </code>
            <Button onClick={copyLink} size="icon" variant="outline" aria-label="Copy join link" className="shrink-0 border-white/20 text-white">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isHost && (
          <div className="flex flex-wrap gap-4">
            <label className="space-y-1.5 text-sm text-white/70">
              <span className="block">Teams</span>
              <Select
                value={String(state.teams.length)}
                onValueChange={(v) => run(ENDPOINTS.TEAM_GAME(code), { teamCount: Number(v) }, "patch")}
                disabled={pending}
              >
                <SelectTrigger className="w-32 border-white/10 bg-white/5 text-white" aria-label="Number of teams">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} teams
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-1.5 text-sm text-white/70">
              <span className="block">Time to answer</span>
              <Select
                value={String(state.timerSeconds)}
                onValueChange={(v) => run(ENDPOINTS.TEAM_GAME(code), { timerSeconds: Number(v) }, "patch")}
                disabled={pending}
              >
                <SelectTrigger className="w-32 border-white/10 bg-white/5 text-white" aria-label="Time to answer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white">
                  {Array.from(new Set([...TEAM_TIMER_CHOICES, state.timerSeconds]))
                    .sort((a, b) => a - b)
                    .map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s} seconds
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        )}

        {isHost ? (
          <div className="space-y-2">
            <Button
              onClick={() => run(ENDPOINTS.TEAM_GAME_START(code))}
              disabled={pending || teamsWithPlayers < 2}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg px-8 py-6"
            >
              <Play className="h-5 w-5 mr-2" />
              Start game
            </Button>
            {teamsWithPlayers < 2 && (
              <p className="text-sm text-white/50">At least 2 teams need players before you can start.</p>
            )}
            <p className="text-xs text-white/40">
              {state.kind === "topic"
                ? "You play too: pick your team below, then start when everyone is in. "
                : "You run the game and don't play in it. "}
              After each turn, a team&apos;s lead passes to its next player, so everyone gets a go.
              Use the crown to change a leader, or the menu to move a player. Empty teams are left
              out when the game starts.
            </p>
          </div>
        ) : (
          <p className="text-sm text-white/60">Waiting for {state.host.name} to start the game...</p>
        )}
      </div>

      <div className="space-y-2 text-center">
        <TeamBoard board={state.board} teams={state.teams} compact />
        <p className="text-xs text-white/50">
          {state.board.size}×{state.board.size} board · {state.board.lineLength} in a row wins
        </p>
      </div>
    </div>
  );
}

function FinishedView({
  state,
  myTeamId,
  isHost,
  result,
}: {
  state: TeamGameState;
  myTeamId: string | null;
  isHost: boolean;
  result: NonNullable<TeamGameResultResponse["result"]>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const winner = result.teams.find((t) => t.isWinner) ?? null;
  // The winners celebrate; so do the host and anyone watching without a team.
  useWinnerConfetti(winner?.color, Boolean(winner) && (myTeamId === winner?.id || !myTeamId));

  const headline = !winner
    ? "It's a draw!"
    : myTeamId === winner.id
    ? "Your team wins!"
    : myTeamId
    ? `${winner.name} wins this one.`
    : `${winner.name} wins!`;

  return (
    <MainLayout maxWidth="3xl">
      <div className="space-y-6 py-2">
        <h1 className="text-center text-3xl font-bold text-white font-fredoka">{headline}</h1>
        <TeamResultCard ref={cardRef} result={result} />
        <ShareResultActions result={result} cardRef={cardRef} />
        <div className="flex justify-center">
          <Button asChild variant="ghost" className="text-white/60 hover:text-white">
            <Link
              href={
                isHost
                  ? routes.USER.MY_QUIZZES
                  : state.kind === "topic"
                  ? routes.TEAM_GAME_NEW
                  : routes.USER.HOME
              }
            >
              {isHost ? "Back to my quizzes" : state.kind === "topic" ? "Play another team game" : "Done"}
            </Link>
          </Button>
        </div>
        <p className="sr-only">{state.quiz.title}</p>
      </div>
    </MainLayout>
  );
}
