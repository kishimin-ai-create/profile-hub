import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";

import { createDrizzleConfig } from "./drizzle.config.factory";

// Pointing at a directory that cannot exist keeps the factory from falling back
// to a developer's real .env, which would make these assertions machine-specific.
const NO_DOTENV_DIR = "/profile-hub-nonexistent-cwd";

const createdDirectories: string[] = [];

/**
 * Writes a .env file into a throwaway directory and returns that directory.
 */
const withDotEnv = (contents: string): string => {
  const directory = mkdtempSync(join(tmpdir(), "profile-hub-drizzle-"));
  createdDirectories.push(directory);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The path comes from mkdtempSync, not from user input.
  writeFileSync(join(directory, ".env"), contents, "utf8");
  return directory;
};

afterEach(() => {
  while (createdDirectories.length > 0) {
    const directory = createdDirectories.pop();
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

/**
 * Reads the connection URL out of a Drizzle config.
 *
 * `Config` is a union discriminated by dialect, so `dbCredentials` is not
 * reachable on the common shape. Narrowing through `unknown` keeps the test
 * honest about what it actually inspects instead of asserting a type.
 */
const readConfiguredUrl = (config: unknown): string | undefined => {
  if (typeof config !== "object" || config === null || !("dbCredentials" in config)) {
    return undefined;
  }

  const { dbCredentials } = config;
  if (typeof dbCredentials !== "object" || dbCredentials === null || !("url" in dbCredentials)) {
    return undefined;
  }

  return typeof dbCredentials.url === "string" ? dbCredentials.url : undefined;
};

describe("createDrizzleConfig", () => {
  test("prefers DATABASE_URL when it is set", () => {
    const config = createDrizzleConfig(
      { DATABASE_URL: "postgresql://app:secret@db.example.com:5432/profile_hub" },
      NO_DOTENV_DIR,
    );

    expect(readConfiguredUrl(config)).toBe(
      "postgresql://app:secret@db.example.com:5432/profile_hub",
    );
  });

  test("assembles a URL from the individual variables when DATABASE_URL is absent", () => {
    const config = createDrizzleConfig(
      {
        DB_HOST: "localhost",
        DB_NAME: "profile_hub",
        DB_USER: "app",
        DB_PASSWORD: "secret",
      },
      NO_DOTENV_DIR,
    );

    expect(readConfiguredUrl(config)).toBe("postgresql://app:secret@localhost:5432/profile_hub");
  });

  test("percent-encodes credentials so a password cannot break the URL apart", () => {
    const config = createDrizzleConfig(
      {
        DB_HOST: "localhost",
        DB_NAME: "profile_hub",
        DB_USER: "a@b",
        DB_PASSWORD: "p/w",
      },
      NO_DOTENV_DIR,
    );

    expect(readConfiguredUrl(config)).toBe("postgresql://a%40b:p%2Fw@localhost:5432/profile_hub");
  });

  test("falls back to port 5432 when DB_PORT is not given", () => {
    const config = createDrizzleConfig(
      {
        DB_HOST: "localhost",
        DB_NAME: "profile_hub",
        DB_USER: "app",
        DB_PASSWORD: "secret",
        DB_PORT: undefined,
      },
      NO_DOTENV_DIR,
    );

    expect(readConfiguredUrl(config)).toBe("postgresql://app:secret@localhost:5432/profile_hub");
  });

  test("rejects a configuration with no usable connection details", () => {
    expect(() => createDrizzleConfig({}, NO_DOTENV_DIR)).toThrow("DATABASE_URL is required.");
  });

  test("does not accept an incomplete set of individual variables", () => {
    expect(() =>
      createDrizzleConfig({ DB_HOST: "localhost", DB_NAME: "profile_hub" }, NO_DOTENV_DIR),
    ).toThrow("DATABASE_URL is required.");
  });
});

describe("createDrizzleConfig reading .env", () => {
  test("falls back to DATABASE_URL in .env when the environment has none", () => {
    const cwd = withDotEnv("DATABASE_URL=postgresql://app:secret@localhost:5432/profile_hub\n");

    expect(readConfiguredUrl(createDrizzleConfig({}, cwd))).toBe(
      "postgresql://app:secret@localhost:5432/profile_hub",
    );
  });

  test("prefers the environment over .env", () => {
    const cwd = withDotEnv("DATABASE_URL=postgresql://from:file@localhost:5432/from_file\n");

    expect(
      readConfiguredUrl(
        createDrizzleConfig({ DATABASE_URL: "postgresql://from:env@localhost:5432/from_env" }, cwd),
      ),
    ).toBe("postgresql://from:env@localhost:5432/from_env");
  });

  test("ignores comments, blank lines, and lines without a separator", () => {
    const cwd = withDotEnv(
      [
        "# a comment",
        "",
        "NOT_A_PAIR",
        "DATABASE_URL=postgresql://app:secret@localhost:5432/profile_hub",
      ].join("\n"),
    );

    expect(readConfiguredUrl(createDrizzleConfig({}, cwd))).toBe(
      "postgresql://app:secret@localhost:5432/profile_hub",
    );
  });

  test("strips surrounding double quotes from a value", () => {
    const cwd = withDotEnv('DATABASE_URL="postgresql://app:secret@localhost:5432/profile_hub"\n');

    expect(readConfiguredUrl(createDrizzleConfig({}, cwd))).toBe(
      "postgresql://app:secret@localhost:5432/profile_hub",
    );
  });

  test("strips surrounding single quotes from a value", () => {
    const cwd = withDotEnv("DATABASE_URL='postgresql://app:secret@localhost:5432/profile_hub'\n");

    expect(readConfiguredUrl(createDrizzleConfig({}, cwd))).toBe(
      "postgresql://app:secret@localhost:5432/profile_hub",
    );
  });

  test("assembles a URL from the individual variables held in .env", () => {
    const cwd = withDotEnv(
      [
        "DB_HOST=db.example.com",
        "DB_PORT=15432",
        "DB_NAME=profile_hub",
        "DB_USER=app",
        "DB_PASSWORD=secret",
      ].join("\n"),
    );

    expect(readConfiguredUrl(createDrizzleConfig({}, cwd))).toBe(
      "postgresql://app:secret@db.example.com:15432/profile_hub",
    );
  });

  test("rejects a .env that carries none of the connection details", () => {
    const cwd = withDotEnv("UNRELATED=value\n");

    expect(() => createDrizzleConfig({}, cwd)).toThrow("DATABASE_URL is required.");
  });
});
