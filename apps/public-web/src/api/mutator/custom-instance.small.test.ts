import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { customInstance } from "./custom-instance";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

describe("public API client", () => {
  test.each([404, 500])("rejects HTTP %s instead of treating it as data", async (status) => {
    vi.stubEnv("VITE_API_URL", "https://api.example.test");
    server.use(
      http.get("https://api.example.test/example", () => new HttpResponse(null, { status })),
    );

    await expect(customInstance({ url: "/example" })).rejects.toMatchObject({
      response: { status },
    });
  });

  test("supports request options when the default API URL is unset", async () => {
    vi.stubEnv("VITE_API_URL", undefined);
    server.use(
      http.get("https://api.example.test/example", () => HttpResponse.json({ name: "sample" })),
    );

    await expect(
      customInstance({ url: "/example" }, { baseURL: "https://api.example.test" }),
    ).resolves.toEqual({ name: "sample" });
  });

  test("honours an aborted query signal", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      customInstance({ url: "/example", signal: controller.signal }),
    ).rejects.toMatchObject({ code: "ERR_CANCELED" });
  });

  test("returns JSON from the configured API origin with query parameters", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.test");
    server.use(
      http.get("https://api.example.test/example", ({ request }) =>
        HttpResponse.json({
          section: new URL(request.url).searchParams.get("section"),
          authorization: request.headers.get("authorization"),
        }),
      ),
    );

    await expect(
      customInstance({ url: "/example", method: "GET", params: { section: "hobby" } }),
    ).resolves.toEqual({ section: "hobby", authorization: null });
  });
});
