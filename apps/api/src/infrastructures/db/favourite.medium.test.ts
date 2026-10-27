import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl)(
  "favourites require a web link and allow duplicate display orders",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "INSERT INTO favourites (name, description, link, display_order) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8) RETURNING id",
        [
          "First",
          "Description",
          "https://example.com",
          1,
          "Second",
          "Description",
          "http://example.com",
          1,
        ],
      );
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].id).not.toBe(result.rows[1].id);
      await expect(
        client.query(
          "INSERT INTO favourites (name, description, link, display_order) VALUES ($1, $2, $3, $4)",
          ["Unsafe", "Description", "javascript:alert(1)", 2],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
