import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { verifyPassword } from "../../auth/password";
import { provisionAdministrator } from "./admin-bootstrap";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "administrator provisioning hashes the password and refuses a second account",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM users");
      const database = drizzle(client);
      expect(
        await provisionAdministrator(database, "owner@example.com", "correct-passphrase"),
      ).toBe(true);
      const created = await client.query<{ email: string; password_hash: string }>(
        "SELECT email, password_hash FROM users",
      );
      expect(created.rows).toHaveLength(1);
      expect(created.rows[0].email).toBe("owner@example.com");
      expect(created.rows[0].password_hash).not.toContain("correct-passphrase");
      expect(await verifyPassword("correct-passphrase", created.rows[0].password_hash)).toBe(true);
      expect(
        await provisionAdministrator(database, "other@example.com", "another-passphrase"),
      ).toBe(false);
      expect((await client.query("SELECT id FROM users")).rows).toHaveLength(1);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
