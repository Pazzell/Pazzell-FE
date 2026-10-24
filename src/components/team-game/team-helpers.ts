import type { TeamGameState, TeamGameTeam } from "@/types";

// Each team's mark on the board, by team id: the classic X and O first.
const MARKS: Record<string, string> = { t1: "✕", t2: "◯", t3: "△", t4: "□", t5: "☆", t6: "◇" };

export const teamMark = (teamId: string) => MARKS[teamId] ?? "●";

export const teamById = (state: Pick<TeamGameState, "teams">, teamId: string | null | undefined) =>
  teamId ? state.teams.find((t) => t.id === teamId) ?? null : null;

export const leaderName = (team: TeamGameTeam | null) =>
  team?.members.find((m) => m.userId === team.leaderId)?.name ?? null;

/** Questions a quiz needs per board: a 3x3 board for 2 teams, 4x4 for 3, 5x5 for 4 to 6. */
export function cardsNeeded(teamCount: number) {
  const size = teamCount <= 2 ? 3 : teamCount === 3 ? 4 : 5;
  return size * size;
}

export const TEAM_TIMER_CHOICES = [15, 20, 30, 45, 60, 90, 120];
