import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "skills have generated identifiers and allow duplicate display orders",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "INSERT INTO skills (name, display_order) VALUES ($1, $2), ($3, $4) RETURNING id, created_at, updated_at",
        ["TypeScript", 1, "PostgreSQL", 1],
      );
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].id).not.toBe(result.rows[1].id);
      expect(result.rows[0].created_at).toBeInstanceOf(Date);
      expect(result.rows[0].updated_at).toBeInstanceOf(Date);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
