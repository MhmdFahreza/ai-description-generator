export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export type MediaKind = "image" | "video";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function getMediaKind(file: File): MediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

/**
 * Returns an error message if the file isn't a usable image/video,
 * or null if it's fine to use. Limits are generous defaults since none
 * were specified — tweak MAX_IMAGE_SIZE_BYTES / MAX_VIDEO_SIZE_BYTES above
 * if you want them tighter or looser.
 */
export function validateMediaFile(file: File): string | null {
  const kind = getMediaKind(file);
  if (!kind) return "File must be an image or video.";

  if (kind === "image" && file.size > MAX_IMAGE_SIZE_BYTES) {
    return `Image size limit is ${formatBytes(MAX_IMAGE_SIZE_BYTES)}. Your file is ${formatBytes(file.size)}.`;
  }
  if (kind === "video" && file.size > MAX_VIDEO_SIZE_BYTES) {
    return `Video size limit is ${formatBytes(MAX_VIDEO_SIZE_BYTES)}. Your file is ${formatBytes(file.size)}.`;
  }
  return null;
}
