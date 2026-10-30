"use client";

import { AlertTriangle, Check, Crown, X } from "lucide-react";
import { CountdownBar } from "@/components/ui/countdown-bar";
import { cn } from "@/lib/utils";
import { OptionLetter } from "@/components/trivia/option-letter";
import type { TeamGameState, TeamPlayOutcome } from "@/types";

type OpenQuestion = NonNullable<TeamGameState["current"]>;

export interface QuestionReveal {
  outcome: TeamPlayOutcome;
  optionIndex: number | null;
  correctOptionIndex: number;
}

interface TeamQuestionProps {
  current: OpenQuestion;
  serverTime: string;
  teamName: string;
  teamColor: string;
  leaderName: string | null;
  /** The viewer is the leader who answers. */
  canAnswer: boolean;
  /** The viewer is on the answering team (but not its leader). */
  isTeammate: boolean;
  pending?: boolean;
  onAnswer?: (optionIndex: number) => void;
  /** Set once the question is settled: shows the right answer. */
  reveal?: QuestionReveal | null;
}

/** The question behind a picked cell, with the shared countdown. Only the leader can answer. */
export function TeamQuestion({
  current,
  serverTime,
  teamName,
  teamColor,
  leaderName,
  canAnswer,
  isTeammate,
  pending = false,
  onAnswer,
  reveal = null,
}: TeamQuestionProps) {
  const { question } = current;
  const locked = !canAnswer || pending || Boolean(reveal);

  const hint = reveal
    ? null
    : canAnswer
    ? "You're the leader: talk it over with your team, then choose."
    : isTeammate
    ? `Help ${leaderName ?? "your leader"} decide in the team chat. Only the leader can answer.`
    : `${teamName} is deliberating. ${leaderName ?? "Their leader"} will answer.`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: `${teamColor}33`, border: `1px solid ${teamColor}` }}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: teamColor }} />
          {teamName} · Cell {current.number}
        </span>
        {leaderName && (
          <span className="inline-flex items-center gap-1 text-white/60 text-sm">
            <Crown className="h-4 w-4 text-yellow-300" />
            {leaderName}
          </span>
        )}
      </div>

      {!reveal && (
        <CountdownBar
          key={current.servedAt}
          deadlineAt={current.deadlineAt}
          servedAt={current.servedAt}
          serverTime={serverTime}
          timerSeconds={current.timerSeconds}
          // The server closes the question itself; the next state push shows the result.
          onExpire={() => undefined}
        />
      )}

      <div className="flex flex-col items-center gap-4">
        {question.imageUrl && (
          <div className="rounded-2xl bg-gray-100 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt={question.text ?? "Question image"}
              className="max-h-52 w-auto max-w-full rounded-xl object-contain"
            />
          </div>
        )}
        {question.imageUrl && question.attribution && (
          <p className="-mt-2 text-white/40 text-[11px] text-center max-w-md break-words">
            {question.attribution}
          </p>
        )}
        {question.text && (
          <p className="text-white text-lg sm:text-xl text-center font-medium max-w-md">
            {question.text}
          </p>
        )}
      </div>

      <div className="min-h-7 text-center" aria-live="polite">
        {reveal ? (
          <p
            className={cn(
              "inline-flex items-center gap-2 font-semibold text-lg",
              reveal.outcome === "correct" ? "text-green-400" : "text-red-400"
            )}
          >
            {reveal.outcome === "correct" ? (
              <>
                <Check className="h-5 w-5" /> {teamName} claims cell {current.number}!
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5" />
                {reveal.outcome === "timeout" ? "Time is up!" : "Not quite."} Cell {current.number} stays open.
              </>
            )}
          </p>
        ) : (
          <p className="text-white/60 text-sm">{hint}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        {question.options.map((option, position) => {
          const isCorrect = reveal?.correctOptionIndex === option.index;
          const isWrongPick = reveal && !isCorrect && reveal.optionIndex === option.index;
          return (
            <button
              key={option.index}
              type="button"
              disabled={locked}
              onClick={() => !locked && onAnswer?.(option.index)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-4 text-left text-white transition-all",
                isCorrect
                  ? "border-green-400 bg-green-500/10 font-bold"
                  : isWrongPick
                  ? "border-red-400 bg-red-500/10"
                  : "border-white/10 bg-white/5",
                !locked ? "cursor-pointer hover:border-secondary active:scale-[0.98]" : "cursor-default"
              )}
            >
              <span className="flex items-center gap-2">
                {question.options.length > 2 && <OptionLetter index={position} />}
                {option.text}
              </span>
              {isCorrect && <Check className="h-5 w-5 shrink-0 text-green-400" />}
              {isWrongPick && <X className="h-5 w-5 shrink-0 text-red-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
