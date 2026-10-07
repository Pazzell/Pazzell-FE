"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { cn } from "@/lib/utils";
import type {
  MatchCategoryPool,
  MatchLevelConfig,
  MatchSimilarity,
  MatchVariant,
} from "@/types";

const CATEGORIES: { id: MatchCategoryPool; label: string }[] = [
  { id: "shapes", label: "Shapes" },
  { id: "colors", label: "Colours" },
  { id: "colored_shapes", label: "Coloured shapes" },
  { id: "letters_upper", label: "Capital letters" },
  { id: "letters_lower", label: "Small letters" },
  { id: "numbers", label: "Numbers" },
  { id: "figures", label: "Figures" },
];

const SIMILARITIES: { id: MatchSimilarity; label: string; hint: string }[] = [
  { id: "low", label: "Low", hint: "Other artifacts of the same kind" },
  { id: "medium", label: "Medium", hint: "Commonly confused ones first (circle/oval, 6/9)" },
  { id: "high", label: "High", hint: "Rotated or mirrored copies and close siblings first" },
];

const VARIANTS: { id: MatchVariant; label: string }[] = [
  { id: "rotation", label: "Rotated look-alikes" },
  { id: "mirror", label: "Mirrored look-alikes" },
];

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 9;

const categoryLabel = (id: MatchCategoryPool) =>
  CATEGORIES.find((category) => category.id === id)?.label ?? id;

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        selected
          ? "border-secondary bg-secondary/10 text-white"
          : "border-white/10 text-white/60 hover:border-white/30"
      )}
    >
      {children}
    </button>
  );
}

interface LevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The level being edited; null to add one. */
  level: MatchLevelConfig | null;
  nextLevelNumber: number;
  onSaved: () => void;
}

