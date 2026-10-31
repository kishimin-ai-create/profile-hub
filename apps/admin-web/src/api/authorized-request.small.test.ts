import axios, { AxiosError, AxiosHeaders } from "axios";
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

test("refreshes an expired session once before retrying a read", async () => {
  const state = { token: "expired" };
  const error = new AxiosError("unauthorized");
  error.response = { data: null, status: 401, statusText: "Unauthorized", headers: {}, config: { headers: new AxiosHeaders() } };
  const send = vi.spyOn(axios, "request").mockRejectedValueOnce(error).mockResolvedValueOnce({ data: { data: [] }, status: 200, statusText: "OK", headers: {}, config: { headers: new AxiosHeaders() } });
  const restore = vi.fn<() => Promise<boolean>>(() => { state.token = "fresh"; return Promise.resolve(true); });
  const request = createAuthorizedRequest({ accessToken: () => state.token, restore });
  await expect(request({ method: "GET", url: "/api/admin/portfolio" })).resolves.toEqual({ data: [] });
  expect(restore).toHaveBeenCalledOnce();
  expect(send.mock.calls[1][0].headers).toMatchObject({ Authorization: "Bearer fresh" });
});

test("does not replay a failed write", async () => {
  const error = new AxiosError("unauthorized");
  error.response = { data: null, status: 401, statusText: "Unauthorized", headers: {}, config: { headers: new AxiosHeaders() } };
  const send = vi.spyOn(axios, "request").mockRejectedValue(error);
  const restore = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
  const request = createAuthorizedRequest({ accessToken: () => "expired", restore });
  await expect(request({ method: "POST", url: "/api/admin/portfolio", data: {} })).rejects.toThrow("unauthorized");
  expect(send).toHaveBeenCalledOnce();
  expect(restore).not.toHaveBeenCalled();
});
