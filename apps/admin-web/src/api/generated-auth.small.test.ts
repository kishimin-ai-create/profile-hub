import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { loginAdminBrowser } from "../gen/admin-auth";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); vi.unstubAllEnvs(); });
afterAll(() => server.close());

test("the generated browser login sends the required header and returns the access token", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  let header: string | null = null;
  server.use(http.post("https://api.example.test/api/admin/auth/browser/login", ({ request }) => {
    header = request.headers.get("X-Admin-Request");
    return HttpResponse.json({ data: { accessToken: "test-token" } });
  }));
  await expect(loginAdminBrowser({ email: "admin@example.com", password: "password" })).resolves.toEqual({ data: { accessToken: "test-token" } });
  expect(header).toBe("1");
});
