import { expect, test } from "bun:test";
import { Hono } from "hono";

import { issueToken } from "../auth/token";
import { adminGuard } from "./admin-guard";

const secret = "a-test-only-secret-with-at-least-32-bytes";

test("protected admin routes require a current access token", async () => {
  const app = new Hono();
  app.use(
    "/api/admin/*",
    adminGuard(secret, () => Promise.resolve(3)),
  );
  app.get("/api/admin/protected", (context) => context.json({ ok: true }));
  const current = await issueToken("42", 3, "access", secret);
  const revoked = await issueToken("42", 2, "access", secret);
  const refresh = await issueToken("42", 3, "refresh", secret);
  for (const authorization of [
    undefined,
    "Bearer invalid",
    `Bearer ${revoked}`,
    `Bearer ${refresh}`,
  ]) {
    const headers = authorization ? { Authorization: authorization } : undefined;
    expect((await app.request("/api/admin/protected", { headers })).status).toBe(401);
  }
  expect(
    (await app.request("/api/admin/protected", { headers: { Authorization: `Bearer ${current}` } }))
      .status,
  ).toBe(200);
});
