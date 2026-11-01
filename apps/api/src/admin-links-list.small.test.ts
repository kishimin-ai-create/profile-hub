import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

test("the administrator can read section-scoped links only when authenticated", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  let calls = 0;
  const links = {
    engineering: [{ id: "1", kind: "website", url: "https://example.com", displayOrder: 0 }],
    hobby: [{ id: "2", kind: "website", url: "https://example.org", displayOrder: 0 }],
  };
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () => {
      calls++;
      return Promise.resolve({ profile: null, skills: [], links });
    },
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
  });
  expect((await app.request("/api/admin/social-links")).status).toBe(401);
  expect(calls).toBe(0);
  const token = await issueToken("42", 3, "access", secret);
  const response = await app.request("/api/admin/social-links", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({
    data: [
      { ...links.engineering[0], section: "engineering" },
      { ...links.hobby[0], section: "hobby" },
    ],
  });
  expect(calls).toBe(1);
});
