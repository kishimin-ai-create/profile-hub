import { expect, test } from "bun:test";

import { authenticateCredentials } from "./credentials";

test("credential verification returns identity only for the matching password", async () => {
  const account = { id: "42", email: "admin@example.com", passwordHash: "stored-hash", sessionVersion: 2 };
  const observed: string[] = [];
  const verify = (password: string, hash: string) => {
    observed.push(hash);
    return Promise.resolve(password === "correct");
  };
  const find = (email: string) => Promise.resolve(email === account.email ? account : null);
  expect(await authenticateCredentials(account.email, "correct", find, verify, "dummy-hash")).toEqual({ id: "42", email: account.email, sessionVersion: 2 });
  expect(await authenticateCredentials(account.email, "wrong", find, verify, "dummy-hash")).toBeNull();
  expect(await authenticateCredentials("absent@example.com", "correct", find, verify, "dummy-hash")).toBeNull();
  expect(observed).toEqual(["stored-hash", "stored-hash", "dummy-hash"]);
});
