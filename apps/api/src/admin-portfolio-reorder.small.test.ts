import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("portfolio reorder validates authorization, identifiers and section before writing", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const writes: unknown[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]), listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () => Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret, findAdminSessionVersion: () => Promise.resolve(3),
    reorderPortfolios: (section, ids) => { writes.push({ section, ids }); return Promise.resolve(!ids.includes("99")); },
  });
  const request = (body: unknown, token?: string) => app.request("/api/admin/portfolio/order", { method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  expect((await request({ section: "hobby", ids: ["1", "2"] })).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  for (const data of [{ section: "other", ids: ["1"] }, { section: "hobby", ids: ["1", "1"] }, { section: "hobby", ids: ["9223372036854775808"] }, { section: "hobby", ids: [] }]) expect((await request(data, token)).status).toBe(400);
  expect(writes).toEqual([]);
  expect((await request({ section: "hobby", ids: ["99"] }, token)).status).toBe(400);
  expect((await request({ section: "hobby", ids: ["2", "1"] }, token)).status).toBe(204);
  expect(writes).toEqual([{ section: "hobby", ids: ["99"] }, { section: "hobby", ids: ["2", "1"] }]);
});
