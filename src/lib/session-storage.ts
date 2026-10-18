/**
 * Thin, type-safe wrapper around `sessionStorage`.
 * Data persists for the lifetime of the browser tab (survives refresh,
 * lost on tab close).
 */

export function ssGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function ssSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private-browsing block — silently ignore
  }
}

export function ssRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
