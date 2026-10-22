export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, options);

  const remainingDaily = res.headers.get("X-RateLimit-Remaining-Daily");
  const remainingMinute = res.headers.get("X-RateLimit-Remaining-Minute");
  const resetAtHeader = res.headers.get("X-RateLimit-Reset");

  if (typeof window !== "undefined") {
    const resetAt = resetAtHeader ? parseInt(resetAtHeader, 10) : undefined;

    if (remainingDaily !== null || remainingMinute !== null) {
      window.dispatchEvent(
        new CustomEvent("rateLimitUpdated", {
          detail: {
            remainingDaily:
              remainingDaily !== null ? parseInt(remainingDaily, 10) : undefined,
            remainingMinute:
              remainingMinute !== null ? parseInt(remainingMinute, 10) : undefined,
            resetAt,
          },
        })
      );
    }

    if (res.status === 429) {
      const reasonHeader = res.headers.get("X-RateLimit-Reason");
      const retryAfterHeader = res.headers.get("Retry-After");
      const retryAfterSeconds = retryAfterHeader
        ? parseInt(retryAfterHeader, 10)
        : 60;

      let reason = reasonHeader as "minute" | "daily" | null;
      if (!reason) {
        reason = retryAfterSeconds > 0 ? "minute" : "daily";
      }

      window.dispatchEvent(
        new CustomEvent("rateLimitExceeded", {
          detail: {
            reason,
            retryAfterSeconds,
            resetAt,
          },
        })
      );
    }
  }

  return res;
}
