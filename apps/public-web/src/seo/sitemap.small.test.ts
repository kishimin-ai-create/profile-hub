import { describe, expect, test } from "vitest";
import { generateSitemap } from "./sitemap";

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
    (origin) => expect(() => generateSitemap(origin)).toThrow(),
  );
});
