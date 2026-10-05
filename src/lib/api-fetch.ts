export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, options);

  const remainingDaily = res.headers.get("X-RateLimit-Remaining-Daily");
  const remainingMinute = res.headers.get("X-RateLimit-Remaining-Minute");

  if (typeof window !== "undefined") {
    if (remainingDaily !== null || remainingMinute !== null) {
      window.dispatchEvent(
        new CustomEvent("rateLimitUpdated", {
          detail: {
            remainingDaily: remainingDaily ? parseInt(remainingDaily, 10) : undefined,
            remainingMinute: remainingMinute ? parseInt(remainingMinute, 10) : undefined,
          },
        })
      );
    }

    if (res.status === 429) {
      window.dispatchEvent(new CustomEvent("rateLimitExceeded"));
    }
  }

  return res;
}
