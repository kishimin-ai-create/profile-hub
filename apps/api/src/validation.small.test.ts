import { expect, test } from "bun:test";
import { z } from "zod";

import { createApp } from "./index";
import { validateJson } from "./middleware/validation";

const app = createApp({
  listFavourites: () => Promise.resolve([]),
  listPortfolios: () => Promise.resolve([]),
  getPublicProfile: () =>
    Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
  logRequest: () => {},
});
app.post(
  "/test-validation",
  validateJson(z.object({ name: z.string().min(1) }), ["name"]),
  (context) => context.json(context.req.valid("json")),
);
app.post(
  "/test-private-field",
  validateJson(z.object({ privateKey: z.string().min(1) }), []),
  (context) => context.json(context.req.valid("json")),
);

test("valid JSON reaches the handler as validated data", async () => {
  const response = await app.request("/test-validation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Example" }),
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ name: "Example" });
});

test("invalid JSON fields return a safe, consistent field error", async () => {
  const response = await app.request("/test-validation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "", password: "private-value" }),
  });
  const body: unknown = await response.json();
  expect(response.status).toBe(400);
  expect(body).toEqual({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      fields: [{ field: "name", message: "Invalid value" }],
    },
  });
  expect(JSON.stringify(body)).not.toContain("private-value");
});

test("malformed JSON returns a safe client error", async () => {
  const response = await app.request("/test-validation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: { code: "CLIENT_ERROR", message: "Invalid request" },
  });
});

test("validation does not disclose fields outside the allowlist", async () => {
  const response = await app.request("/test-private-field", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ privateKey: "" }),
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: { code: "VALIDATION_ERROR", message: "Invalid request", fields: [] },
  });
});
