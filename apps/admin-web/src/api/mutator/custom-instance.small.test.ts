import axios, { AxiosHeaders } from "axios";
import { afterEach, describe, expect, test, vi } from "vitest";
import { customInstance } from "./custom-instance";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("administrator API transport", () => {
  test("keeps API paths relative when no API origin is configured", async () => {
    vi.stubEnv("VITE_API_URL", "");
    const request = vi.spyOn(axios, "request").mockResolvedValue({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    await customInstance({ url: "/api/admin/auth/me" });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "", url: "/api/admin/auth/me" }),
    );
  });
  test("uses the API origin and leaves credentials disabled by default", async () => {
    vi.stubEnv("VITE_API_URL", "https://api.example.test");
    const request = vi.spyOn(axios, "request").mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    await expect(customInstance({ url: "/api/admin/auth/me", method: "GET" })).resolves.toEqual({
      ok: true,
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: "https://api.example.test",
        url: "/api/admin/auth/me",
        withCredentials: false,
      }),
    );
  });

  test("allows browser session calls to include credentials and preserves failures", async () => {
    const request = vi.spyOn(axios, "request").mockRejectedValue(new Error("network failed"));
    await expect(
      customInstance(
        { url: "/api/admin/auth/browser/refresh", method: "POST" },
        { withCredentials: true },
      ),
    ).rejects.toThrow("network failed");
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ withCredentials: true }));
  });
});

test.each(["login", "refresh", "logout"])("browser %s supplies its required credential policy", async (operation) => {
  const request = vi.spyOn(axios, "request").mockResolvedValue({ data: {}, status: 200, statusText: "OK", headers: {}, config: { headers: new AxiosHeaders() } });
  await customInstance({ url: `/api/admin/auth/browser/${operation}`, method: "POST" });
  expect(request).toHaveBeenCalledWith(expect.objectContaining({ withCredentials: true, headers: expect.objectContaining({ "X-Admin-Request": "1" }) }));
});
