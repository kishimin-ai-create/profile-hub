import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("skill creation requires authentication and valid input", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const writes: unknown[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
    createSkill: (input) => {
      writes.push(input);
      return Promise.resolve({ id: "1", ...input });
    },
  });
  const input = { name: "TypeScript", displayOrder: 0 };
  const request = (body: string, token?: string) =>
    app.request("/api/admin/skills", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
  expect((await request(JSON.stringify(input))).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  expect((await request(JSON.stringify({ ...input, category: "language" }), token)).status).toBe(
    400,
  );
  expect((await request("{", token)).status).toBe(400);
  expect((await request(JSON.stringify({ ...input, name: "x".repeat(70000) }), token)).status).toBe(
    413,
  );
  expect(writes).toEqual([]);
  const response = await request(JSON.stringify(input), token);
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data: { id: "1", ...input } });
  expect(writes).toEqual([input]);
});
