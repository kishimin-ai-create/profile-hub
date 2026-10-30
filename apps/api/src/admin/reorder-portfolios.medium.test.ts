import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { reorderPortfolios } from "./reorder-portfolios";

const databaseUrl = process.env["TEST_DATABASE_URL"];
test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "reordering one section leaves the other section unchanged",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    const ids: string[] = [];
    try {
      const result = await client.query<{ id: string; section: string }>(
        "INSERT INTO portfolios (section,name,summary,technologies,display_order) VALUES ('engineering','Reorder A','A',ARRAY['Bun'],0),('engineering','Reorder B','B',ARRAY['Bun'],1),('hobby','Reorder C','C',ARRAY['Art'],7) RETURNING id::text,section",
      );
      ids.push(...result.rows.map((row) => row.id));
      const first = result.rows.find((row) => row.section === "engineering");
      const second = result.rows
        .filter((row) => row.section === "engineering")
        .find((_row, index) => index === 1);
      if (!first || !second) throw new Error("Expected test rows");
      expect(await reorderPortfolios(drizzle(client), "engineering", [second.id, first.id])).toBe(
        true,
      );
      const rows = await client.query<{ name: string; display_order: number }>(
        "SELECT name,display_order FROM portfolios WHERE id = ANY($1::bigint[]) ORDER BY name",
        [ids],
      );
      expect(rows.rows).toEqual([
        { name: "Reorder A", display_order: 1 },
        { name: "Reorder B", display_order: 0 },
        { name: "Reorder C", display_order: 7 },
      ]);
      expect(await reorderPortfolios(drizzle(client), "engineering", [first.id])).toBe(false);
      expect(await reorderPortfolios(drizzle(client), "engineering", [first.id, first.id])).toBe(
        false,
      );
    } finally {
      if (ids.length)
        await client.query("DELETE FROM portfolios WHERE id = ANY($1::bigint[])", [ids]);
      await client.end();
    }
  },
);
