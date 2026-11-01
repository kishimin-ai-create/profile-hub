import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("skill update requires authentication and valid input", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const writes: string[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
    updateSkill: (id, input) => {
      writes.push(id);
      return Promise.resolve(id === "42" ? { id, ...input } : null);
    },
  });
  const input = { name: "TypeScript", displayOrder: 0 };
  const request = (id: string, body: unknown, token?: string) =>
    app.request(`/api/admin/skills/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  expect((await request("42", input)).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  expect((await request("0", input, token)).status).toBe(400);
  expect((await request("42", { ...input, category: "language" }, token)).status).toBe(400);
  expect(writes).toEqual([]);
  const response = await request("42", input, token);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data: { id: "42", ...input } });
  expect((await request("43", input, token)).status).toBe(404);
});
