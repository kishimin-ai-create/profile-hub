import { expect, test } from "bun:test";
import { sign } from "hono/jwt";

import { issueToken, verifyToken } from "./token";

const secret = "a-test-only-secret-with-at-least-32-bytes";

test("signed access tokens preserve identity and reject a different key or kind", async () => {
  const token = await issueToken("42", 3, "access", secret);
  const second = await issueToken("42", 3, "access", secret);
  expect(second).not.toBe(token);
  expect(await verifyToken(token, "access", secret)).toMatchObject({
    sub: "42",
    version: 3,
    kind: "access",
  });
  expect(await verifyToken(token, "refresh", secret)).toBeNull();
  expect(await verifyToken(token, "access", "a-different-test-secret-with-32-bytes")).toBeNull();
});

test("refresh tokens are distinct from access tokens", async () => {
  const token = await issueToken("42", 3, "refresh", secret);
  expect(await verifyToken(token, "refresh", secret)).toMatchObject({ sub: "42", kind: "refresh" });
  expect(await verifyToken(token, "access", secret)).toBeNull();
});

test("expired and incomplete signed tokens are rejected", async () => {
  const now = Math.floor(Date.now() / 1000);
  const common = {
    iss: "profile-hub",
    aud: "profile-hub-admin",
    sub: "42",
    version: 0,
    kind: "access",
    jti: crypto.randomUUID(),
    iat: now - 60,
  };
  const expired = await sign({ ...common, exp: now - 1 }, secret, "HS256");
  const missingExpiry = await sign(common, secret, "HS256");
  expect(await verifyToken(expired, "access", secret)).toBeNull();
  expect(await verifyToken(missingExpiry, "access", secret)).toBeNull();
});

test("token signing rejects a short secret", async () => {
  await expect(issueToken("42", 0, "access", "short")).rejects.toThrow();
});

test("tokens with invalid audience, claims, lifetime or excessive size are rejected", async () => {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: "profile-hub",
    aud: "profile-hub-admin",
    sub: "42",
    version: 0,
    kind: "access",
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + 900,
  };
  for (const invalid of [
    { ...claims, aud: "other-audience" },
    { ...claims, sub: "0" },
    { ...claims, version: -1 },
    { ...claims, jti: "invalid" },
    { ...claims, exp: now + 901 },
  ]) {
    expect(await verifyToken(await sign(invalid, secret, "HS256"), "access", secret)).toBeNull();
  }
  expect(await verifyToken("x".repeat(4097), "access", secret)).toBeNull();
  await expect(issueToken("0", 0, "access", secret)).rejects.toThrow();
  await expect(issueToken("42", -1, "access", secret)).rejects.toThrow();
});
