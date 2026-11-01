import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("favourite reordering requires authentication and a complete valid identifier list", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const writes: string[][] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
    reorderFavourites: (ids) => {
      writes.push(ids);
      return Promise.resolve(!ids.includes("99"));
    },
  });
  const request = (body: unknown, token?: string) =>
    app.request("/api/admin/favourites/order", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  expect((await request({ ids: ["1", "2"] })).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  for (const ids of [[], ["1", "1"], ["9223372036854775808"]])
    expect((await request({ ids }, token)).status).toBe(400);
  expect(writes).toEqual([]);
  expect((await request({ ids: ["99"] }, token)).status).toBe(400);
  expect((await request({ ids: ["2", "1"] }, token)).status).toBe(204);
  expect(writes).toEqual([["99"], ["2", "1"]]);
});
