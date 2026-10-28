import { expect, test } from "bun:test";
import { getTableConfig } from "drizzle-orm/pg-core";
import { Client } from "pg";

import { loginRateLimits } from "./schema";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "login attempt state accepts one bounded shared counter",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const names = getTableConfig(loginRateLimits).checks.map((check) => check.name);
      const constraints = await client.query<{ conname: string }>(
        "SELECT conname FROM pg_constraint WHERE conrelid = 'login_rate_limits'::regclass AND conname = ANY($1::text[])",
        [names],
      );
      expect(constraints.rows.map((row) => row.conname).sort()).toEqual(names.sort());
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO login_rate_limits (id, attempts, window_started_at) VALUES ('login', 1, now())",
      );
      const rows = await client.query<{ attempts: number }>(
        "SELECT attempts FROM login_rate_limits WHERE id = 'login'",
      );
      expect(rows.rows[0].attempts).toBe(1);
      await client.query("SAVEPOINT invalid_attempt");
      let rejection: unknown;
      try {
        await client.query("UPDATE login_rate_limits SET attempts = -1 WHERE id = 'login'");
      } catch (error) {
        rejection = error;
      }
      expect(rejection).toMatchObject({ code: "23514" });
      await client.query("ROLLBACK TO SAVEPOINT invalid_attempt");
      rejection = undefined;
      try {
        await client.query(
          "INSERT INTO login_rate_limits (id, attempts, window_started_at) VALUES ('other', 1, now())",
        );
      } catch (error) {
        rejection = error;
      }
      expect(rejection).toMatchObject({ code: "23514" });
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
