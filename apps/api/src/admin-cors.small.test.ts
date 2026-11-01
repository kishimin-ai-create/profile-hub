import { expect, test } from "bun:test";

import { createApp } from "./index";

const app = createApp({
  listFavourites: () => Promise.resolve([]),
  listPortfolios: () => Promise.resolve([]),
  getPublicProfile: () =>
    Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
  allowedOrigins: ["https://public.example.com", "https://admin.example.com"],
  adminOrigin: "https://admin.example.com",
});

test("credentialed CORS and the browser request header are limited to the admin origin", async () => {
  const preflight = (origin: string) =>
    app.request("/api/admin/auth/browser/refresh", {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "x-admin-request",
      },
    });
  const admin = await preflight("https://admin.example.com");
  expect(admin.status).toBe(204);
  expect(admin.headers.get("access-control-allow-origin")).toBe("https://admin.example.com");
  expect(admin.headers.get("access-control-allow-credentials")).toBe("true");
  expect(admin.headers.get("access-control-allow-headers")).toContain("X-Admin-Request");
  const response = await app.request("/health", {
    headers: { Origin: "https://admin.example.com" },
  });
  expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  const publicOrigin = await preflight("https://public.example.com");
  expect(publicOrigin.headers.get("access-control-allow-credentials")).toBeNull();
  expect(publicOrigin.headers.get("access-control-allow-headers")).not.toContain("X-Admin-Request");
  const unknown = await preflight("https://other.example.com");
  expect(unknown.status).toBe(403);
  expect(unknown.headers.get("access-control-allow-credentials")).toBeNull();
});
