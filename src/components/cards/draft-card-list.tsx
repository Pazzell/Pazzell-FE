"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { validateCard } from "@/components/cards/card-form-dialog";
import type { DraftTriviaCard } from "@/types";

/** A draft on the review screen; `key` survives edits and removals. */
export interface ReviewCard extends DraftTriviaCard {
  key: number;
}

export const toReviewCards = (cards: DraftTriviaCard[]): ReviewCard[] =>
  cards.map((card, key) => ({ ...card, key }));

/** The kept drafts as the bulk card endpoints take them (the quote is not saved). */
export const draftCardsPayload = (kept: ReviewCard[]) =>
  kept.map(({ type, text, options, correctOptionIndex }) => ({
    type,
    text: text.trim(),
    options: [options[0].trim(), options[1].trim()],
    correctOptionIndex,
  }));

/** The first card that can't be saved as it stands, as a message, or null. */
export function firstDraftProblem(kept: ReviewCard[]): string | null {
  for (let i = 0; i < kept.length; i++) {
    const problem = validateCard(kept[i]);
    if (problem) return `Card ${i + 1}: ${problem}`;
  }
  return null;
}

interface DraftCardListProps {
  cards: ReviewCard[];
  onChange: (cards: ReviewCard[]) => void;
}

/** Drafts written from a document: edit the text and options, pick the correct one, remove. */
export function DraftCardList({ cards, onChange }: DraftCardListProps) {
  const updateCard = (key: number, change: Partial<DraftTriviaCard>) =>
    onChange(cards.map((card) => (card.key === key ? { ...card, ...change } : card)));

  return (
    <ol className="space-y-3">
      {cards.map((card, index) => (
        <li key={card.key} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-white/40 text-sm font-medium w-6 shrink-0 pt-2">{index + 1}</span>
            <Textarea
              aria-label={`Card ${index + 1} question`}
              rows={2}
              maxLength={300}
              value={card.text}
              onChange={(event) => updateCard(card.key, { text: event.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onChange(cards.filter((c) => c.key !== card.key))}
              aria-label={`Remove card ${index + 1}`}
              className="text-white/60 hover:text-red-400 shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <fieldset className="pl-9 space-y-2">
            <legend className="sr-only">Options for card {index + 1}</legend>
            {([0, 1] as const).map((optionIndex) => (
              <label key={optionIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${card.key}`}
                  checked={card.correctOptionIndex === optionIndex}
                  onChange={() => updateCard(card.key, { correctOptionIndex: optionIndex })}
                  aria-label={`Card ${index + 1} option ${optionIndex + 1} is correct`}
                  className="accent-green-500 h-4 w-4 shrink-0"
                />
                <Input
                  aria-label={`Card ${index + 1} option ${optionIndex + 1}`}
                  value={card.options[optionIndex]}
                  maxLength={80}
                  onChange={(event) => {
                    const options: [string, string] = [...card.options];
                    options[optionIndex] = event.target.value;
                    updateCard(card.key, { options });
                  }}
                  className={
                    card.correctOptionIndex === optionIndex
                      ? "bg-green-500/10 border-green-400 text-white"
                      : "bg-white/5 border-white/10 text-white"
                  }
                />
              </label>
            ))}
          </fieldset>
          {card.quote && (
            <p className="pl-9 text-white/50 text-xs break-words">
              From your document: &ldquo;{card.quote}&rdquo;
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
