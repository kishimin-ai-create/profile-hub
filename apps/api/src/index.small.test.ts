import { expect, test } from "bun:test";
import { HTTPException } from "hono/http-exception";

import app from "./index";

app.get("/test-unexpected-error", () => {
  throw new Error("private diagnostic details");
});
app.get("/test-client-error", () => {
  throw new HTTPException(400, { message: "private validation details" });
});

test("GET /health reports that the API is running", async () => {
  const response = await app.request("/health");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test("unknown API routes return a consistent JSON not found response", async () => {
  for (const path of ["/api/public/missing"]) {
    const response = await app.request(path);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "NOT_FOUND", message: "Not found" } });
  }
});

test("unexpected errors do not disclose internal details", async () => {
  const response = await app.request("/test-unexpected-error");

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
});

test("client HTTP errors keep their status without exposing internal details", async () => {
  const response = await app.request("/test-client-error");

  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: { code: "CLIENT_ERROR", message: "Invalid request" },
  });
});
