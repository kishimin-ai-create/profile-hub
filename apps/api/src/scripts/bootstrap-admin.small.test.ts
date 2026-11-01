import { expect, test } from "bun:test";

import { runBootstrap } from "./bootstrap-service";

test("bootstrap passes the complete password without writing it to output", async () => {
  const password = "long-secret-\n";
  const result = await runBootstrap("owner@example.com", password, (email, received) =>
    Promise.resolve(email === "owner@example.com" && received === password),
  );
  expect(result).toEqual({ exitCode: 0, message: "Administrator created" });
  expect(result.message).not.toContain(password);
});

test("bootstrap reports refusal and errors without leaking credentials", async () => {
  const refused = await runBootstrap("owner@example.com", "secret-value", () =>
    Promise.resolve(false),
  );
  expect(refused).toEqual({ exitCode: 1, message: "Administrator already exists" });
  const failed = await runBootstrap("owner@example.com", "secret-value", () =>
    Promise.reject(new Error("secret-value")),
  );
  expect(failed).toEqual({ exitCode: 1, message: "Administrator provisioning failed" });
});
