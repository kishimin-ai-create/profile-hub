import { expect, test } from "bun:test";

import { createApp } from "./index";

const adminOrigin = "https://admin.example.com";

test("browser login keeps the refresh token in a secure HttpOnly cookie", async () => {
  let attempts = 0;
  const app = createApp({
    listFavourites: () => Promise.resolve([]),
    listPortfolios: () => Promise.resolve([]),
    getPublicProfile: () => Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
    adminOrigin,
    allowedOrigins: [adminOrigin],
    loginAdmin: () => { attempts += 1; return Promise.resolve({ status: "success" as const, tokens: { accessToken: "test-access", refreshToken: "test-refresh" } }); },
  });
  const body = JSON.stringify({ email: "admin@example.com", password: "password" });
  const headers = { Origin: adminOrigin, "Content-Type": "application/json", "X-Admin-Request": "1" };
  const response = await app.request("/api/admin/auth/browser/login", { method: "POST", headers, body });
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
  expect((await app.request("/api/admin/auth/browser/login", { method: "POST", headers: { Origin: adminOrigin, "Content-Type": "application/json" }, body })).status).toBe(403);
  expect(attempts).toBe(1);
});
