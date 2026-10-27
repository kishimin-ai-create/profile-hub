import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { customInstance } from "./custom-instance";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); vi.unstubAllEnvs(); });
afterAll(() => server.close());

describe("public API client", () => {
  test("returns JSON from the configured API origin with query parameters", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.test");
    server.use(http.get("https://api.example.test/example", ({ request }) => HttpResponse.json({ section: new URL(request.url).searchParams.get("section"), authorization: request.headers.get("authorization") })));

    await expect(customInstance({ url: "/example", method: "GET", params: { section: "hobby" } })).resolves.toEqual({ section: "hobby", authorization: null });
  });
});
