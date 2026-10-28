import { expect, test } from "bun:test";
import { Hono } from "hono";

import { requireAdminBrowser } from "./admin-browser";

test("browser session operations require the exact administrator origin and a custom header", async () => {
  const app = new Hono();
  app.use("/session", requireAdminBrowser("https://admin.example.com"));
  app.post("/session", (context) => context.json({ ok: true }));
  const rejectedHeaders: HeadersInit[] = [
    {},
    { Origin: "https://admin.example.com" },
    { Origin: "https://public.example.com", "X-Admin-Request": "1" },
    { Origin: "null", "X-Admin-Request": "1" },
    { Origin: "https://admin.example.com.attacker.test", "X-Admin-Request": "1" },
    { Origin: "https://admin.example.com", "X-Admin-Request": "other" },
  ];
  for (const headers of rejectedHeaders) {
    expect((await app.request("/session", { method: "POST", headers })).status).toBe(403);
  }
  expect(
    (
      await app.request("/session", {
        method: "POST",
        headers: { Origin: "https://admin.example.com", "X-Admin-Request": "1" },
      })
    ).status,
  ).toBe(200);
});

test("browser sessions fail closed when the administrator origin is not configured", async () => {
  const app = new Hono();
  app.use("/session", requireAdminBrowser(undefined));
  app.post("/session", (context) => context.json({ ok: true }));
  expect(
    (
      await app.request("/session", {
        method: "POST",
        headers: { Origin: "https://admin.example.com", "X-Admin-Request": "1" },
      })
    ).status,
  ).toBe(403);
});

test("an opaque origin configuration cannot authorize a browser session", async () => {
  const app = new Hono();
  app.use("/session", requireAdminBrowser("null"));
  app.post("/session", (context) => context.json({ ok: true }));
  expect(
    (
      await app.request("/session", {
        method: "POST",
        headers: { Origin: "null", "X-Admin-Request": "1" },
      })
    ).status,
  ).toBe(403);
});
