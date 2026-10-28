import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

const secret = "a-test-only-secret-with-at-least-32-bytes";

test("the application rejects unauthenticated and revoked administrator requests", async () => {
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () => Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
  });
  const current = await issueToken("42", 3, "access", secret);
  const revoked = await issueToken("42", 2, "access", secret);
  expect((await app.request("/api/admin/missing")).status).toBe(401);
  expect((await app.request("/api/admin/missing", { headers: { Authorization: `Bearer ${revoked}` } })).status).toBe(401);
  expect((await app.request("/api/admin/missing", { headers: { Authorization: `Bearer ${current}` } })).status).toBe(404);
  expect((await app.request("/api/public/missing")).status).toBe(404);
});
