"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/upload";
import type { AdminTriviaTopic } from "@/types";

interface TopicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The topic being edited; null to create one. */
  topic: AdminTriviaTopic | null;
  onSaved: (topicId: string) => void;
}

// Where the slider starts when a topic stops following the default.
const DEFAULT_IMAGE_PERCENT = 50;

export function TopicFormDialog({ open, onOpenChange, topic, onSaved }: TopicFormDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  // null: the topic follows the global picture share from Settings.
  const [imagePercent, setImagePercent] = useState<number | null>(null);
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(topic?.name ?? "");
    setDescription(topic?.description ?? "");
    setIsActive(topic?.isActive ?? true);
    setImagePercent(topic?.imagePercent ?? null);
    setImage(null);
  }, [open, topic]);

  const save = useMutation({
    mutationFn: async () => {
      const fields = {
        name: name.trim(),
        description: description.trim(),
        isActive,
        // Empty means "use the default".
        imagePercent: imagePercent ?? "",
      };
      // The cover travels as a file, so a new one means a multipart body.
      let body: FormData | typeof fields = fields;
      if (image) {
        body = new FormData();
        Object.entries(fields).forEach(([key, value]) =>
          (body as FormData).append(key, String(value))
        );
        body.append("image", image);
      }
      const res = topic
        ? await api.patch<{ topic: { id: string } }>(ENDPOINTS.ADMIN_TRIVIA_TOPIC(topic.id), body)
        : await api.post<{ topic: { id: string } }>(ENDPOINTS.ADMIN_TRIVIA_TOPICS, body);
      return res.data.topic?.id ?? topic?.id ?? "";
    },
    onSuccess: (topicId) => {
      toast.success(topic ? "Topic saved." : "Topic created.");
      onSaved(topicId);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(getApiError(err)?.message || "Couldn't save the topic. Please try again.");
    },
  });

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setImage(file);
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error("Give the topic a name.");
    save.mutate();
  };

  const inputClass = "bg-white/5 border-white/10 text-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-fredoka text-xl">
            {topic ? "Edit topic" : "New topic"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Players only see topics that are active and have cards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="topic-name" className="text-white/80">
              Name
            </Label>
            <Input
              id="topic-name"
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              placeholder="Football"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-description" className="text-white/80">
              Description (optional)
            </Label>
            <Textarea
              id="topic-description"
              value={description}
              maxLength={300}
              onChange={(event) => setDescription(event.target.value)}
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 text-white/80 text-sm h-9">
            <Checkbox
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            Active
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-white/80 text-sm font-medium">Picture questions</span>
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <Checkbox
                  checked={imagePercent === null}
                  onCheckedChange={(checked) =>
                    setImagePercent(checked === true ? null : DEFAULT_IMAGE_PERCENT)
                  }
                />
                Use the default
              </label>
            </div>
            {imagePercent === null ? (
              <p className="text-white/50 text-sm">
                This topic starts on the picture share set in Settings.
              </p>
            ) : (
              <>
                <Slider
                  aria-label="Picture questions"
                  min={0}
                  max={100}
                  step={5}
                  value={[imagePercent]}
                  onValueChange={([value]) => setImagePercent(value)}
                />
                <div className="flex justify-between text-sm text-white/70">
                  <span>{imagePercent}% pictures</span>
                  <span>{100 - imagePercent}% short definitions</span>
                </div>
                <p className="text-white/50 text-xs">
                  Where the players&apos; slider starts for this topic. They can change it.
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Cover image (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {topic?.coverImageUrl || image ? "Replace cover" : "Add cover"}
              </Button>
              <span className="text-white/50 text-sm break-all">
                {image ? image.name : topic?.coverImageUrl ? "Current cover kept" : "No cover"}
              </span>
            </div>
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
            {topic ? "Save topic" : "Create topic"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
