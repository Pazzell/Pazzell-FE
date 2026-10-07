"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/api";
import { IMAGE_ACCEPT, uploadImage, validateImageFile, type UploadKind } from "@/lib/upload";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  kind?: UploadKind;
  label?: string;
  className?: string;
}

/** Picks an image, uploads it straight away and reports the resulting public URL. */
export function ImageUpload({
  value,
  onChange,
  kind = "cards",
  label = "Add image",
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadImage(file, kind));
    } catch (error) {
      toast.error(getApiError(error)?.message || "Couldn't upload the image. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {value ? (
        <div className="relative w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Selected image"
            className="max-h-40 rounded-xl border border-white/10 object-contain"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={() => onChange(null)}
            aria-label="Remove image"
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="border-white/20 text-white/80 hover:bg-white/10"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4 mr-2" />
        )}
        {value ? "Replace image" : label}
      </Button>
      <p className="text-white/40 text-xs">JPG, PNG or WEBP, up to 5 MB.</p>
    </div>
  );
}
