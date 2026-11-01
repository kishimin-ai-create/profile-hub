import { expect, test } from "vitest";
import { browserTestDatabaseUrl } from "../../e2e/public-api-db";

test("uses in-memory data when no database is configured", () => {
  expect(browserTestDatabaseUrl(undefined)).toBeNull();
});

test("accepts only the dedicated local browser test database", () => {
  expect(browserTestDatabaseUrl("postgres://test:test@127.0.0.1:5432/profile_hub_public_browser_test")).toBe("postgres://test:test@127.0.0.1:5432/profile_hub_public_browser_test");
  expect(() => browserTestDatabaseUrl("postgres://test:test@remote.example:5432/profile_hub_public_browser_test")).toThrow();
  expect(() => browserTestDatabaseUrl("postgres://test:test@127.0.0.1:5432/production")).toThrow();
  expect(() => browserTestDatabaseUrl("postgres://test:test@127.0.0.1:5432/profile_hub_public_browser_test?options=other")).toThrow();
});
