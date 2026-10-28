import { expect, test } from "bun:test";

import { refreshSession } from "./refresh-session";
import { issueToken, verifyToken } from "./token";

const secret = "a-test-only-secret-with-at-least-32-bytes";

test("refresh rotates the session and rejects reuse of the old refresh token", async () => {
  let version = 3;
  const findVersion = () => Promise.resolve(version);
  const advance = (_id: string, expected: number) => {
    if (version !== expected) return Promise.resolve(false);
    version += 1;
    return Promise.resolve(true);
  };
  const oldToken = await issueToken("42", 3, "refresh", secret);
  const result = await refreshSession(oldToken, secret, findVersion, advance);
  expect(result).not.toBeNull();
  if (!result) throw new Error("Expected a refreshed session");
  expect(await verifyToken(result.accessToken, "access", secret)).toMatchObject({ sub: "42", version: 4 });
  expect(await verifyToken(result.refreshToken, "refresh", secret)).toMatchObject({ sub: "42", version: 4 });
  expect(await refreshSession(oldToken, secret, findVersion, advance)).toBeNull();
  expect(await refreshSession(result.accessToken, secret, findVersion, advance)).toBeNull();
});
