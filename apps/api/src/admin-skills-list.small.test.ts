import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("the skill list requires authentication and returns ordered skills", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  let calls = 0;
  const skills = [{ id: "1", name: "TypeScript", displayOrder: 0 }];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () => {
      calls++;
      return Promise.resolve({ profile: null, skills, links: { engineering: [], hobby: [] } });
    },
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
  });
  expect((await app.request("/api/admin/skills")).status).toBe(401);
  expect(calls).toBe(0);
  const token = await issueToken("42", 3, "access", secret);
  const response = await app.request("/api/admin/skills", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data: skills });
  expect(calls).toBe(1);
});
