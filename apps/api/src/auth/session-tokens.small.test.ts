import { expect, test } from "bun:test";

import { issueSessionTokens } from "./session-tokens";
import { verifyToken } from "./token";

const secret = "a-test-only-secret-with-at-least-32-bytes";

test("issues distinct access and refresh tokens bound to the administrator version", async () => {
  const tokens = await issueSessionTokens("42", 3, secret);
  expect(tokens.accessToken).not.toBe(tokens.refreshToken);
  expect(await verifyToken(tokens.accessToken, "access", secret)).toMatchObject({ sub: "42", version: 3 });
  expect(await verifyToken(tokens.refreshToken, "refresh", secret)).toMatchObject({ sub: "42", version: 3 });
  expect(await verifyToken(tokens.refreshToken, "access", secret)).toBeNull();
});
