"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, DownloadCloud, Loader2 } from "lucide-react";
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
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { cn } from "@/lib/utils";
import type {
  ImportCardsResponse,
  ImportCardsResult,
  ImportCategoriesResponse,
} from "@/types";

const DEFAULT_COUNT = 20;

// The two country choices that are not a single country.
const COUNTRY_LABELS: Record<string, string> = {
  mixed: "Mixed: Nigerian and worldwide",
  worldwide: "Worldwide only",
};

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const SKIP_LABELS: Record<keyof ImportCardsResult["skipped"], string> = {
  unusableLicense: "picture not under a free licence",
  imageFailed: "picture could not be downloaded",
  noWrongOption: "no second option could be found",
};

interface ImportCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Import into this topic. Without it the cards go to the category's own topic. */
  topic?: { id: string; name: string };
  onImported: (result: ImportCardsResult) => void;
}

/**
 * Fetches image cards for a category from Wikidata and Wikimedia Commons (done by the
 * server) and adds them to a topic. The request only answers once the import is done.
 */
export function ImportCardsDialog({ open, onOpenChange, topic, onImported }: ImportCardsDialogProps) {
  const [category, setCategory] = useState("");
  const [count, setCount] = useState(String(DEFAULT_COUNT));
  const [country, setCountry] = useState("mixed");
  const [result, setResult] = useState<ImportCardsResult | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-import-categories"],
    queryFn: () =>
      api
        .get<ImportCategoriesResponse>(ENDPOINTS.ADMIN_TRIVIA_IMPORT_CATEGORIES)
        .then((res) => res.data),
    enabled: open,
    staleTime: Infinity,
  });

  const categories = data?.categories ?? [];
  const maxCount = data?.maxCount ?? 50;
  const selected = categories.find((c) => c.key === category);

  useEffect(() => {
    if (open) setResult(null);
  }, [open]);

  useEffect(() => {
    const first = data?.categories[0];
    if (!category && first) setCategory(first.key);
  }, [category, data]);

  const runImport = useMutation({
    mutationFn: (body: { category: string; count: number; topicId?: string; country?: string }) =>
      api.post<ImportCardsResponse>(ENDPOINTS.ADMIN_TRIVIA_IMPORT, body).then((res) => res.data.import),
    onSuccess: (imported) => {
      setResult(imported);
      onImported(imported);
    },
    onError: (err) => {
      const body = getApiError(err);
      toast.error(
        body?.code === "IMPORT_SOURCE_UNAVAILABLE"
          ? "The picture source is not answering right now. Please try again in a few minutes."
          : body?.message || "The import didn't finish. Please try again."
      );
    },
  });
  const importing = runImport.isPending;

  const handleImport = () => {
    const wanted = Number(count);
    if (!selected) return toast.error("Pick a category.");
    if (!Number.isInteger(wanted) || wanted < 1 || wanted > maxCount) {
      return toast.error(`Choose how many cards to add, from 1 to ${maxCount}.`);
    }
    runImport.mutate({
      category: selected.key,
      count: wanted,
      ...(topic ? { topicId: topic.id } : {}),
      ...(selected.supportsCountry ? { country } : {}),
    });
  };

  const skipped = result
    ? (Object.keys(SKIP_LABELS) as (keyof ImportCardsResult["skipped"])[]).filter(
        (key) => result.skipped?.[key] > 0
      )
    : [];

  return (
    <Dialog
      open={open}
      // The server keeps working after the dialog closes, so don't let it close mid-import.
      onOpenChange={(next) => !importing && onOpenChange(next)}
    >
      <DialogContent className="bg-card border-white/10 max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-fredoka text-xl flex items-center gap-2">
            <DownloadCloud className="h-5 w-5 text-secondary" />
            Import image cards
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Fetches the best-known entries of a category, each with a freely licensed picture,
            and adds them as image cards with two options. They are live for players straight
            away.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4" aria-live="polite">
            <p className="flex items-start gap-2 text-white">
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
              <span>
                Added {result.created} of {result.requested} cards to{" "}
                <span className="font-semibold">{result.topic.name}</span>.
              </span>
            </p>
            {skipped.length > 0 && (
              <ul className="text-white/60 text-sm space-y-1">
                {skipped.map((key) => (
                  <li key={key}>
                    {result.skipped[key]} skipped: {SKIP_LABELS[key]}
                  </li>
                ))}
              </ul>
            )}
            {result.created < result.requested && skipped.length === 0 && (
              <p className="text-white/60 text-sm">
                There were no more entries to fetch for this choice.
              </p>
            )}
            <p className="text-white/50 text-xs">
              Imported cards are ordinary cards: review, edit or delete them on the topic page.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
          </div>
        ) : error ? (
          <div className="space-y-3 text-center py-4">
            <p className="text-white/70">Couldn&apos;t load the import categories.</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-white/80">Category</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
                {categories.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    role="radio"
                    aria-checked={category === option.key}
                    disabled={importing}
                    onClick={() => setCategory(option.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      category === option.key
                        ? "border-secondary bg-secondary/10 text-white"
                        : "border-white/10 text-white/60 hover:border-white/30"
                    )}
                  >
                    {titleCase(option.key)}
                  </button>
                ))}
              </div>
            </div>

            {selected?.supportsCountry && (
              <div className="space-y-2">
                <Label htmlFor="import-country" className="text-white/80">
                  People from
                </Label>
                <select
                  id="import-country"
                  value={country}
                  disabled={importing}
                  onChange={(event) => setCountry(event.target.value)}
                  className="h-9 w-full rounded-md border border-white/10 bg-background px-3 text-sm text-white"
                >
                  {(data?.countries ?? []).map((value) => (
                    <option key={value} value={value}>
                      {COUNTRY_LABELS[value] ?? titleCase(value)}
                    </option>
                  ))}
                </select>
                {(country === "mixed" || country === "worldwide") && (
                  <p className="text-white/50 text-xs">This choice can take up to a minute.</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="import-count" className="text-white/80">
                How many cards (1 to {maxCount})
              </Label>
              <Input
                id="import-count"
                inputMode="numeric"
                value={count}
                disabled={importing}
                onChange={(event) => setCount(event.target.value)}
                className="bg-white/5 border-white/10 text-white w-28"
              />
              <p className="text-white/50 text-xs">
                Each import continues after the entries already fetched, most famous first.
              </p>
            </div>

            <p className="text-white/70 text-sm">
              {topic ? (
                <>
                  Cards are added to <span className="font-semibold text-white">{topic.name}</span>.
                </>
              ) : selected ? (
                <>
                  Cards are added to the{" "}
                  <span className="font-semibold text-white">{selected.topicName}</span> topic,
                  which is created if it doesn&apos;t exist yet.
                </>
              ) : null}
            </p>

            {importing && (
              <p className="flex items-center gap-2 text-secondary text-sm" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching pictures. Keep this open; it finishes on its own.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <>
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                Import more
              </Button>
              {!topic && (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 text-white/80 hover:bg-white/10"
                >
                  <Link href={routes.ADMIN.TOPIC(result.topic.id)}>Open topic</Link>
                </Button>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={importing}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || !selected}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DownloadCloud className="h-4 w-4 mr-2" />
                )}
                {importing ? "Importing" : "Import cards"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
