import { afterEach, expect, test, vi } from "vitest";

import { createAdminSession } from "./session";

afterEach(() => vi.restoreAllMocks());

test("login holds the access token only in memory and logout clears it", async () => {
  const storage = vi.spyOn(Storage.prototype, "setItem");
  const session = createAdminSession({
    login: () => Promise.resolve({ data: { accessToken: "access" } }),
    refresh: () => Promise.resolve(null),
    logout: () => Promise.resolve(),
  });
  expect(await session.login("admin@example.com", "password")).toBe(true);
  expect(session.accessToken()).toBe("access");
  expect(storage).not.toHaveBeenCalled();
  await session.logout();
  expect(session.accessToken()).toBeNull();
});

test("concurrent restores share a request and logout prevents stale restoration", async () => {
  const deferred = { resolve: (_value: unknown) => {} };
  const response = new Promise<unknown>((resolve) => { deferred.resolve = resolve; });
  const refresh = vi.fn<() => Promise<unknown | null>>(() => response);
  const logout = vi.fn<() => Promise<void>>(() => Promise.resolve());
  const session = createAdminSession({ login: () => Promise.resolve({ data: { accessToken: "login" } }), refresh, logout });
  const first = session.restore();
  const second = session.restore();
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  const signingOut = session.logout();
  deferred.resolve({ data: { accessToken: "stale" } });
  expect(await first).toBe(false);
  expect(await second).toBe(false);
  await signingOut;
  expect(logout).toHaveBeenCalledOnce();
  expect(session.accessToken()).toBeNull();
});

test("a missing session remains signed out and logout failure still clears memory", async () => {
  const session = createAdminSession({
    login: () => Promise.resolve({ data: { accessToken: "access" } }),
    refresh: () => Promise.resolve(null),
    logout: () => Promise.reject(new Error("network failed")),
  });
  expect(await session.restore()).toBe(false);
  expect(await session.login("admin@example.com", "password")).toBe(true);
  await expect(session.logout()).rejects.toThrow("network failed");
  expect(session.accessToken()).toBeNull();
});
