import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("favourite update requires authentication and valid data", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const saved: string[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
    updateFavourite: (id, input) => {
      saved.push(id);
      return Promise.resolve(id === "42" ? { ...input, id } : null);
    },
  });
  const data = {
    name: "Tea",
    description: "Green tea",
    link: "https://example.com",
    displayOrder: 1,
  };
  const request = (id: string, body: unknown, token?: string) =>
    app.request(`/api/admin/favourites/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  expect((await request("42", data)).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  expect((await request("0", data, token)).status).toBe(400);
  expect((await request("42", { ...data, link: "javascript:alert(1)" }, token)).status).toBe(400);
  expect(saved).toEqual([]);
  const response = await request("42", data, token);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data: { ...data, id: "42" } });
  expect((await request("43", data, token)).status).toBe(404);
});
