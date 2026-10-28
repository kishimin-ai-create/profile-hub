import { expect, test } from "bun:test";
import { z } from "zod";

import { issueToken } from "./auth/token";
import { createApp } from "./index";

const adminOrigin = "https://admin.example.com";

test("browser login keeps the refresh token in a secure HttpOnly cookie", async () => {
  let attempts = 0;
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminOrigin,
    allowedOrigins: [adminOrigin],
    loginAdmin: () => {
      attempts += 1;
      return Promise.resolve({
        status: "success" as const,
        tokens: { accessToken: "test-access", refreshToken: "test-refresh" },
      });
    },
  });
  const body = JSON.stringify({ email: "admin@example.com", password: "password" });
  const headers = {
    Origin: adminOrigin,
    "Content-Type": "application/json",
    "X-Admin-Request": "1",
  };
  const response = await app.request("/api/admin/auth/browser/login", {
    method: "POST",
    headers,
    body,
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ data: { accessToken: "test-access" } });
  const cookie = response.headers.get("set-cookie");
  expect(cookie).toContain("__Host-admin_refresh=test-refresh");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("Secure");
  expect(cookie).toContain("SameSite=None");
  expect(cookie).toContain("Path=/");
  expect(cookie).not.toContain("Domain=");
  expect(
    (
      await app.request("/api/admin/auth/browser/login", {
        method: "POST",
        headers: { Origin: adminOrigin, "Content-Type": "application/json" },
        body,
      })
    ).status,
  ).toBe(403);
  expect(attempts).toBe(1);
});

test("failed browser login does not set a session cookie", async () => {
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminOrigin,
    allowedOrigins: [adminOrigin],
    loginAdmin: () => Promise.resolve({ status: "invalid" as const }),
  });
  const headers = {
    Origin: adminOrigin,
    "Content-Type": "application/json",
    "X-Admin-Request": "1",
  };
  const response = await app.request("/api/admin/auth/browser/login", {
    method: "POST",
    headers,
    body: JSON.stringify({ email: "missing@example.com", password: "wrong" }),
  });
  expect(response.status).toBe(401);
  expect(response.headers.get("set-cookie")).toBeNull();
  expect(
    (
      await app.request("/api/admin/auth/browser/login", {
        method: "POST",
        headers,
        body: "x".repeat(5000),
      })
    ).status,
  ).toBe(413);
});

test("browser refresh rotates the HttpOnly cookie and rejects reuse", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  let version = 0;
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminOrigin,
    allowedOrigins: [adminOrigin],
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(version),
    revokeAdminSession: (_id: string, expected: number) => {
      if (expected !== version) return Promise.resolve(false);
      version += 1;
      return Promise.resolve(true);
    },
  });
  const refresh = await issueToken("42", 0, "refresh", secret);
  const headers = {
    Origin: adminOrigin,
    "X-Admin-Request": "1",
    Cookie: `__Host-admin_refresh=${refresh}`,
  };
  const response = await app.request("/api/admin/auth/browser/refresh", {
    method: "POST",
    headers,
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(response.headers.get("set-cookie")).not.toContain(refresh);
  const data = z
    .object({ data: z.object({ accessToken: z.string() }).strict() })
    .parse(await response.json());
  expect(
    (
      await app.request("/api/admin/auth/me", {
        headers: { Authorization: `Bearer ${data.data.accessToken}` },
      })
    ).status,
  ).toBe(200);
  const reused = await app.request("/api/admin/auth/browser/refresh", { method: "POST", headers });
  expect(reused.status).toBe(401);
  expect(reused.headers.get("set-cookie")).toBeNull();
  expect(
    (
      await app.request("/api/admin/auth/browser/refresh", {
        method: "POST",
        headers: { Cookie: headers.Cookie, Origin: adminOrigin },
      })
    ).status,
  ).toBe(403);
});

test("browser logout revokes the session and expires the refresh cookie", async () => {
  const secret = "a-test-only-secret-with-at-least-32-bytes";
  let version = 0;
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () =>
      Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminOrigin,
    allowedOrigins: [adminOrigin],
    adminSecret: secret,
    findAdminSessionVersion: () => Promise.resolve(version),
    revokeAdminSession: (_id: string, expected: number) => {
      if (expected !== version) return Promise.resolve(false);
      version += 1;
      return Promise.resolve(true);
    },
  });
  const refresh = await issueToken("42", 0, "refresh", secret);
  const access = await issueToken("42", 0, "access", secret);
  const cookie = `__Host-admin_refresh=${refresh}`;
  expect(
    (
      await app.request("/api/admin/auth/browser/logout", {
        method: "POST",
        headers: { Origin: adminOrigin, Cookie: cookie },
      })
    ).status,
  ).toBe(403);
  expect(version).toBe(0);
  const response = await app.request("/api/admin/auth/browser/logout", {
    method: "POST",
    headers: { Origin: adminOrigin, "X-Admin-Request": "1", Cookie: cookie },
  });
  expect(response.status).toBe(204);
  expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  expect(
    (await app.request("/api/admin/auth/me", { headers: { Authorization: `Bearer ${access}` } }))
      .status,
  ).toBe(401);
  expect(
    (
      await app.request("/api/admin/auth/browser/logout", {
        method: "POST",
        headers: { Origin: adminOrigin, "X-Admin-Request": "1", Cookie: cookie },
      })
    ).status,
  ).toBe(401);
});
