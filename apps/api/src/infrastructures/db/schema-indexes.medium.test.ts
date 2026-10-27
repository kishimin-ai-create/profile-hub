import { expect, test } from "bun:test";
import { getTableConfig } from "drizzle-orm/pg-core";
import { Client } from "pg";

import { favourites, portfolios, skills, socialLinks } from "./schema";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "declared ordering indexes exist in the migrated database",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const indexes = [skills, favourites, socialLinks, portfolios]
      .flatMap((table) => getTableConfig(table).indexes.map((index) => index.config.name))
      .filter((name): name is string => name !== undefined);
    expect(indexes).toHaveLength(4);
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const result = await client.query<{ indexname: string }>(
        "SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND indexname = ANY($1::text[])",
        [indexes],
      );
      expect(result.rows.map((row) => row.indexname).sort()).toEqual(indexes.sort());
    } finally {
      await client.end();
    }
  },
);
