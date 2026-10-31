"use client";

import { Crown, LogIn, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { teamMark } from "@/components/team-game/team-helpers";
import type { TeamGamePerson, TeamGameState } from "@/types";

const NO_TEAM = "none";

interface TeamRosterProps {
  state: TeamGameState;
  userId: string | null;
  isHost: boolean;
  /** A topic game's host plays too, so they also get the join buttons. */
  hostPlays?: boolean;
  myTeamId: string | null;
  act: (path: string, body?: unknown, method?: "post" | "patch") => Promise<boolean>;
  pending?: boolean;
}

/**
 * Every team and its players. Players join a team here (switching freely until the game
 * starts); the host can rename teams in the lobby, move anyone, and choose leaders.
 */
export function TeamRoster({
  state,
  userId,
  isHost,
  hostPlays = false,
  myTeamId,
  act,
  pending = false,
}: TeamRosterProps) {
  const inLobby = state.status === "lobby";
  const code = state.code;
  // Once play starts a player's team is fixed, but someone who has no team can still join one.
  // A quiz host runs the game and never plays in it; a topic game's host plays like anyone.
  const canJoin = (!isHost || hostPlays) && (inLobby || (state.status === "playing" && !myTeamId));

  const move = (person: TeamGamePerson, value: string) =>
    act(ENDPOINTS.TEAM_GAME_MOVE_PLAYER(code, person.userId), {
      teamId: value === NO_TEAM ? null : value,
    });

  const hostControls = (person: TeamGamePerson, teamId: string | null, isLeader: boolean) =>
    isHost && (
      <div className="flex items-center gap-1 shrink-0">
        {teamId && !isLeader && (
          <Button
            size="icon"
            variant="ghost"
            disabled={pending}
            onClick={() => act(ENDPOINTS.TEAM_GAME_LEADER(code, teamId), { userId: person.userId })}
            aria-label={`Make ${person.name} the leader`}
            title="Make leader"
            className="h-7 w-7 text-white/50 hover:text-yellow-300"
          >
            <Crown className="h-4 w-4" />
          </Button>
        )}
        <Select value={teamId ?? NO_TEAM} onValueChange={(value) => move(person, value)} disabled={pending}>
          <SelectTrigger
            className="h-7 w-[7.5rem] border-white/10 bg-white/5 text-xs text-white"
            aria-label={`Team for ${person.name}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-white/10 text-white">
            {state.teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
            <SelectItem value={NO_TEAM}>No team</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.teams.map((team) => {
          const mine = team.id === myTeamId;
          return (
            <section
              key={team.id}
              className="rounded-2xl border bg-card/50 p-4 space-y-3"
              style={{ borderColor: mine ? team.color : "rgba(255,255,255,0.1)" }}
              aria-label={team.name}
            >
              <header className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-lg"
                  style={{ backgroundColor: team.color }}
                  aria-hidden="true"
                >
                  {teamMark(team.id)}
                </span>
                {isHost && inLobby ? (
                  <Input
                    key={team.name}
                    defaultValue={team.name}
                    maxLength={30}
                    aria-label={`Rename ${team.name}`}
                    onBlur={(e) => {
                      const name = e.target.value.trim();
                      if (name && name !== team.name) {
                        act(ENDPOINTS.TEAM_GAME(code), { teams: [{ id: team.id, name }] }, "patch");
                      }
                    }}
                    className="h-8 border-transparent bg-transparent px-1 font-fredoka text-lg font-bold text-white hover:border-white/10 focus:border-white/20"
                  />
                ) : (
                  <h3 className="font-fredoka text-lg font-bold text-white truncate">{team.name}</h3>
                )}
                <span className="ml-auto text-xs text-white/40 shrink-0">
                  {team.members.length} {team.members.length === 1 ? "player" : "players"}
                </span>
              </header>

              <ul className="space-y-1.5 min-h-[2.5rem]">
                {team.members.length === 0 && (
                  <li className="text-sm text-white/40">No players yet</li>
                )}
                {team.members.map((member) => {
                  const isLeader = member.userId === team.leaderId;
                  return (
                    // Wraps in a narrow card so the host controls never squeeze the name away.
                    <li key={member.userId} className="flex flex-wrap items-center gap-2 text-sm text-white">
                      {member.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <UserRound className="h-6 w-6 rounded-full bg-white/10 p-1 text-white/60" />
                      )}
                      <span className="min-w-[5rem] flex-1 truncate">
                        {member.name}
                        {member.userId === userId && <span className="text-white/40"> (you)</span>}
                      </span>
                      {isLeader && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-300/15 px-2 py-0.5 text-[11px] font-semibold text-yellow-300">
                          <Crown className="h-3 w-3" /> Leader
                        </span>
                      )}
                      {hostControls(member, team.id, isLeader)}
                    </li>
                  );
                })}
              </ul>

              {canJoin && !mine && (
                <Button
                  onClick={() => act(ENDPOINTS.TEAM_GAME_JOIN(code), { teamId: team.id })}
                  disabled={pending}
                  variant="outline"
                  className="w-full border-white/15 text-white hover:bg-white/10"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {myTeamId ? `Switch to ${team.name}` : `Join ${team.name}`}
                </Button>
              )}
            </section>
          );
        })}
      </div>

      {state.unassigned.length > 0 && (
        <section className="rounded-2xl border border-dashed border-white/15 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white/70">Waiting for a team</h3>
          <ul className="space-y-1.5">
            {state.unassigned.map((person) => (
              <li key={person.userId} className="flex items-center gap-2 text-sm text-white">
                <span className="truncate">
                  {person.name}
                  {person.userId === userId && <span className="text-white/40"> (you)</span>}
                </span>
                <span className="ml-auto" />
                {hostControls(person, null, false)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
