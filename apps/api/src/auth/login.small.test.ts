import { expect, test } from "bun:test";

import { loginAdmin } from "./login";
import { verifyToken } from "./token";

const secret = "a-test-only-secret-with-at-least-32-bytes";
const account = { id: "42", email: "admin@example.com", passwordHash: "hash", sessionVersion: 2 };

test("login checks the shared budget before credential verification", async () => {
  let lookups = 0;
  const result = await loginAdmin("admin@example.com", "password", {
    consumeAttempt: () => Promise.resolve(false),
    findAccount: () => {
      lookups += 1;
      return Promise.resolve(account);
    },
    verifyPassword: () => Promise.resolve(true),
    advanceSession: () => Promise.resolve(true),
    dummyHash: "dummy",
    secret,
  });
  expect(result).toEqual({ status: "limited" });
  expect(lookups).toBe(0);
});

test("login rotates the session before returning credentials", async () => {
  let version = 2;
  const dependencies = {
    consumeAttempt: () => Promise.resolve(true),
    findAccount: () => Promise.resolve(account),
    verifyPassword: (password: string) => Promise.resolve(password === "correct"),
    advanceSession: (_id: string, current: number) => {
      if (version !== current) return Promise.resolve(false);
      version += 1;
      return Promise.resolve(true);
    },
    dummyHash: "dummy",
    secret,
  };
  expect(await loginAdmin(account.email, "wrong", dependencies)).toEqual({ status: "invalid" });
  expect(version).toBe(2);
  const result = await loginAdmin(account.email, "correct", dependencies);
  expect(result.status).toBe("success");
  if (result.status !== "success") throw new Error("Expected a session");
  expect(await verifyToken(result.tokens.accessToken, "access", secret)).toMatchObject({
    sub: "42",
    version: 3,
  });
  expect(await verifyToken(result.tokens.refreshToken, "refresh", secret)).toMatchObject({
    sub: "42",
    version: 3,
  });
  expect(await loginAdmin(account.email, "correct", dependencies)).toEqual({ status: "invalid" });
});

test("invalid signing configuration does not revoke an existing session", async () => {
  let advanced = false;
  await expect(loginAdmin(account.email, "correct", {
    consumeAttempt: () => Promise.resolve(true),
    findAccount: () => Promise.resolve(account),
    verifyPassword: () => Promise.resolve(true),
    advanceSession: () => { advanced = true; return Promise.resolve(true); },
    dummyHash: "dummy",
    secret: "short",
  })).rejects.toThrow();
  expect(advanced).toBe(false);
});
