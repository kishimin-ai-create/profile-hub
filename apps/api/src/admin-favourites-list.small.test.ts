import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("the administrator can list favourites in display order only when authenticated", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  let calls = 0;
  const data = [
    {
      id: "2",
      name: "Tea",
      description: "Green tea",
      link: "https://example.com",
      displayOrder: 1,
    },
  ];
  const app = createApp({
    listFavourites: () => {
      calls++;
      return Promise.resolve(data);
    },
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
  });
  expect((await app.request("/api/admin/favourites")).status).toBe(401);
  expect(calls).toBe(0);
  const token = await issueToken("42", 3, "access", secret);
  const response = await app.request("/api/admin/favourites", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data });
  expect(calls).toBe(1);
  const docs = await app.request("/docs/json");
  expect(await docs.json()).toMatchObject({
    paths: {
      "/api/admin/favourites": {
        get: { operationId: "listAdminFavourites", security: [{ adminBearer: [] }] },
      },
    },
  });
});
