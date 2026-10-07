"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, getApiError } from "@/lib/api";
import { validateCard } from "@/components/cards/card-form-dialog";
import type { TriviaCardInput } from "@/types";

const MAX_BULK_CARDS = 100;

/**
 * Parses one text card per line: `question | correct option | other option`.
 * Returns the cards, or the first problem found with its line number.
 */
export function parseBulkCards(
  raw: string
): { cards: TriviaCardInput[]; error: null } | { cards: null; error: string } {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { cards: null, error: "Add at least one card." };
  if (lines.length > MAX_BULK_CARDS) {
    return { cards: null, error: `You can add up to ${MAX_BULK_CARDS} cards at a time.` };
  }

  const cards: TriviaCardInput[] = [];
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split("|").map((part) => part.trim());
    if (parts.length !== 3) {
      return { cards: null, error: `Line ${i + 1}: use "question | correct option | other option".` };
    }
    const card: TriviaCardInput = {
      type: "definition",
      text: parts[0],
      options: [parts[1], parts[2]],
      correctOptionIndex: 0,
    };
    const problem = validateCard(card);
    if (problem) return { cards: null, error: `Line ${i + 1}: ${problem}` };
    cards.push(card);
  }
  return { cards, error: null };
}

interface BulkAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: string;
  onSaved: () => void;
}

export function BulkAddDialog({ open, onOpenChange, endpoint, onSaved }: BulkAddDialogProps) {
  const [raw, setRaw] = useState("");

  const save = useMutation({
    mutationFn: (cards: TriviaCardInput[]) => api.post(endpoint, { cards }),
    onSuccess: (_data, cards) => {
      toast.success(`${cards.length} ${cards.length === 1 ? "card" : "cards"} added.`);
      setRaw("");
      onSaved();
      onOpenChange(false);
    },
    // All or nothing: the server names the offending row in its message.
    onError: (error) => {
      toast.error(getApiError(error)?.message || "Couldn't add the cards. Please try again.");
    },
  });

  const handleSave = () => {
    const parsed = parseBulkCards(raw);
    if (parsed.error !== null) {
      toast.error(parsed.error);
      return;
    }
    save.mutate(parsed.cards);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white font-fredoka text-xl">Add many cards</DialogTitle>
          <DialogDescription className="text-white/70">
            One text card per line, written as{" "}
            <code className="text-white">question | correct option | other option</code>. The
            options are shuffled when the quiz is played. Image cards are added one at a time.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          rows={8}
          aria-label="Cards, one per line"
          placeholder={"Capital of Nigeria | Abuja | Lagos\nLargest planet | Jupiter | Saturn"}
          className="bg-white/5 border-white/10 text-white font-mono text-sm"
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={save.isPending}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add cards
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
