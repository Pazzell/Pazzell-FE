import { cn } from "@/lib/utils";
import { teamMark } from "@/components/team-game/team-helpers";
import type { TeamGameState } from "@/types";

/** Each team's score, with the team in turn highlighted. */
export function TeamScoreboard({ state, myTeamId }: { state: TeamGameState; myTeamId: string | null }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2" aria-label="Scores">
      {state.teams.map((team) => {
        const inTurn = team.id === state.turnTeamId;
        return (
          <li
            key={team.id}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm text-white transition-all",
              inTurn ? "scale-105 shadow-lg" : "opacity-80"
            )}
            style={{
              borderColor: inTurn ? team.color : "rgba(255,255,255,0.1)",
              backgroundColor: inTurn ? `${team.color}33` : "rgba(255,255,255,0.04)",
            }}
            aria-current={inTurn ? "true" : undefined}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
              style={{ backgroundColor: team.color }}
              aria-hidden="true"
            >
              {teamMark(team.id)}
            </span>
            <span className="font-semibold">
              {team.name}
              {team.id === myTeamId && <span className="text-white/50 font-normal"> (you)</span>}
            </span>
            <span className="font-fredoka text-lg font-bold">{team.score}</span>
            {inTurn && <span className="sr-only">, in turn</span>}
          </li>
        );
      })}
    </ul>
  );
}
