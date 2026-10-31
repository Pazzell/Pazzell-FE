import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PickCountdown } from "./pick-countdown";

const at = (secondsFromNow: number) => new Date(Date.now() + secondsFromNow * 1000).toISOString();

describe("PickCountdown", () => {
  it("tells the team in turn how long it has to choose", () => {
    render(
      <PickCountdown deadlineAt={at(25)} serverTime={at(0)} teamName="Team A" waitingTeamName="Team B" isMyTeam />
    );
    expect(screen.getByRole("timer")).toHaveTextContent(/Choose your question · 2[45]s/);
    expect(screen.getByRole("timer")).not.toHaveTextContent("abandoned");
  });

  it("warns in the last seconds that the game will be abandoned to the waiting team", () => {
    const { rerender } = render(
      <PickCountdown deadlineAt={at(6)} serverTime={at(0)} teamName="Team A" waitingTeamName="Team B" isMyTeam />
    );
    expect(screen.getByRole("timer")).toHaveTextContent(
      /Choose your question · [56]s left, or the game is abandoned and Team B wins/
    );

    rerender(
      <PickCountdown
        deadlineAt={at(6)}
        serverTime={at(0)}
        teamName="Team A"
        waitingTeamName="Team B"
        isMyTeam={false}
      />
    );
    expect(screen.getByRole("timer")).toHaveTextContent(/Team A is choosing · [56]s left before Team A forfeits/);
  });
});
