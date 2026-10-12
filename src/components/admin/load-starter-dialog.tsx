"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, CheckCircle2, Library, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { cn } from "@/lib/utils";
import type { StarterLoadResponse, StarterLoadResult, StarterTopicsResponse } from "@/types";

const questions = (count: number) => `${count} ${count === 1 ? "question" : "questions"}`;

interface LoadStarterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoaded: (result: StarterLoadResult) => void;
}

/**
 * Adds the server's built-in definition questions to their topics. Only the questions a
 * topic doesn't have yet are added, so loading again never creates duplicates.
 */
export function LoadStarterDialog({ open, onOpenChange, onLoaded }: LoadStarterDialogProps) {
  const queryClient = useQueryClient();
  // null until the admin changes the selection: every topic with something to add.
  const [picked, setPicked] = useState<string[] | null>(null);
  const [result, setResult] = useState<StarterLoadResult | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-starter-topics"],
    queryFn: () =>
      api.get<StarterTopicsResponse>(ENDPOINTS.ADMIN_TRIVIA_STARTER).then((res) => res.data.topics),
    enabled: open,
  });

  const topics = data ?? [];
  const selected = picked ?? topics.filter((t) => t.missing > 0).map((t) => t.slug);
  const toAdd = topics
    .filter((t) => selected.includes(t.slug))
    .reduce((sum, t) => sum + t.missing, 0);

  useEffect(() => {
    if (open) {
      setResult(null);
      setPicked(null);
    }
  }, [open]);

  const load = useMutation({
    mutationFn: (slugs: string[]) =>
      api
        .post<StarterLoadResponse>(ENDPOINTS.ADMIN_TRIVIA_STARTER, { slugs })
        .then((res) => res.data.loaded),
    onSuccess: (loaded) => {
      setResult(loaded);
      queryClient.invalidateQueries({ queryKey: ["admin-starter-topics"] });
      onLoaded(loaded);
    },
    onError: (err) => {
      toast.error(getApiError(err)?.message || "Couldn't load the questions. Please try again.");
    },
  });
  const loading = load.isPending;

  const toggle = (slug: string) =>
    setPicked(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]);

  const added = result ? result.topics.filter((t) => t.created > 0) : [];

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="bg-card border-white/10 max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-fredoka text-xl flex items-center gap-2">
            <Library className="h-5 w-5 text-secondary" />
            Load starter questions
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Adds the built-in text questions to their topics, creating a topic if it doesn&apos;t
            exist yet. Questions a topic already has are left alone. They are live for players
            straight away.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4" aria-live="polite">
            <p className="flex items-start gap-2 text-white">
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
              <span>
                {result.created > 0
                  ? `Added ${questions(result.created)} to ${added.length} ${
                      added.length === 1 ? "topic" : "topics"
                    }.`
                  : "Nothing to add: these topics already have every starter question."}
              </span>
            </p>
            {added.length > 0 && (
              <ul className="text-white/60 text-sm space-y-1">
                {added.map((topic) => (
                  <li key={topic.slug}>
                    {topic.name}: {questions(topic.created)}
                    {topic.topicCreated && " (new topic)"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          </div>
        ) : error ? (
          <div className="space-y-3 text-center py-4">
            <p className="text-white/70">Couldn&apos;t load the starter topics.</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Try again
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {topics.map((topic) => {
              const checked = selected.includes(topic.slug);
              const complete = topic.missing === 0;
              return (
                <li key={topic.slug}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={topic.name}
                    disabled={loading || complete}
                    onClick={() => toggle(topic.slug)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 flex items-center gap-3 text-left transition-colors",
                      checked ? "border-secondary bg-secondary/10" : "border-white/10",
                      complete ? "opacity-60" : "hover:border-white/30"
                    )}
                  >
                    <span
                      className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center shrink-0",
                        checked ? "border-secondary bg-secondary text-secondary-foreground" : "border-white/30"
                      )}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-white text-sm font-semibold break-words">
                        {topic.name}
                      </span>
                      <span className="block text-white/50 text-xs">
                        {complete
                          ? `All ${questions(topic.total)} loaded`
                          : topic.missing === topic.total
                            ? `${questions(topic.total)} to add`
                            : `${topic.missing} of ${questions(topic.total)} to add`}
                        {!topic.topicId && " · creates the topic"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          {result ? (
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => load.mutate(selected)}
                disabled={loading || selected.length === 0}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Library className="h-4 w-4 mr-2" />
                )}
                {loading ? "Loading" : toAdd > 0 ? `Add ${questions(toAdd)}` : "Add questions"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
