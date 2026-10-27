import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "portfolio entries retain their section and allow shared order values",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{ section: string }>(
        "INSERT INTO portfolios (section, name, summary, technologies, display_order) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10) RETURNING section",
        [
          "engineering",
          "First",
          "Summary",
          ["TypeScript"],
          1,
          "hobby",
          "Second",
          "Summary",
          ["Bun"],
          1,
        ],
      );
      expect(result.rows.map((row) => row.section)).toEqual(["engineering", "hobby"]);
      let rejection: unknown;
      try {
        await client.query(
          "INSERT INTO portfolios (section, name, summary, technologies, display_order) VALUES ($1, $2, $3, $4, $5)",
          ["engineering", "Invalid", null, ["Bun"], 2],
        );
      } catch (error) {
        rejection = error;
      }
      expect(rejection).toMatchObject({ code: "23502" });
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
