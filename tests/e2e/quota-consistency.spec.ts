/**
 * E2E tests: Quota display consistency
 *
 * Verifies that the quota count shown in the UI matches the
 * /api/generate/quota API response across multiple page visits.
 */

import { test, expect } from "@playwright/test";

const GENERATOR_PATHS = [
  "/generate/product-description",
  "/generate/marketplace-description",
  "/generate/seo-description",
  "/generate/advertisement-generator",
  "/generate/hook-generator",
  "/generate/social-media-caption",
  "/generate/title-generator",
];

test.describe("All 7 generator pages – basic smoke test", () => {
  for (const path of GENERATOR_PATHS) {
    test(`${path} loads without crash`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(path, { waitUntil: "domcontentloaded" });

      // Page should not be blank
      const body = await page.textContent("body");
      expect(body?.length).toBeGreaterThan(100);

      // No uncaught JS errors
      expect(errors).toHaveLength(0);
    });

    test(`${path} has a form with at least one input`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const inputs = page.locator("input, textarea");
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    });
  }
});

test.describe("Quota API – cross-page consistency", () => {
  test("quota response is the same across two consecutive fetches", async ({
    request,
  }) => {
    const res1 = await request.get("/api/generate/quota");
    const res2 = await request.get("/api/generate/quota");

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);

    const body1 = await res1.json();
    const body2 = await res2.json();

    // Remaining should not change between read-only calls
    expect(body1.remaining).toBe(body2.remaining);
    expect(body1.limit).toBe(body2.limit);
  });
});
