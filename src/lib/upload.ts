import { api } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type { UploadImageResponse } from "@/types";

export type UploadKind = "cards" | "covers" | "logos";

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Returns a message when the file can't be uploaded, otherwise null. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
    return "Please choose a JPG, PNG or WEBP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Images must be 5 MB or smaller.";
  }
  return null;
}

/** Uploads an image and returns its public URL, usable as imageUrl/coverImageUrl/logoUrl. */
export async function uploadImage(file: File, kind: UploadKind = "cards"): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("kind", kind);
  const { data } = await api.post<UploadImageResponse>(ENDPOINTS.UPLOAD_IMAGE, formData);
  return data.image.url;
}
