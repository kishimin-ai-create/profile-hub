import { expect, test } from "bun:test";

import app from "./index";

test("GET /health reports that the API is running", async () => {
  const response = await app.request("/health");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test("unknown API routes return a consistent JSON not found response", async () => {
  for (const path of ["/api/public/missing", "/api/admin/missing"]) {
    const response = await app.request(path);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "NOT_FOUND", message: "Not found" } });
  }
});
