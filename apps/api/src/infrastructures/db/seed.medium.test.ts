import { readFile } from "node:fs/promises";

import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "the example fixture provides portfolio and contact data in both sections",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- The fixture URL is fixed relative to this test, not supplied by a user.
    const fixture = await readFile(new URL("./seed-fixture.sql", import.meta.url), "utf8");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query(fixture);
      const portfolios = await client.query<{ section: string }>(
        "SELECT section FROM portfolios WHERE name IN ($1, $2) ORDER BY section",
        ["Example engineering project", "Example hobby project"],
      );
      const links = await client.query<{ section: string }>(
        "SELECT section FROM social_links WHERE url IN ($1, $2) ORDER BY section",
        ["https://example.com/engineering", "https://example.com/hobby"],
      );
      expect(portfolios.rows.map((row) => row.section)).toEqual(["engineering", "hobby"]);
      expect(links.rows.map((row) => row.section)).toEqual(["engineering", "hobby"]);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
