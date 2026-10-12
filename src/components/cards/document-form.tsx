"use client";

import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const ACCEPT = ".pdf,.docx,.txt,.md";

/** What the cards are written from: an uploaded file, or pasted text. */
export interface DocumentSource {
  file: File | null;
  text: string;
  count: number;
}

/**
 * The body of a generate request: multipart when a file was chosen, JSON for pasted text.
 * `extra` fields (e.g. the topic) go along with either.
 */
export function documentRequestBody(source: DocumentSource, extra: Record<string, string> = {}) {
  if (!source.file) return { text: source.text, count: source.count, ...extra };
  const form = new FormData();
  form.append("document", source.file);
  form.append("count", String(source.count));
  for (const [key, value] of Object.entries(extra)) form.append(key, value);
  return form;
}

interface DocumentFormProps {
  count: { default: number; min: number; max: number };
  maxFileBytes: number;
  pending: boolean;
  disabled?: boolean;
  onSubmit: (source: DocumentSource) => void;
  /** Shown beside the button, e.g. the documents left today. */
  note?: ReactNode;
  children?: ReactNode;
}

/** Pick a document (or paste notes) and how many cards to write from it. */
export function DocumentForm({
  count,
  maxFileBytes,
  pending,
  disabled = false,
  onSubmit,
  note,
  children,
}: DocumentFormProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [chosenCount, setChosenCount] = useState<number | null>(null);
  const wanted = chosenCount ?? count.default;

  const handleSubmit = () => {
    if (!file && !pasted.trim()) {
      toast.error("Choose a document or paste your notes.");
      return;
    }
    if (file && file.size > maxFileBytes) {
      toast.error("The document is too large (maximum 10MB).");
      return;
    }
    onSubmit({ file, text: pasted, count: wanted });
  };

  return (
    <div className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="document" className="text-white/80">
          Document (PDF, Word or text, up to 10MB)
        </Label>
        <input
          ref={fileInput}
          id="document"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInput.current?.click()}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            {file ? "Change document" : "Choose document"}
          </Button>
          {file && (
            <span className="text-white text-sm inline-flex items-center gap-1 break-all">
              <FileText className="h-4 w-4 text-secondary shrink-0" />
              {file.name}
            </span>
          )}
        </div>
        <p className="text-white/50 text-xs">
          Scanned pages and photos of notes can&apos;t be read. Use a document with real text.
        </p>
      </div>

      {!file && (
        <div className="space-y-2">
          <Label htmlFor="pasted" className="text-white/80">
            Or paste your notes
          </Label>
          <Textarea
            id="pasted"
            rows={6}
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-white/80">Number of cards</Label>
          <span className="text-white font-fredoka">{wanted}</span>
        </div>
        <Slider
          aria-label="Number of cards"
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
          {pending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {pending ? "Writing your cards…" : "Write my cards"}
        </Button>
        {note}
      </div>
      {pending && (
        <p className="text-white/60 text-sm" role="status">
          This can take up to a minute. Keep this page open.
        </p>
      )}
      {children}
    </div>
  );
}
