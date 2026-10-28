import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "login attempt state accepts one bounded shared counter",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO login_rate_limits (id, attempts, window_started_at) VALUES ('login', 1, now())");
      const rows = await client.query<{ attempts: number }>("SELECT attempts FROM login_rate_limits WHERE id = 'login'");
      expect(rows.rows[0].attempts).toBe(1);
      await client.query("SAVEPOINT invalid_attempt");
      await expect(client.query("UPDATE login_rate_limits SET attempts = -1 WHERE id = 'login'")).rejects.toMatchObject({ code: "23514" });
      await client.query("ROLLBACK TO SAVEPOINT invalid_attempt");
      await expect(client.query("INSERT INTO login_rate_limits (id, attempts, window_started_at) VALUES ('other', 1, now())")).rejects.toMatchObject({ code: "23514" });
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
