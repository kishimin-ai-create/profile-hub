import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("only an authenticated administrator can read the profile", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  let calls = 0;
  const profile = { id: "1", name: "Example", title: "Developer", bio: null, avatarUrl: null };
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () => {
      calls++;
      return Promise.resolve({ profile, skills: [], links: { engineering: [], hobby: [] } });
    },
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
  });
  expect((await app.request("/api/admin/profile")).status).toBe(401);
  expect(calls).toBe(0);
  const token = await issueToken("42", 3, "access", secret);
  const response = await app.request("/api/admin/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data: profile });
  expect(calls).toBe(1);
  const docs = await app.request("/docs/json");
  expect(await docs.json()).toMatchObject({
    paths: {
      "/api/admin/profile": {
        get: { operationId: "getAdminProfile", security: [{ adminBearer: [] }] },
      },
    },
  });
});
