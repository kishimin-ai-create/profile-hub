import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("portfolio update requires authentication and valid data", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const saves: string[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]), listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () => Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret, findAdminSessionVersion: () => Promise.resolve(3),
    updatePortfolio: (id, input) => { saves.push(id); return Promise.resolve(id === "42" ? { ...input, id, repositoryUrl: input.repositoryUrl ?? null, demoUrl: input.demoUrl ?? null, imageUrl: input.imageUrl ?? null } : null); },
  });
  const data = { section: "hobby", name: "Updated", summary: "Summary", technologies: ["Bun"], displayOrder: 1 };
  const request = (id: string, body: unknown, token?: string) => app.request(`/api/admin/portfolio/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  expect((await request("42", data)).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  expect((await request("0", data, token)).status).toBe(400);
  expect((await request("42", { ...data, imageUrl: "javascript:alert(1)" }, token)).status).toBe(400);
  expect(saves).toEqual([]);
  const result = await request("42", data, token);
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({ data: { id: "42", name: "Updated", section: "hobby" } });
  expect((await request("43", data, token)).status).toBe(404);
});
