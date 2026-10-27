import { expect, test } from "bun:test";

import { createApp } from "./index";

const app = createApp({
  listFavourites: () => Promise.resolve([]),
  listPortfolios: () => Promise.resolve([]),
  getPublicProfile: () =>
    Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
  allowedOrigins: ["https://public.example.com", "https://admin.example.com"],
});

test("requests without an Origin can reach the health check", async () => {
  expect((await app.request("/health")).status).toBe(200);
});

test("allowed browser origins receive their exact CORS origin", async () => {
  for (const origin of ["https://public.example.com", "https://admin.example.com"]) {
    const response = await app.request("/health", { headers: { Origin: origin } });
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("vary")).toContain("Origin");
  }
});

test("unapproved browser origins are rejected", async () => {
  const response = await app.request("/health", {
    headers: { Origin: "https://unapproved.example.com" },
  });
  expect(response.status).toBe(403);
  expect(response.headers.get("access-control-allow-origin")).toBeNull();
});

test("allowed preflight requests receive the configured method and header policy", async () => {
  const response = await app.request("/api/public/favourites", {
    method: "OPTIONS",
    headers: { Origin: "https://public.example.com", "Access-Control-Request-Method": "GET" },
  });
  expect(response.status).toBe(204);
  expect(response.headers.get("access-control-allow-origin")).toBe("https://public.example.com");
  expect(response.headers.get("access-control-allow-methods")).toContain("GET");
});

test("a plain OPTIONS request is not treated as preflight", async () => {
  const response = await app.request("/health", {
    method: "OPTIONS",
    headers: { Origin: "https://public.example.com" },
  });
  expect(response.status).toBe(404);
});

test("preflight rejects unsupported methods and unapproved origins", async () => {
  for (const [origin, method] of [
    ["https://public.example.com", "TRACE"],
    ["https://unapproved.example.com", "GET"],
  ]) {
    const response = await app.request("/api/public/favourites", {
      method: "OPTIONS",
      headers: { Origin: origin, "Access-Control-Request-Method": method },
    });
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  }
});
