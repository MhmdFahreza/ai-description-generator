export const MAX_IMAGE_SIZE_BYTES = 500 * 1024; // 500KB

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Returns an error message if the file isn't a valid product image,
 * or null if it's fine to use.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "File harus berupa gambar (JPG, PNG, dll).";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `Ukuran gambar maksimal 500KB. File kamu ${formatBytes(file.size)}.`;
  }
  return null;
}