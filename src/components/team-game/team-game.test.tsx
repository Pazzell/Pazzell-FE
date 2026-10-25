import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TeamGameBoard, TeamGameResult, TeamGameState, TeamGameTeam } from "@/types";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("html-to-image", () => ({ toPng: vi.fn() }));

import { TeamBoard } from "./team-board";
import { TeamQuestion } from "./team-question";
import { TeamResultCard } from "./team-result-card";
import { TeamRoster } from "./team-roster";
import { cardsNeeded } from "./team-helpers";

const teams: TeamGameTeam[] = [
  {
    id: "t1",
    name: "Team A",
    color: "#ef4444",
    leaderId: "u1",
    score: 1,
    members: [
      { userId: "u1", name: "Ada", avatar: null },
      { userId: "u2", name: "Bayo", avatar: null },
    ],
  },
  { id: "t2", name: "Team B", color: "#3b82f6", leaderId: "u3", score: 0, members: [{ userId: "u3", name: "Chidi", avatar: null }] },
];

const board = (owners: (string | null)[] = Array(9).fill(null)): TeamGameBoard => ({
  size: 3,
  lineLength: 3,
  cells: owners.map((owner, index) => ({ index, number: index + 1, owner })),
});

const current: NonNullable<TeamGameState["current"]> = {
  cellIndex: 4,
  number: 5,
  teamId: "t1",
  servedAt: new Date().toISOString(),
  deadlineAt: new Date(Date.now() + 30000).toISOString(),
  timerSeconds: 30,
  question: {
    type: "definition",
    imageUrl: null,
    text: "Capital of Nigeria",
    attribution: null,
    options: [
      { index: 0, text: "Abuja" },
      { index: 1, text: "Lagos" },
    ],
  },
};

describe("cardsNeeded", () => {
  it("needs a question for every cell of the board the teams play on", () => {
    expect([2, 3, 4, 6].map(cardsNeeded)).toEqual([9, 16, 25, 25]);
  });
});

describe("TeamBoard", () => {
  it("numbers open cells and names the team on claimed ones", () => {
    render(<TeamBoard board={board(["t1", null, null, null, "t2", null, null, null, null])} teams={teams} />);
    expect(screen.getByRole("gridcell", { name: "Cell 1, claimed by Team A" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "Cell 5, claimed by Team B" })).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "Cell 2, open" })).toHaveTextContent("2");
  });

  it("only lets the leader in turn pick an open cell", async () => {
    const onPick = vi.fn();
    const { rerender } = render(
      <TeamBoard board={board(["t1", null, null, null, null, null, null, null, null])} teams={teams} onPick={onPick} />
    );
    expect(screen.getByRole("gridcell", { name: "Cell 3, open" })).toBeDisabled();

    rerender(
      <TeamBoard board={board(["t1", null, null, null, null, null, null, null, null])} teams={teams} canPick onPick={onPick} />
    );
    expect(screen.getByRole("gridcell", { name: "Cell 1, claimed by Team A" })).toBeDisabled();
    await userEvent.click(screen.getByRole("gridcell", { name: "Cell 3, open" }));
    expect(onPick).toHaveBeenCalledWith(2);
  });
});

