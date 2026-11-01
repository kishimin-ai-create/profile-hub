import { expect, test } from "bun:test";

import { hashPassword, verifyPassword } from "./password";

test("password hashes use unique salts and verify the complete password", async () => {
  const value = "長いパスフレーズ-".repeat(12);
  const first = await hashPassword(value);
  const second = await hashPassword(value);

  expect(first).toStartWith("$argon2id$");
  expect(first).not.toBe(second);
  expect(first).not.toContain(value);
  expect(await verifyPassword(value, first)).toBe(true);
  expect(await verifyPassword(`${value}different`, first)).toBe(false);
});
