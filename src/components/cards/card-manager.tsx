"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Check, ListPlus, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BulkAddDialog } from "@/components/cards/bulk-add-dialog";
import { CardFormDialog, type CardEndpoints } from "@/components/cards/card-form-dialog";
import { api, getApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TriviaCard } from "@/types";

interface CardListProps {
  cards: TriviaCard[];
  /** Row actions; omit for a read-only review list. */
  onEdit?: (card: TriviaCard) => void;
  onDelete?: (card: TriviaCard) => void;
}

/** Cards with their answers shown — the owner's view. */
export function CardList({ cards, onEdit, onDelete }: CardListProps) {
  return (
    <ol className="space-y-3">
      {cards.map((card, index) => (
        <li
          key={card.id}
          className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4 items-start"
        >
          <span className="text-white/40 text-sm font-medium w-6 shrink-0 pt-0.5">{index + 1}</span>
          {card.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageUrl}
              alt=""
              className="h-16 w-16 rounded-lg object-cover shrink-0 bg-white/10"
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            {card.text && <p className="text-white break-words">{card.text}</p>}
            {card.attribution && (
              <p className="text-white/40 text-xs break-words">Picture: {card.attribution}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {card.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === card.correctOptionIndex;
                return (
                  <span
                    key={optionIndex}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm",
                      isCorrect
                        ? "border-green-400 bg-green-500/10 text-green-300 font-bold"
                        : "border-white/10 text-white/60"
                    )}
                  >
                    {isCorrect && <Check className="h-3.5 w-3.5" aria-label="Correct answer" />}
                    {option}
                  </span>
                );
              })}
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1 shrink-0">
              {onEdit && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(card)}
                  aria-label={`Edit card ${index + 1}`}
                  className="text-white/60 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(card)}
                  aria-label={`Delete card ${index + 1}`}
                  className="text-white/60 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

interface CardManagerProps {
  cards: TriviaCard[];
  endpoints: CardEndpoints;
  /** Called after any add, edit or delete so the owner can refetch. */
  onChanged: () => void;
  /** Shown as "N of M needed" guidance. */
  minCards?: number;
  /** Where "From a document" leads; omit to hide it (campaigns do not have it). */
  generateHref?: string;
}

/**
 * The card editor shared by custom quizzes and brand campaigns: the card
 * format is identical, only the endpoints differ.
 */
export function CardManager({
  cards,
  endpoints,
  onChanged,
  minCards,
  generateHref,
}: CardManagerProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<TriviaCard | null>(null);
  const [deleting, setDeleting] = useState<TriviaCard | null>(null);

  const remove = useMutation({
    mutationFn: (cardId: string) => api.delete(endpoints.card(cardId)),
    onSuccess: () => {
      toast.success("Card deleted.");
      setDeleting(null);
      onChanged();
    },
    onError: (error) => {
      setDeleting(null);
      toast.error(getApiError(error)?.message || "Couldn't delete the card. Please try again.");
    },
  });

  const openForm = (card: TriviaCard | null) => {
    setEditing(card);
    setFormOpen(true);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white font-fredoka">Cards ({cards.length})</h2>
          {minCards !== undefined && cards.length < minCards && (
            <p className="text-yellow-300 text-sm">
              Add {minCards - cards.length} more to reach the minimum of {minCards}.
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {generateHref && (
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              <Link href={generateHref}>
                <Sparkles className="h-4 w-4 mr-2" />
                From a document
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <ListPlus className="h-4 w-4 mr-2" />
            Add many
          </Button>
          <Button
            type="button"
            onClick={() => openForm(null)}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add card
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="text-white/60 text-center py-10 rounded-xl border border-dashed border-white/10">
          No cards yet. Add your first one.
        </p>
      ) : (
        <CardList cards={cards} onEdit={openForm} onDelete={setDeleting} />
      )}

      <CardFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        card={editing}
        endpoints={endpoints}
        onSaved={onChanged}
      />
      <BulkAddDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        endpoint={endpoints.bulk}
        onSaved={onChanged}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this card?"
        description="This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}
