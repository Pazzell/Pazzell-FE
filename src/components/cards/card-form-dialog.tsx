"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { api, getApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TriviaCard, TriviaCardInput } from "@/types";

export const CARD_TEXT_MAX = 300;
export const CARD_OPTION_MAX = 80;

export interface CardEndpoints {
  create: string;
  bulk: string;
  card: (cardId: string) => string;
}

/** Returns a message when the card breaks the card format rules, otherwise null. */
export function validateCard(card: TriviaCardInput): string | null {
  const text = card.text?.trim() ?? "";
  const [a, b] = card.options.map((option) => option.trim());
  if (card.type === "definition" && !text) return "Add the question or definition text.";
  if (card.type === "image" && !card.imageUrl) return "Add an image for this card.";
  if (text.length > CARD_TEXT_MAX) return `Text can be at most ${CARD_TEXT_MAX} characters.`;
  if (!a || !b) return "Fill in both options.";
  if (a.toLowerCase() === b.toLowerCase()) return "The two options must be different.";
  if (a.length > CARD_OPTION_MAX || b.length > CARD_OPTION_MAX) {
    return `Options can be at most ${CARD_OPTION_MAX} characters.`;
  }
  return null;
}

interface CardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The card being edited; omit to add a new one. */
  card?: TriviaCard | null;
  endpoints: CardEndpoints;
  onSaved: () => void;
}

export function CardFormDialog({ open, onOpenChange, card, endpoints, onSaved }: CardFormDialogProps) {
  const [type, setType] = useState<TriviaCardInput["type"]>("definition");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<[string, string]>(["", ""]);
  const [correct, setCorrect] = useState<0 | 1>(0);

  useEffect(() => {
    if (!open) return;
    setType(card?.type ?? "definition");
    setText(card?.text ?? "");
    setImageUrl(card?.imageUrl ?? null);
    setOptions(card ? [card.options[0], card.options[1]] : ["", ""]);
    setCorrect(card?.correctOptionIndex ?? 0);
  }, [open, card]);

  const save = useMutation({
    mutationFn: (input: TriviaCardInput) =>
      card ? api.patch(endpoints.card(card.id), input) : api.post(endpoints.create, input),
    onSuccess: () => {
      toast.success(card ? "Card updated." : "Card added.");
      onSaved();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getApiError(error)?.message || "Couldn't save the card. Please try again.");
    },
  });

  const handleSave = () => {
    const input: TriviaCardInput = {
      type,
      text: text.trim(),
      options: [options[0].trim(), options[1].trim()],
      correctOptionIndex: correct,
      ...(type === "image" && imageUrl ? { imageUrl } : {}),
    };
    const problem = validateCard(input);
    // The API takes an image URL only from the uploader's own fresh upload, and keeps the
    // stored image when none is sent — so an unchanged image must not be sent back.
    if (card && input.imageUrl === card.imageUrl) delete input.imageUrl;
    if (problem) {
      toast.error(problem);
      return;
    }
    save.mutate(input);
  };

  const setOption = (index: 0 | 1, value: string) => {
    setOptions(index === 0 ? [value, options[1]] : [options[0], value]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-fredoka text-xl">
            {card ? "Edit card" : "Add a card"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            A card is a question with two options, one of them correct.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Card type">
            {(["definition", "image"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                  type === value
                    ? "border-secondary bg-secondary/10 text-white"
                    : "border-white/10 text-white/60 hover:border-white/30"
                )}
              >
                {value === "definition" ? "Text" : "Image"}
              </button>
            ))}
          </div>

          {type === "image" && <ImageUpload value={imageUrl} onChange={setImageUrl} kind="cards" />}

          <div className="space-y-2">
            <Label htmlFor="card-text" className="text-white/80">
              {type === "image" ? "Caption (optional)" : "Question or definition"}
            </Label>
            <Textarea
              id="card-text"
              value={text}
              maxLength={CARD_TEXT_MAX}
              onChange={(event) => setText(event.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
            <p className="text-white/40 text-xs text-right">
              {text.length}/{CARD_TEXT_MAX}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Options — tick the correct one</Label>
            {([0, 1] as const).map((index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={correct === index}
                  aria-label={`Mark option ${index + 1} as correct`}
                  onClick={() => setCorrect(index)}
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full border flex items-center justify-center transition-colors",
                    correct === index
                      ? "border-green-400 bg-green-500/20 text-green-400"
                      : "border-white/20 text-transparent hover:border-white/40"
                  )}
                >
                  <Check className="h-4 w-4" />
                </button>
                <Input
                  value={options[index]}
                  maxLength={CARD_OPTION_MAX}
                  placeholder={`Option ${index + 1}`}
                  aria-label={`Option ${index + 1}`}
                  onChange={(event) => setOption(index, event.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            ))}
          </div>
        </div>

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
            {card ? "Save card" : "Add card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
