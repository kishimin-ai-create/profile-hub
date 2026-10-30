import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { createBrowserSession } from "./browser-session";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

test("browser session uses the authentication endpoints for login, restore and logout", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.post("https://api.example.test/api/admin/auth/browser/login", () =>
      HttpResponse.json({ data: { accessToken: "login" } }),
    ),
    http.post("https://api.example.test/api/admin/auth/browser/refresh", () =>
      HttpResponse.json({ data: { accessToken: "refresh" } }),
    ),
    http.post(
      "https://api.example.test/api/admin/auth/browser/logout",
      () => new HttpResponse(null, { status: 204 }),
    ),
  );
  const session = createBrowserSession();
  expect(await session.login("admin@example.com", "password")).toBe(true);
  expect(session.accessToken()).toBe("login");
  expect(await session.restore()).toBe(true);
  expect(session.accessToken()).toBe("refresh");
  await session.logout();
  expect(session.accessToken()).toBeNull();
});

test("only an unauthorized refresh is treated as a missing session", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.post(
      "https://api.example.test/api/admin/auth/browser/refresh",
      () => new HttpResponse(null, { status: 401 }),
    ),
  );
  const session = createBrowserSession();
  expect(await session.restore()).toBe(false);
  server.use(
    http.post(
      "https://api.example.test/api/admin/auth/browser/refresh",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  await expect(session.restore()).rejects.toThrow("Request failed with status code 500");
});
