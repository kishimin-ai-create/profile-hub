import { expect, test } from "bun:test";

import { createApp } from "./index";
import type { RequestLog } from "./middleware/request-log";

test("request logs contain status and timing without URLs or credentials", async () => {
  const events: RequestLog[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    allowedOrigins: ["https://public.example.com"],
    logRequest: (event) => events.push(event),
  });
  const response = await app.request("/health?token=private-query-value", {
    headers: { Authorization: "Bearer private-token", Origin: "https://public.example.com" },
  });
  const denied = await app.request("/health", {
    headers: { Origin: "https://unapproved.example.com" },
  });

  expect(response.status).toBe(200);
  expect(denied.status).toBe(403);
  expect(events).toHaveLength(2);
  expect(events[0]).toEqual({ method: "GET", status: 200, durationMs: expect.any(Number) });
  expect(events[1]).toEqual({ method: "GET", status: 403, durationMs: expect.any(Number) });
  expect(JSON.stringify(events)).not.toContain("private-query-value");
  expect(JSON.stringify(events)).not.toContain("private-token");
});
