import axios, { AxiosHeaders } from "axios";
import { afterEach, expect, test, vi } from "vitest";
import { createAuthorizedRequest } from "./authorized-request";

afterEach(() => vi.restoreAllMocks());

test("uses the current in-memory credential only for an admin portfolio request", async () => {
  const request = vi.spyOn(axios, "request").mockResolvedValue({
    data: { data: [] },
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
  const client = createAuthorizedRequest({ accessToken: () => "access" });
  await expect(client({ method: "GET", url: "/api/admin/portfolio" })).resolves.toEqual({
    data: [],
  });
  expect(request).toHaveBeenCalledOnce();
  expect(request.mock.calls[0][0].headers).toMatchObject({ Authorization: "Bearer access" });
  expect(request.mock.calls[0][0].withCredentials).toBe(false);
});

test("does not send a request without a token or to another origin", async () => {
  const request = vi.spyOn(axios, "request");
  await expect(
    createAuthorizedRequest({ accessToken: () => null })({
      method: "GET",
      url: "/api/admin/portfolio",
    }),
  ).rejects.toThrow("Authentication required");
  await expect(
    createAuthorizedRequest({ accessToken: () => "access" })({
      method: "GET",
      url: "https://attacker.example/api/admin/portfolio",
    }),
  ).rejects.toThrow("Invalid administrator request");
  expect(request).not.toHaveBeenCalled();
});
