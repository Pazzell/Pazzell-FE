"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Cat,
  Check,
  Copy,
  Image as ImageIcon,
  Link2,
  Lock,
  PencilLine,
  Pointer,
  Send,
  Trophy,
  Type,
} from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

// Each scene plays out over TICKS_PER_SCENE ticks, then the screen slides to the next one.
const TICK_MS = 400;
const TICKS_PER_SCENE = 14;

const SCENES = [
  { id: "picture", label: "Pictures", icon: ImageIcon, url: "pazzell.com/play/animals" },
  { id: "definition", label: "Definitions", icon: Type, url: "pazzell.com/play/football" },
  { id: "create", label: "Create", icon: PencilLine, url: "pazzell.com/my-quizzes/new" },
  { id: "share", label: "Share", icon: Link2, url: "pazzell.com/q/plant-cells" },
  { id: "results", label: "Results", icon: BarChart3, url: "pazzell.com/my-quizzes/plant-cells" },
] as const;

const PLAYERS = [
  { name: "Ada", score: 10, color: "#00D9FF", status: "finished" },
  { name: "Tunde", score: 8, color: "#00E676", status: "finished" },
  { name: "Mia", score: 7, color: "#FF6B9D", status: "playing" },
  { name: "Ken", score: 6, color: "#FFEAA7", status: "opened the link" },
];

const CARDS_PER_TRIVIA = 10;

// Elements mount as their tick arrives, so the entrance animation plays once per scene.
const appear = "animate-fade-up motion-reduce:animate-none";

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-[#1A1A2E]"
      style={{ backgroundColor: color }}
      aria-hidden>
      {name[0]}
    </span>
  );
}

/** A finger tapping the element it sits in. */
function Tap() {
  return (
    <span className="pointer-events-none absolute -bottom-3 right-3" aria-hidden>
      <span className="absolute -inset-2 rounded-full bg-white/30 animate-ping motion-reduce:animate-none" />
      <Pointer className="relative h-6 w-6 text-white drop-shadow animate-pop motion-reduce:animate-none" />
    </span>
  );
}

