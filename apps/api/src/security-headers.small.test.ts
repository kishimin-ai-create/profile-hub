import { expect, test } from "bun:test";

import { createApp } from "./index";

const app = createApp({
  listFavourites: () => Promise.resolve([]),
  listPortfolios: () => Promise.resolve([]),
  getPublicProfile: () =>
    Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
  allowedOrigins: ["https://public.example.com"],
});
app.get("/test-error", () => {
  throw new Error("private details");
});

test("API responses carry browser protection headers, including errors and preflight", async () => {
  const responses = [
    await app.request("/health"),
    await app.request("/missing"),
    await app.request("/test-error"),
    await app.request("/health", { headers: { Origin: "https://unapproved.example.com" } }),
    await app.request("/health", {
      method: "OPTIONS",
      headers: { Origin: "https://public.example.com", "Access-Control-Request-Method": "GET" },
    }),
  ];
  expect(responses.map((response) => response.status)).toEqual([200, 404, 500, 403, 204]);
  for (const response of responses) {
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    const policy = response.headers.get("content-security-policy");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
  }
});
