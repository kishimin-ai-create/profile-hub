import { expect, test } from "bun:test";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

const secret = "a-test-only-secret-with-at-least-32-bytes";

test("the application rejects unauthenticated and revoked administrator requests", async () => {
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
  });
  const current = await issueToken("42", 3, "access", secret);
  const revoked = await issueToken("42", 2, "access", secret);
  expect((await app.request("/api/admin/missing")).status).toBe(401);
  expect(
    (await app.request("/api/admin/missing", { headers: { Authorization: `Bearer ${revoked}` } }))
      .status,
  ).toBe(401);
  expect(
    (await app.request("/api/admin/missing", { headers: { Authorization: `Bearer ${current}` } }))
      .status,
  ).toBe(404);
  expect((await app.request("/api/public/missing")).status).toBe(404);
});

test("the application fails closed when no administrator lookup is configured", async () => {
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
  });
  const token = await issueToken("42", 3, "access", secret);
  expect(
    (await app.request("/api/admin/missing", { headers: { Authorization: `Bearer ${token}` } }))
      .status,
  ).toBe(401);
});

test("the current administrator endpoint returns the verified identity", async () => {
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(3),
  });
  const token = await issueToken("42", 3, "access", secret);
  const response = await app.request("/api/admin/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data: { id: "42" } });
  expect((await app.request("/api/admin/auth/me")).status).toBe(401);
});

test("logout invalidates an existing administrator session", async () => {
  let version = 3;
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(version),
    revokeAdminSession: (_id: string, expected: number) => {
      if (version !== expected) return Promise.resolve(false);
      version += 1;
      return Promise.resolve(true);
    },
  });
  const token = await issueToken("42", 3, "access", secret);
  const headers = { Authorization: `Bearer ${token}` };
  expect((await app.request("/api/admin/auth/logout", { method: "POST", headers })).status).toBe(
    204,
  );
  expect((await app.request("/api/admin/auth/me", { headers })).status).toBe(401);
  expect((await app.request("/api/admin/auth/logout", { method: "POST", headers })).status).toBe(
    401,
  );
});

test("refresh rotates a current refresh token and rejects reuse", async () => {
  let version = 3;
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(version),
    revokeAdminSession: (_id: string, expected: number) => {
      if (version !== expected) return Promise.resolve(false);
      version += 1;
      return Promise.resolve(true);
    },
  });
  const refresh = await issueToken("42", 3, "refresh", secret);
  const headers = { Authorization: `Bearer ${refresh}` };
  const response = await app.request("/api/admin/auth/refresh", { method: "POST", headers });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body: unknown = await response.json();
  expect(body).toMatchObject({
    data: { accessToken: expect.any(String), refreshToken: expect.any(String) },
  });
  expect((await app.request("/api/admin/auth/refresh", { method: "POST", headers })).status).toBe(
    401,
  );
  expect((await app.request("/api/admin/auth/refresh", { method: "POST" })).status).toBe(401);
  expect((await app.request("/api/admin/auth/refresh", { headers })).status).toBe(401);
});