function LevelDialog({ open, onOpenChange, level, nextLevelNumber, onSaved }: LevelDialogProps) {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [optionCount, setOptionCount] = useState("");
  const [categories, setCategories] = useState<MatchCategoryPool[]>([]);
  const [similarity, setSimilarity] = useState<MatchSimilarity>("low");
  const [variants, setVariants] = useState<MatchVariant[]>([]);
  const [dotCountTargets, setDotCountTargets] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    setNumber(String(level?.level ?? nextLevelNumber));
    setName(level?.name ?? "");
    setOrder(level?.order !== undefined ? String(level.order) : "");
    setQuestionCount(String(level?.questionCount ?? 3));
    setOptionCount(String(level?.optionCount ?? 2));
    setCategories(level?.categories ?? ["shapes"]);
    setSimilarity(level?.similarity ?? "low");
    setVariants(level?.variants ?? []);
    setDotCountTargets(level?.dotCountTargets ?? false);
    setIsActive(level?.isActive ?? true);
  }, [open, level, nextLevelNumber]);

  const save = useMutation({
    // A level has no timer: the player picks one per attempt, so none is ever sent.
    mutationFn: (payload: { level: number; body: Omit<MatchLevelConfig, "level"> }) =>
      api.put(ENDPOINTS.ADMIN_MATCH_LEVEL(payload.level), payload.body),
    onSuccess: () => {
      toast.success(level ? "Level saved." : "Level added.");
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getApiError(err)?.message || "Couldn't save the level. Please try again.");
    },
  });

  const handleSave = () => {
    const levelNumber = Number(number);
    const questions = Number(questionCount);
    const options = Number(optionCount);
    const orderValue = order.trim() === "" ? undefined : Number(order);

    if (!Number.isInteger(levelNumber) || levelNumber < 1) {
      return toast.error("The level number must be a whole number, 1 or more.");
    }
    if (!Number.isInteger(questions) || questions < 1) {
      return toast.error("A level needs at least 1 question.");
    }
    if (!Number.isInteger(options) || options < MIN_OPTIONS || options > MAX_OPTIONS) {
      return toast.error(`Options per question must be ${MIN_OPTIONS} to ${MAX_OPTIONS}.`);
    }
    if (orderValue !== undefined && !Number.isInteger(orderValue)) {
      return toast.error("The play order must be a whole number.");
    }
    if (categories.length === 0) {
      return toast.error("Pick at least one category.");
    }

    save.mutate({
      level: levelNumber,
      body: {
        questionCount: questions,
        optionCount: options,
        categories,
        similarity,
        variants,
        dotCountTargets,
        isActive,
        ...(orderValue !== undefined ? { order: orderValue } : {}),
        ...(name.trim() ? { name: name.trim() } : {}),
      },
    });
  };

  const inputClass = "bg-white/5 border-white/10 text-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-fredoka text-xl">
            {level ? `Edit level ${level.level}` : "Add a level"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Difficulty comes only from these settings. Levels have no timer; the player chooses
            one before each attempt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level-number" className="text-white/80">
                Level number
              </Label>
              <Input
                id="level-number"
                inputMode="numeric"
                value={number}
                disabled={level !== null}
                onChange={(event) => setNumber(event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level-order" className="text-white/80">
                Play order (optional)
              </Label>
              <Input
                id="level-order"
                inputMode="numeric"
                value={order}
                placeholder="Same as level"
                onChange={(event) => setOrder(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level-name" className="text-white/80">
              Name (optional)
            </Label>
            <Input
              id="level-name"
              value={name}
              placeholder="First shapes"
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level-questions" className="text-white/80">
                Questions
              </Label>
              <Input
                id="level-questions"
                inputMode="numeric"
                value={questionCount}
                onChange={(event) => setQuestionCount(event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level-options" className="text-white/80">
                Options per question ({MIN_OPTIONS}–{MAX_OPTIONS})
              </Label>
              <Input
                id="level-options"
                inputMode="numeric"
                value={optionCount}
                onChange={(event) => setOptionCount(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Categories</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Chip
                  key={category.id}
                  selected={categories.includes(category.id)}
                  onClick={() => setCategories(toggle(categories, category.id))}
                >
                  {category.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">How alike the wrong options are</Label>
            <div className="flex flex-wrap gap-2">
              {SIMILARITIES.map((option) => (
                <Chip
                  key={option.id}
                  selected={similarity === option.id}
                  onClick={() => setSimilarity(option.id)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
            <p className="text-white/50 text-xs">
              {SIMILARITIES.find((option) => option.id === similarity)?.hint}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Extras</Label>
            <div className="flex flex-wrap gap-2">
              {VARIANTS.map((variant) => (
                <Chip
                  key={variant.id}
                  selected={variants.includes(variant.id)}
                  onClick={() => setVariants(toggle(variants, variant.id))}
                >
                  {variant.label}
                </Chip>
              ))}
              <Chip selected={dotCountTargets} onClick={() => setDotCountTargets(!dotCountTargets)}>
                Count the dots
              </Chip>
              <Chip selected={isActive} onClick={() => setIsActive(!isActive)}>
                Active
              </Chip>
            </div>
            <p className="text-white/50 text-xs">
              &quot;Count the dots&quot; shows a group of dots as the target and numerals as the
              options.
            </p>
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
            {level ? "Save level" : "Add level"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminMatchLevelsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MatchLevelConfig | null>(null);
  const [deleting, setDeleting] = useState<MatchLevelConfig | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-match-levels"],
    queryFn: () =>
      api
        .get<{ levels: MatchLevelConfig[] }>(ENDPOINTS.ADMIN_MATCH_LEVELS)
        .then((res) => res.data.levels),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-match-levels"] });
    queryClient.invalidateQueries({ queryKey: ["match-levels"] });
  };

  const remove = useMutation({
    mutationFn: (level: number) => api.delete(ENDPOINTS.ADMIN_MATCH_LEVEL(level)),
    onSuccess: () => {
      toast.success("Level removed.");
      setDeleting(null);
      refresh();
    },
    onError: (err) => {
      setDeleting(null);
      toast.error(getApiError(err)?.message || "Couldn't remove the level. Please try again.");
    },
  });

  const levels = [...(data ?? [])].sort(
    (a, b) => (a.order ?? a.level) - (b.order ?? b.level)
  );
  const nextLevelNumber = levels.reduce((highest, level) => Math.max(highest, level.level), 0) + 1;

  const openDialog = (level: MatchLevelConfig | null) => {
    setEditing(level);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka">Match Levels</h1>
          <p className="text-white/70">What each Match level asks and how hard it is</p>
        </div>
        <Button
          onClick={() => openDialog(null)}
          disabled={!data}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Level
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <PageError
          title="Couldn't load the levels"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
          withLayout={false}
        />
      )}

      {data && (
        <ul className="space-y-3">
          {levels.map((level) => (
            <li
              key={level.level}
              className={cn(
                "rounded-2xl border border-white/10 bg-card/50 p-5 flex items-center gap-4 flex-wrap",
                level.isActive === false && "opacity-60"
              )}
            >
              <span className="h-12 w-12 rounded-xl bg-secondary/20 text-secondary font-fredoka font-bold text-xl flex items-center justify-center shrink-0">
                {level.level}
              </span>
              <div className="flex-1 min-w-[12rem] space-y-1">
                <p className="text-white font-semibold">
                  {level.name || `Level ${level.level}`}
                  {level.isActive === false && (
                    <span className="text-white/50 font-normal text-sm"> · inactive</span>
                  )}
                </p>
                <p className="text-white/60 text-sm">
                  {level.questionCount} questions · {level.optionCount} options ·{" "}
                  {level.similarity ?? "low"} similarity
                </p>
                <p className="text-white/50 text-sm">
                  {[
                    ...level.categories.map(categoryLabel),
                    ...(level.variants ?? []).map((variant) =>
                      variant === "rotation" ? "rotated" : "mirrored"
                    ),
                    ...(level.dotCountTargets ? ["count the dots"] : []),
                  ].join(", ")}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openDialog(level)}
                  aria-label={`Edit level ${level.level}`}
                  className="text-white/60 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleting(level)}
                  disabled={levels.length <= 1}
                  aria-label={`Remove level ${level.level}`}
                  className="text-white/60 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LevelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        level={editing}
        nextLevelNumber={nextLevelNumber}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Remove level ${deleting?.level ?? ""}?`}
        description="Players will no longer see this level. This can't be undone."
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.level)}
      />
    </div>
  );
}
