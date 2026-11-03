import { describe, expect, test } from "vitest";
import { canonicalForPath, configuredOrigin, generateRobots, generateSitemap } from "./sitemap";

describe("sitemap", () => {
  test("includes each public route on the configured origin", () => {
    const sitemap = generateSitemap("https://example.com/");
    expect(sitemap).toContain("<loc>https://example.com/</loc>");
    expect(sitemap).toContain("<loc>https://example.com/engineering</loc>");
    expect(sitemap).toContain("<loc>https://example.com/engineering/contact</loc>");
    expect(sitemap).toContain("<loc>https://example.com/hobby</loc>");
    expect(sitemap).toContain("<loc>https://example.com/hobby/contact</loc>");
    expect(sitemap.match(/<loc>/g)).toHaveLength(5);
  });
  test.each(["javascript:alert(1)", "https://user:pass@example.com", "https://example.com/path"])(
    "rejects a non-origin URL: %s",
    (origin) => expect(() => generateSitemap(origin)).toThrow("SITE_ORIGIN"),
  );
});

test("directs crawlers to the configured sitemap", () => {
  expect(generateRobots("https://example.com/")).toBe(
    "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n",
  );
});

test("uses the configured origin for known routes only", () => {
  expect(canonicalForPath("https://example.com/", "/hobby/")).toBe("https://example.com/hobby");
  expect(canonicalForPath("https://example.com", "/unknown")).toBeUndefined();
  expect(canonicalForPath("", "/")).toBeUndefined();
});

test("validates the optional site origin before serving", () => {
  expect(configuredOrigin(undefined)).toBe("");
  expect(configuredOrigin("https://example.com/")).toBe("https://example.com");
  expect(() => configuredOrigin("https://example.com/private")).toThrow("SITE_ORIGIN");
});