function QuestionScene({
  t,
  prompt,
  options,
  correct,
  picture,
}: {
  t: number;
  prompt: string;
  options: readonly string[];
  correct: number;
  picture?: boolean;
}) {
  const answered = t >= 7;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between text-white/60 text-sm mb-3">
        <span>Question 3 of 10</span>
        {answered && (
          <span className={cn("inline-flex items-center gap-1 text-green-400 font-semibold", appear)}>
            <Check className="h-4 w-4" /> Correct!
          </span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mb-5" aria-hidden>
        <div
          className="h-full rounded-full bg-green-400 transition-[width] duration-500"
          style={{ width: answered ? "30%" : "20%" }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {picture && t >= 1 && (
          <div
            className="h-28 w-40 rounded-2xl bg-gradient-to-br from-[#FF9F43] to-[#FF6B9D] flex items-center justify-center animate-pop motion-reduce:animate-none"
            aria-hidden>
            <Cat className="h-16 w-16 text-white" />
          </div>
        )}
        {t >= 2 && (
          <p className={cn("text-white text-lg text-center font-medium max-w-xs", appear)}>
            {prompt}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-5 min-h-[3.25rem]">
        {t >= 3 &&
          options.map((option, i) => (
            <div
              key={option}
              style={{ animationDelay: `${i * 120}ms` }}
              className={cn(
                "relative flex items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-white transition-colors duration-300",
                appear,
                answered && i === correct
                  ? "border-green-400 bg-green-500/10 font-bold"
                  : "border-white/10 bg-white/5"
              )}>
              {option}
              {answered && i === correct && <Check className="h-5 w-5 text-green-400 shrink-0" />}
              {t >= 6 && t < 9 && i === correct && <Tap />}
            </div>
          ))}
      </div>
    </div>
  );
}

const DEFINITION = "Where a plant cell makes its food";

function CreateScene({ t }: { t: number }) {
  const typed = DEFINITION.slice(0, Math.max(0, (t - 1) * 9));
  const typing = typed.length < DEFINITION.length;
  const published = t >= 12;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wide">New trivia</p>
          <p className="text-white font-fredoka text-xl font-bold">Plant cells</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {t >= 9 ? CARDS_PER_TRIVIA : CARDS_PER_TRIVIA - 1} cards
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex-1">
        <div className="flex gap-2 mb-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-white/50">
            <ImageIcon className="h-3.5 w-3.5" /> Picture
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-secondary bg-secondary/10 px-2.5 py-1 text-white">
            <Type className="h-3.5 w-3.5" /> Definition
          </span>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/10 px-3 py-2.5 min-h-[2.75rem] text-white">
          {typed}
          {typing && (
            <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-secondary animate-pulse" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 min-h-[2.75rem]">
          {t >= 6 && (
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border-2 px-3 py-2 text-sm text-white transition-colors duration-300",
                appear,
                t >= 8 ? "border-green-400 bg-green-500/10 font-bold" : "border-white/10"
              )}>
              Chloroplast
              {t >= 8 && <Check className="h-4 w-4 text-green-400" />}
            </div>
          )}
          {t >= 7 && (
            <div className={cn("rounded-xl border-2 border-white/10 px-3 py-2 text-sm text-white", appear)}>
              Nucleus
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-4">
        <div
          className={cn(
            "w-full rounded-full py-3 text-center font-bold transition-all duration-300",
            published
              ? "bg-green-500 text-[#1A1A2E]"
              : t >= 10
                ? "bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white scale-[0.97]"
                : "bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white"
          )}>
          {published ? (
            <span className="inline-flex items-center gap-2">
              <Check className="h-5 w-5" /> Published, link ready
            </span>
          ) : (
            "Publish"
          )}
        </div>
        {t >= 10 && t < 13 && <Tap />}
      </div>
    </div>
  );
}

function ShareScene({ t }: { t: number }) {
  const copied = t >= 3;
  const shown = PLAYERS.slice(0, Math.max(0, t - 5));
  return (
    <div className="flex h-full flex-col">
      <p className="text-white/50 text-xs uppercase tracking-wide">Share your trivia</p>
      <p className="text-white font-fredoka text-xl font-bold mb-4">Plant cells</p>

      <div className="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2 pl-4">
        <Link2 className="h-4 w-4 text-secondary shrink-0" />
        <span className="flex-1 truncate text-white/80 text-sm">pazzell.com/q/plant-cells</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-300",
            copied ? "bg-green-500 text-[#1A1A2E]" : "bg-secondary text-[#1A1A2E]"
          )}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </span>
        {t >= 2 && t < 5 && <Tap />}
      </div>

      {t >= 4 && (
        <p className={cn("flex items-center gap-2 text-white/60 text-sm mt-4 mb-2", appear)}>
          <Send className="h-4 w-4 text-[#00E676]" /> Sent to the class group
        </p>
      )}
      <ul className="space-y-2">
        {shown.map((player) => (
          <li
            key={player.name}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2",
              "animate-slide-in motion-reduce:animate-none"
            )}>
            <Avatar name={player.name} color={player.color} />
            <span className="text-white text-sm flex-1">
              <span className="font-semibold">{player.name}</span>{" "}
              <span className="text-white/60">{player.status}</span>
            </span>
            {player.status === "playing" && (
              <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse" />
            )}
            {player.status === "finished" && <Check className="h-4 w-4 text-green-400" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultsScene({ t }: { t: number }) {
  const shown = PLAYERS.slice(0, Math.min(PLAYERS.length, Math.floor((t + 1) / 2)));
  const average = shown.length
    ? Math.round((shown.reduce((sum, p) => sum + p.score, 0) / (shown.length * CARDS_PER_TRIVIA)) * 100)
    : null;
  return (
    <div className="flex h-full flex-col">
      <p className="text-white/50 text-xs uppercase tracking-wide">Results</p>
      <p className="text-white font-fredoka text-xl font-bold mb-4">Plant cells</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/50 text-xs">Plays</p>
          <p className="text-white font-fredoka text-2xl font-bold">{shown.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/50 text-xs">Average score</p>
          <p className="text-white font-fredoka text-2xl font-bold">
            {average === null ? "–" : `${average}%`}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {shown.map((player, i) => (
          <li
            key={player.name}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 animate-slide-in motion-reduce:animate-none">
            <Avatar name={player.name} color={player.color} />
            <span className="w-14 text-white text-sm font-semibold">{player.name}</span>
            <span className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <span
                className="block h-full rounded-full origin-left animate-grow motion-reduce:animate-none"
                style={{
                  width: `${(player.score / CARDS_PER_TRIVIA) * 100}%`,
                  backgroundColor: player.color,
                }}
              />
            </span>
            <span className="w-12 text-right text-white text-sm tabular-nums">
              {player.score}/{CARDS_PER_TRIVIA}
            </span>
            {i === 0 && <Trophy className="h-4 w-4 text-[#FFEAA7] shrink-0" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The hero's product screen: it slides through what Pazzell does, from answering
 * cards to creating a trivia, sharing its link and seeing everyone's results.
 */
export function HeroShowcase() {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [pos, setPos] = useState({ scene: 0, tick: 0 });

  useEffect(() => {
    if (reducedMotion || paused) return;
    const timer = setInterval(
      () =>
        setPos((p) =>
          p.tick + 1 >= TICKS_PER_SCENE
            ? { scene: (p.scene + 1) % SCENES.length, tick: 0 }
            : { ...p, tick: p.tick + 1 }
        ),
      TICK_MS
    );
    return () => clearInterval(timer);
  }, [reducedMotion, paused]);

  const scene = SCENES[pos.scene];
  // Without motion, each scene shows its finished state.
  const t = reducedMotion ? TICKS_PER_SCENE : pos.tick;

  return (
    <div
      className="relative w-full max-w-md mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}>
      <div
        className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-[#6C5CE7]/40 via-secondary/20 to-[#FF6B9D]/30 blur-3xl"
        aria-hidden
      />

      <div className="relative rounded-[28px] border border-white/10 bg-[#141428]/90 shadow-2xl shadow-[#6C5CE7]/30 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFEAA7]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#00E676]" />
          </span>
          <span
            key={scene.url}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-white/50 animate-fade-up motion-reduce:animate-none">
            <Lock className="h-3 w-3 shrink-0" />
            <span className="truncate">{scene.url}</span>
          </span>
        </div>

        <div className="h-[27rem] p-5 sm:p-6" data-hero-screen>
          <div key={scene.id} className="h-full animate-scene-in motion-reduce:animate-none">
            {scene.id === "picture" && (
              <QuestionScene t={t} picture prompt="What is this?" options={["Cat", "Sheep"]} correct={0} />
            )}
            {scene.id === "definition" && (
              <QuestionScene
                t={t}
                prompt="The only player allowed to handle the ball in open play"
                options={["Striker", "Goalkeeper"]}
                correct={1}
              />
            )}
            {scene.id === "create" && <CreateScene t={t} />}
            {scene.id === "share" && <ShareScene t={t} />}
            {scene.id === "results" && <ResultsScene t={t} />}
          </div>
        </div>
      </div>

      <div
        className="relative mt-5 grid grid-cols-5 gap-1.5"
        role="tablist"
        aria-label="What you can do on Pazzell">
        {SCENES.map((s, i) => {
          const active = i === pos.scene;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPos({ scene: i, tick: 0 })}
              className={cn(
                "relative flex flex-col items-center gap-1 overflow-hidden rounded-xl border px-1 pt-2 pb-2.5 text-[11px] sm:text-xs font-medium transition-colors",
                active
                  ? "border-secondary/60 bg-secondary/10 text-white"
                  : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
              )}>
              <s.icon className="h-4 w-4" />
              <span className="max-w-full truncate">{s.label}</span>
              {active && !reducedMotion && (
                <span
                  className="absolute bottom-0 left-0 h-0.5 bg-secondary transition-[width] ease-linear"
                  style={{
                    width: `${(pos.tick / (TICKS_PER_SCENE - 1)) * 100}%`,
                    transitionDuration: `${TICK_MS}ms`,
                  }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