describe("TeamQuestion", () => {
  const props = {
    current,
    serverTime: new Date().toISOString(),
    teamName: "Team A",
    teamColor: "#ef4444",
    leaderName: "Ada",
  };

  it("lets the leader answer", async () => {
    const onAnswer = vi.fn();
    render(<TeamQuestion {...props} canAnswer isTeammate={false} onAnswer={onAnswer} />);
    await userEvent.click(screen.getByRole("button", { name: "Lagos" }));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("asks teammates to help in the chat, and locks the options", () => {
    render(<TeamQuestion {...props} canAnswer={false} isTeammate />);
    expect(screen.getByText(/Help Ada decide in the team chat/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abuja" })).toBeDisabled();
  });

  it("shows the right answer once settled", () => {
    render(
      <TeamQuestion
        {...props}
        canAnswer={false}
        isTeammate={false}
        reveal={{ outcome: "wrong", optionIndex: 1, correctOptionIndex: 0 }}
      />
    );
    expect(screen.getByText(/Cell 5 stays open/)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("TeamRoster", () => {
  const state = {
    code: "abcdefgh12",
    status: "lobby",
    teams,
    unassigned: [],
  } as unknown as TeamGameState;

  it("offers players a team to join, and marks the leader", async () => {
    const act = vi.fn().mockResolvedValue(true);
    render(<TeamRoster state={state} userId="u9" isHost={false} myTeamId={null} act={act} />);
    expect(screen.getAllByText("Leader")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Join Team B" }));
    expect(act).toHaveBeenCalledWith("/team-games/abcdefgh12/join", { teamId: "t2" });
  });

  it("never offers the host a team to join", () => {
    render(<TeamRoster state={state} userId="host" isHost myTeamId={null} act={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /^Join / })).not.toBeInTheDocument();
  });

  it("lets the host hand over the lead", async () => {
    const act = vi.fn().mockResolvedValue(true);
    render(<TeamRoster state={state} userId="host" isHost myTeamId={null} act={act} />);
    await userEvent.click(screen.getByRole("button", { name: "Make Bayo the leader" }));
    expect(act).toHaveBeenCalledWith("/team-games/abcdefgh12/teams/t1/leader", { userId: "u2" });
  });

  it("fixes a player's team once the game is in play", () => {
    render(
      <TeamRoster state={{ ...state, status: "playing" }} userId="u1" isHost={false} myTeamId="t1" act={vi.fn()} />
    );
    expect(screen.queryByRole("button", { name: /Switch to/ })).not.toBeInTheDocument();
  });
});

describe("TeamResultCard", () => {
  const result: TeamGameResult = {
    code: "abcdefgh12",
    quiz: { title: "Naija trivia", coverImageUrl: null },
    host: { name: "Host", avatar: null },
    endReason: "line",
    isDraw: false,
    winnerTeamId: "t1",
    board: board(["t1", "t1", "t1", "t2", null, null, null, null, null]),
    winningLine: [0, 1, 2],
    teams: [
      {
        id: "t1", name: "Team A", color: "#ef4444", score: 3, cellsClaimed: 3, questionsAnswered: 3,
        correctAnswers: 3, leaderName: "Ada", isWinner: true,
        members: [{ name: "Ada", avatar: null, isLeader: true }, { name: "Bayo", avatar: null, isLeader: false }],
      },
      {
        id: "t2", name: "Team B", color: "#3b82f6", score: 1, cellsClaimed: 1, questionsAnswered: 2,
        correctAnswers: 1, leaderName: "Chidi", isWinner: false,
        members: [{ name: "Chidi", avatar: null, isLeader: true }],
      },
    ],
    questionsPlayed: 5,
    startedAt: null,
    finishedAt: "2026-10-24T12:00:00.000Z",
    resultUrl: "https://app.pazzell.test/team/abcdefgh12/result",
  };

  it("shows the winner, the reason and every team's players", () => {
    render(<TeamResultCard result={result} />);
    expect(screen.getByText("Team A wins!")).toBeInTheDocument();
    expect(screen.getByText("Won with a line on the board")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Team A players" })).toHaveTextContent("AdaBayo");
    expect(screen.getByRole("list", { name: "Team B players" })).toHaveTextContent("Chidi");
    expect(screen.getByText(/1 of 2 answered correctly/)).toBeInTheDocument();
  });

  it("calls a tie a draw", () => {
    render(
      <TeamResultCard
        result={{ ...result, isDraw: true, winnerTeamId: null, teams: result.teams.map((t) => ({ ...t, isWinner: false })) }}
      />
    );
    expect(screen.getByText("It's a draw!")).toBeInTheDocument();
  });
});
