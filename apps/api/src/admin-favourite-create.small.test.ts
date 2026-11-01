import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("favourite creation authenticates and validates before persistence", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const saved: unknown[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
    createFavourite: (input) => {
      saved.push(input);
      return Promise.resolve({ ...input, id: "12" });
    },
  });
  const valid = {
    name: "Tea",
    description: "Green tea",
    link: "https://example.com",
    displayOrder: 1,
  };
  const request = (body: string, token?: string) =>
    app.request("/api/admin/favourites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
  expect((await request(JSON.stringify(valid))).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  expect(
    (await request(JSON.stringify({ ...valid, link: "javascript:alert(1)" }), token)).status,
  ).toBe(400);
  expect((await request("{", token)).status).toBe(400);
  expect((await request(JSON.stringify({ ...valid, name: "x".repeat(70000) }), token)).status).toBe(
    413,
  );
  expect(saved).toEqual([]);
  const response = await request(JSON.stringify(valid), token);
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data: { ...valid, id: "12" } });
  expect(saved).toEqual([valid]);
});
