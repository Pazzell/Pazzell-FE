"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { useGameSettings } from "@/hooks/use-game-settings";
import { timerLabel } from "@/lib/timer";
import type { CustomQuiz } from "@/types";

export interface QuizDetailsValues {
  title: string;
  description: string;
  coverImageUrl: string | null;
  defaultTimerSeconds: number;
  defaultCardCount: number;
}

interface QuizDetailsFormProps {
  quiz?: CustomQuiz;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: QuizDetailsValues) => void;
}

export function QuizDetailsForm({ quiz, submitLabel, pending, onSubmit }: QuizDetailsFormProps) {
  const { settings } = useGameSettings();
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(quiz?.coverImageUrl ?? null);
  const [timerSeconds, setTimerSeconds] = useState(
    quiz?.defaultTimerSeconds ?? settings.timer.defaultSeconds
  );
  const [cardCount, setCardCount] = useState(
    quiz?.defaultCardCount ?? settings.customQuiz.minCardsToPublish
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Give your quiz a title.");
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      coverImageUrl,
      defaultTimerSeconds: timerSeconds,
      defaultCardCount: cardCount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="quiz-title" className="text-white/80">
          Title
        </Label>
        <Input
          id="quiz-title"
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Capital cities"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quiz-description" className="text-white/80">
          Description (optional)
        </Label>
        <Textarea
          id="quiz-description"
          value={description}
          maxLength={300}
          onChange={(event) => setDescription(event.target.value)}
          className="bg-white/5 border-white/10 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Cover image (optional)</Label>
        <ImageUpload
          value={coverImageUrl}
          onChange={(url) => setCoverImageUrl(url ?? quiz?.coverImageUrl ?? null)}
          kind="covers"
          label="Add cover"
          allowRemove={coverImageUrl !== (quiz?.coverImageUrl ?? null)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white/80">Default time per question</Label>
            <span className="text-white font-fredoka">{timerLabel(timerSeconds)}</span>
          </div>
          <Slider
            aria-label="Default time per question"
            min={settings.timer.minSeconds}
            max={settings.timer.maxSeconds}
            step={1}
            value={[timerSeconds]}
            onValueChange={([v]) => setTimerSeconds(v)}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white/80">Default number of cards</Label>
            <span className="text-white font-fredoka">{cardCount}</span>
          </div>
          <Slider
            aria-label="Default number of cards"
            min={1}
            max={settings.trivia.maxCards}
            step={1}
            value={[cardCount]}
            onValueChange={([v]) => setCardCount(v)}
          />
        </div>
      </div>
      <p className="text-white/50 text-xs">
        Players who open your link start with these defaults and can change them.
      </p>

      <Button
        type="submit"
        disabled={pending}
        className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
      >
        {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
