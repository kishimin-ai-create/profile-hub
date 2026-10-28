import { expect, test } from "bun:test";

import { authenticateSession } from "./session";
import { issueToken } from "./token";

const secret = "a-test-only-secret-with-at-least-32-bytes";

test("accepts only a session whose administrator and version still exist", async () => {
  const token = await issueToken("42", 3, "access", secret);
  const findVersion = (id: string) => Promise.resolve(id === "42" ? 3 : null);
  expect(await authenticateSession(token, "access", secret, findVersion)).toMatchObject({
    sub: "42",
  });
  expect(await authenticateSession(token, "access", secret, () => Promise.resolve(4))).toBeNull();
  expect(
    await authenticateSession(token, "access", secret, () => Promise.resolve(null)),
  ).toBeNull();
  expect(await authenticateSession(token, "refresh", secret, findVersion)).toBeNull();
  expect(await authenticateSession("invalid", "access", secret, findVersion)).toBeNull();
});
