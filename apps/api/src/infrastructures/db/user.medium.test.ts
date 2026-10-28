import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "administrator email addresses are unique",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [
        "admin@example.com",
        "example-hash",
      ]);
      let rejection: unknown;
      try {
        await client.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [
          "admin@example.com",
          "example-hash",
        ]);
      } catch (error) {
        rejection = error;
      }
      expect(rejection).toMatchObject({ code: "23505" });
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "administrator session versions start at zero and can be advanced",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const created = await client.query<{ id: string; session_version: number }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, session_version",
        ["version-test@example.com", "example-hash"],
      );
      expect(created.rows[0].session_version).toBe(0);
      const updated = await client.query<{ session_version: number }>(
        "UPDATE users SET session_version = session_version + 1 WHERE id = $1 RETURNING session_version",
        [created.rows[0].id],
      );
      expect(updated.rows[0].session_version).toBe(1);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
