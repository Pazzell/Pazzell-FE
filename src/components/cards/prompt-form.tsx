"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

/** What the AI is asked to write: a description of the questions, and how many. */
export interface PromptSource {
  prompt: string;
  count: number;
}

/** "50 questions about…" sets the number of cards to 50, when that is allowed. */
export function countInPrompt(prompt: string, max: number): number | null {
  const match = prompt.match(/\b(\d{1,3})\s+(?:\w+\s+)?(?:questions?|cards?)\b/i);
  if (!match) return null;
  const count = Number(match[1]);
  return count >= 1 && count <= max ? count : null;
}

interface PromptFormProps {
  maxLength: number;
  count: { default: number; min: number; max: number };
  pending: boolean;
  disabled?: boolean;
  onSubmit: (source: PromptSource) => void;
  /** Shown beside the button, e.g. the generations left today. */
  note?: ReactNode;
  children?: ReactNode;
}

/** Describe the questions you want and the AI writes them from its own knowledge. */
export function PromptForm({ maxLength, count, pending, disabled = false, onSubmit, note, children }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [chosenCount, setChosenCount] = useState<number | null>(null);
  const wanted = chosenCount ?? count.default;

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    const asked = countInPrompt(value, count.max);
    if (asked !== null) setChosenCount(asked);
  };

  const handleSubmit = () => {
    if (!prompt.trim()) {
      toast.error("Describe the questions you want.");
      return;
    }
    onSubmit({ prompt: prompt.trim(), count: wanted });
  };

  return (
    <div className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ai-prompt" className="text-white/80">
          What should the questions be about?
        </Label>
        <Textarea
          id="ai-prompt"
          rows={4}
          value={prompt}
          maxLength={maxLength}
          onChange={(event) => handlePromptChange(event.target.value)}
          placeholder="e.g. Generate 50 questions about the solar system, for secondary school students"
          className="bg-white/5 border-white/10 text-white"
        />
        <p className="text-white/50 text-xs">
          Say the subject, and anything about the level or the kind of question. You review every
          question before it is saved.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-white/80">Number of questions</Label>
          <span className="text-white font-fredoka">{wanted}</span>
        </div>
        <Slider
          aria-label="Number of questions"
          min={count.min}
          max={count.max}
          step={1}
          value={[wanted]}
          onValueChange={([v]) => setChosenCount(v)}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={pending || disabled}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
        >
          {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {pending ? "Writing your questions…" : "Write my questions"}
        </Button>
        {note}
      </div>
      {pending && (
        <p className="text-white/60 text-sm" role="status">
          This can take a minute or two, as every answer is double-checked. Keep this page open.
        </p>
      )}
      {children}
    </div>
  );
}
