import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { findAdminByEmail } from "./admin-account";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "lookup returns only the requested administrator's authentication data",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query<{ id: string }>(
        "INSERT INTO users (email, password_hash, session_version) VALUES ($1, $2, $3) RETURNING id",
        ["account-test@example.com", "test-hash", 2],
      );
      const database = drizzle(client);
      expect(await findAdminByEmail(database, "account-test@example.com")).toEqual({
        id: inserted.rows[0].id, email: "account-test@example.com", passwordHash: "test-hash", sessionVersion: 2,
      });
      expect(await findAdminByEmail(database, "absent@example.com")).toBeNull();
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
