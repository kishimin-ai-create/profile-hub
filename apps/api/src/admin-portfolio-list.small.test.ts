import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("administrator portfolio list requires authentication and filters by section", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const calls: string[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: (section) => { calls.push(section); return Promise.resolve([]); },
    getPublicProfile: () => Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
  });
  expect((await app.request("/api/admin/portfolio")).status).toBe(401);
  expect(calls).toEqual([]);
  const token = await issueToken("42", 3, "access", secret);
  const headers = { Authorization: `Bearer ${token}` };
  const all = await app.request("/api/admin/portfolio", { headers });
  expect(all.status).toBe(200);
  expect(all.headers.get("cache-control")).toBe("no-store");
  expect(await all.json()).toEqual({ data: [] });
  expect(calls).toEqual(["engineering", "hobby"]);
  calls.length = 0;
  expect((await app.request("/api/admin/portfolio?section=hobby", { headers })).status).toBe(200);
  expect(calls).toEqual(["hobby"]);
  expect((await app.request("/api/admin/portfolio?section=invalid", { headers })).status).toBe(400);
  expect(calls).toEqual(["hobby"]);
});
