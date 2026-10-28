import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { consumeLoginAttempt } from "./login-throttle";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "login throttle allows five attempts per shared minute and resets after the window",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM login_rate_limits");
      const database = drizzle(client);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        expect(await consumeLoginAttempt(database)).toBe(true);
      }
      expect(await consumeLoginAttempt(database)).toBe(false);
      await client.query("UPDATE login_rate_limits SET window_started_at = statement_timestamp() - interval '61 seconds' WHERE id = 'login'");
      expect(await consumeLoginAttempt(database)).toBe(true);
      const state = await client.query<{ attempts: number }>("SELECT attempts FROM login_rate_limits WHERE id = 'login'");
      expect(state.rows[0].attempts).toBe(1);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
