import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("sitemap()", () => {
  const items = sitemap();
  const BASE_URL = "https://descriptiongenerator.web.id";

  it("returns exactly 8 public routes", () => {
    expect(items).toHaveLength(8);
  });

  it("uses production domain for all URLs", () => {
    for (const item of items) {
      expect(item.url).toMatch(/^https:\/\/descriptiongenerator\.web\.id/);
      expect(item.url).not.toContain("localhost");
      expect(item.url).not.toContain("vercel.app");
    }
  });

  it("contains no duplicate URLs", () => {
    const urls = items.map((i) => i.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });

  it("includes homepage and all 7 active generators", () => {
    const expectedUrls = [
      BASE_URL,
      `${BASE_URL}/generate/product-description`,
      `${BASE_URL}/generate/social-media-caption`,
      `${BASE_URL}/generate/title-generator`,
      `${BASE_URL}/generate/hook-generator`,
      `${BASE_URL}/generate/advertisement-generator`,
      `${BASE_URL}/generate/seo-description`,
      `${BASE_URL}/generate/marketplace-description`,
    ];

    const actualUrls = items.map((i) => i.url);
    expect(actualUrls).toEqual(expectedUrls);
  });

  it("does not include API or private routes", () => {
    for (const item of items) {
      expect(item.url).not.toContain("/api/");
      expect(item.url).not.toContain("?");
    }
  });

  it("has valid priorities and changeFrequency values", () => {
    for (const item of items) {
      if (item.priority !== undefined) {
        expect(item.priority).toBeGreaterThanOrEqual(0);
        expect(item.priority).toBeLessThanOrEqual(1.0);
      }
      if (item.changeFrequency !== undefined) {
        expect([
          "always",
          "hourly",
          "daily",
          "weekly",
          "monthly",
          "yearly",
          "never",
        ]).toContain(item.changeFrequency);
      }
    }
  });
});

describe("robots()", () => {
  const config = robots();

  it("specifies correct sitemap URL", () => {
    expect(config.sitemap).toBe(
      "https://descriptiongenerator.web.id/sitemap.xml"
    );
  });

  it("allows public crawling and disallows API routes", () => {
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules).toBeDefined();
    expect(rules?.userAgent).toBe("*");
    expect(rules?.allow).toBe("/");
    expect(rules?.disallow).toContain("/api/");
  });
});

