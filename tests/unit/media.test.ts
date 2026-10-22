/**
 * Unit tests: media.ts
 *
 * Covers:
 *  - formatBytes – all size ranges (B, KB, MB, GB)
 *  - getMediaKind – image, video, unknown
 *  - validateMediaFile – valid/invalid file types and sizes
 */

import { describe, it, expect } from "vitest";
import {
  formatBytes,
  getMediaKind,
  validateMediaFile,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/lib/media";

// ---------------------------------------------------------------------------
// Helper: create a fake File object
// ---------------------------------------------------------------------------

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

// ---------------------------------------------------------------------------
// formatBytes
// ---------------------------------------------------------------------------

describe("formatBytes", () => {
  it("formats bytes below 1024 as B", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("formats 1024 as 1.0 KB (toFixed(1) for values < 10KB)", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("formats kilobytes correctly", () => {
    expect(formatBytes(2048)).toBe("2.0 KB"); // < 10KB uses toFixed(1)
    expect(formatBytes(10240)).toBe("10 KB");  // >= 10KB uses toFixed(0)
  });

  it("formats megabytes correctly", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("formats gigabytes correctly", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.00 GB");
  });
});

// ---------------------------------------------------------------------------
// getMediaKind
// ---------------------------------------------------------------------------

describe("getMediaKind", () => {
  it("returns 'image' for image/jpeg", () => {
    expect(getMediaKind(makeFile("photo.jpg", "image/jpeg", 1))).toBe("image");
  });

  it("returns 'image' for image/png", () => {
    expect(getMediaKind(makeFile("photo.png", "image/png", 1))).toBe("image");
  });

  it("returns 'image' for image/webp", () => {
    expect(getMediaKind(makeFile("photo.webp", "image/webp", 1))).toBe("image");
  });

  it("returns 'video' for video/mp4", () => {
    expect(getMediaKind(makeFile("clip.mp4", "video/mp4", 1))).toBe("video");
  });

  it("returns 'video' for video/webm", () => {
    expect(getMediaKind(makeFile("clip.webm", "video/webm", 1))).toBe("video");
  });

  it("returns null for application/pdf", () => {
    expect(getMediaKind(makeFile("doc.pdf", "application/pdf", 1))).toBeNull();
  });

  it("returns null for text/plain", () => {
    expect(getMediaKind(makeFile("doc.txt", "text/plain", 1))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateMediaFile
// ---------------------------------------------------------------------------

describe("validateMediaFile – valid files", () => {
  it("accepts image within size limit", () => {
    const file = makeFile("photo.jpg", "image/jpeg", MAX_IMAGE_SIZE_BYTES);
    expect(validateMediaFile(file)).toBeNull();
  });

  it("accepts video within size limit", () => {
    const file = makeFile("clip.mp4", "video/mp4", MAX_VIDEO_SIZE_BYTES);
    expect(validateMediaFile(file)).toBeNull();
  });

  it("accepts 1-byte image", () => {
    const file = makeFile("tiny.png", "image/png", 1);
    expect(validateMediaFile(file)).toBeNull();
  });
});

describe("validateMediaFile – invalid files", () => {
  it("rejects non-media file type", () => {
    const file = makeFile("doc.pdf", "application/pdf", 100);
    expect(validateMediaFile(file)).toBeTruthy();
  });

  it("rejects image exceeding size limit", () => {
    const file = makeFile("huge.jpg", "image/jpeg", MAX_IMAGE_SIZE_BYTES + 1);
    const err = validateMediaFile(file);
    expect(err).toBeTruthy();
    expect(err!.toLowerCase()).toContain("image");
  });

  it("rejects video exceeding size limit", () => {
    const file = makeFile("huge.mp4", "video/mp4", MAX_VIDEO_SIZE_BYTES + 1);
    const err = validateMediaFile(file);
    expect(err).toBeTruthy();
    expect(err!.toLowerCase()).toContain("video");
  });

  it("error message for oversized image includes size info", () => {
    const file = makeFile("big.png", "image/png", MAX_IMAGE_SIZE_BYTES + 1024);
    const err = validateMediaFile(file);
    // Should mention both limit and actual size
    expect(err).toContain("MB");
  });
});
