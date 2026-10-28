import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { findSessionVersion, revokeSession } from "./session-version";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "session version lookup reflects updates and missing administrators",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        ["lookup-test@example.com", "example-hash"],
      );
      const id = result.rows[0].id;
      const database = drizzle(client);
      expect(await findSessionVersion(database, id)).toBe(0);
      await client.query("UPDATE users SET session_version = 1 WHERE id = $1", [id]);
      expect(await findSessionVersion(database, id)).toBe(1);
      await client.query("DELETE FROM users WHERE id = $1", [id]);
      expect(await findSessionVersion(database, id)).toBeNull();
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);

 test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "revocation advances the current version only once for the same session",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        ["revoke-test@example.com", "example-hash"],
      );
      const id = result.rows[0].id;
      const database = drizzle(client);
      expect(await revokeSession(database, id, 0)).toBe(true);
      expect(await revokeSession(database, id, 0)).toBe(false);
      expect(await findSessionVersion(database, id)).toBe(1);
      await client.query("DELETE FROM users WHERE id = $1", [id]);
      expect(await revokeSession(database, id, 1)).toBe(false);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);

