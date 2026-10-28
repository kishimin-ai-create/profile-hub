import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { refreshSession } from "./auth/refresh-session";
import { issueToken } from "./auth/token";
import { findSessionVersion, revokeSession } from "./infrastructures/db/session-version";

const databaseUrl = process.env["TEST_DATABASE_URL"];
const secret = "a-test-only-secret-with-at-least-32-bytes";

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "only one concurrent refresh wins across database connections",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const first = new Client({ connectionString: databaseUrl });
    const second = new Client({ connectionString: databaseUrl });
    await first.connect();
    await second.connect();
    const email = `refresh-race-${crypto.randomUUID()}@example.com`;
    try {
      const result = await first.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        [email, "test-hash"],
      );
      const id = result.rows[0].id;
      const firstDb = drizzle(first);
      const secondDb = drizzle(second);
      const token = await issueToken(id, 0, "refresh", secret);
      let arrived = 0;
      let release: () => void = () => {};
      const bothRead = new Promise<void>((resolve) => {
        release = resolve;
      });
      const lookup = (database: typeof firstDb) => async (subject: string) => {
        const version = await findSessionVersion(database, subject);
        arrived += 1;
        if (arrived === 2) release();
        await bothRead;
        return version;
      };
      const results = await Promise.all([
        refreshSession(token, secret, lookup(firstDb), (subject, version) =>
          revokeSession(firstDb, subject, version),
        ),
        refreshSession(token, secret, lookup(secondDb), (subject, version) =>
          revokeSession(secondDb, subject, version),
        ),
      ]);
      expect(results.filter((value) => value !== null)).toHaveLength(1);
      expect(await findSessionVersion(firstDb, id)).toBe(1);
    } finally {
      await first.query("DELETE FROM users WHERE email = $1", [email]);
      await first.end();
      await second.end();
    }
  },
);
