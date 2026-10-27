import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "social links separate sections and restrict mailto to email",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{ section: string }>(
        "INSERT INTO social_links (section, kind, url, display_order) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8) RETURNING section",
        [
          "engineering",
          "email",
          "mailto:test@example.com",
          1,
          "hobby",
          "website",
          "https://example.com",
          1,
        ],
      );
      expect(result.rows.map((row) => row.section)).toEqual(["engineering", "hobby"]);
      let rejection: unknown;
      try {
        await client.query(
          "INSERT INTO social_links (section, kind, url, display_order) VALUES ($1, $2, $3, $4)",
          ["hobby", "website", "mailto:test@example.com", 2],
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
