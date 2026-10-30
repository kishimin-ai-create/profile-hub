import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("portfolio deletion rejects unauthorized and invalid requests", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const deleted: string[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]), listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () => Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret, findAdminSessionVersion: () => Promise.resolve(3),
    deletePortfolio: (id) => { deleted.push(id); return Promise.resolve(id === "42"); },
  });
  const request = (id: string, token?: string) => app.request(`/api/admin/portfolio/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} });
  expect((await request("42")).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  expect((await request("0", token)).status).toBe(400);
  expect(deleted).toEqual([]);
  expect((await request("42", token)).status).toBe(204);
  expect((await request("43", token)).status).toBe(404);
  expect(deleted).toEqual(["42", "43"]);
});
