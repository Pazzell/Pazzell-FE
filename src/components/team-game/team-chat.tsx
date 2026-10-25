"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TeamGameMessage, TeamGameTeam } from "@/types";

const MESSAGE_MAX = 300;

interface TeamChatProps {
  team: TeamGameTeam;
  messages: TeamGameMessage[];
  userId: string | null;
  onSend: (text: string) => Promise<boolean>;
  disabled?: boolean;
}

/** A team's private chat for deliberating before the leader answers. */
export function TeamChat({ team, messages, userId, onSend, disabled = false }: TeamChatProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    if (await onSend(trimmed)) setText("");
    setSending(false);
  };

  return (
    <section
      className="flex h-full min-h-[18rem] flex-col rounded-2xl border border-white/10 bg-card/50"
      aria-label={`${team.name} chat`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <h2 className="flex items-center gap-2 font-fredoka font-bold text-white">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
          {team.name} chat
        </h2>
        <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
          <Lock className="h-3 w-3" />
          Only your team sees this
        </span>
      </header>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3 max-h-[22rem]" aria-live="polite">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-white/40">
            No messages yet. Share your ideas before your leader answers.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.userId === userId;
          const isLeader = message.userId === team.leaderId;
          return (
            <div key={message.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <span className="text-[11px] text-white/40">
                {mine ? "You" : message.name}
                {isLeader && " · leader"}
              </span>
              <p
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words",
                  mine ? "bg-secondary text-secondary-foreground" : "bg-white/10 text-white"
                )}
              >
                {message.text}
              </p>
            </div>
          );
        })}
      </div>

      <form method="post" onSubmit={submit} className="flex gap-2 border-t border-white/10 p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MESSAGE_MAX))}
          placeholder={disabled ? "Chat is closed" : "Message your team"}
          aria-label="Message your team"
          disabled={disabled}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || sending || !text.trim()}
          aria-label="Send message"
          className="shrink-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
}
