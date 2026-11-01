import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("admin portfolio detail validates identity and does not expose absent entries", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  const requests: string[] = [];
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
    findPortfolio: (id) => {
      requests.push(id);
      return Promise.resolve(
        id === "42"
          ? {
              id,
              section: "hobby",
              name: "Work",
              summary: "Summary",
              technologies: ["Bun"],
              repositoryUrl: null,
              demoUrl: null,
              imageUrl: null,
              displayOrder: 1,
            }
          : null,
      );
    },
  });
  expect((await app.request("/api/admin/portfolio/42")).status).toBe(401);
  const token = await issueToken("42", 3, "access", secret);
  const headers = { Authorization: `Bearer ${token}` };
  for (const invalid of ["0", "01", "9223372036854775808", "invalid"])
    expect((await app.request(`/api/admin/portfolio/${invalid}`, { headers })).status).toBe(400);
  expect(requests).toEqual([]);
  const found = await app.request("/api/admin/portfolio/42", { headers });
  expect(found.status).toBe(200);
  expect(found.headers.get("cache-control")).toBe("no-store");
  expect(await found.json()).toMatchObject({ data: { id: "42", section: "hobby" } });
  expect((await app.request("/api/admin/portfolio/43", { headers })).status).toBe(404);
});
