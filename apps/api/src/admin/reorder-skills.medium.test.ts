import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { reorderSkills } from "./reorder-skills";

const databaseUrl = process.env["TEST_DATABASE_URL"];
test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "reordering requires all skills and persists their new order",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    const ids: string[] = [];
    try {
      const result = await client.query<{ id: string }>(
        "INSERT INTO skills (name, display_order) VALUES ('A', 0), ('B', 1) RETURNING id::text",
      );
      ids.push(...result.rows.map((row) => row.id));
      const first = ids.find((_id, index) => index === 0);
      const second = ids.find((_id, index) => index === 1);
      if (!first || !second) throw new Error("Expected test rows");
      expect(await reorderSkills(drizzle(client), [first])).toBe(false);
      expect(await reorderSkills(drizzle(client), [second, first])).toBe(true);
      const rows = await client.query<{ name: string; display_order: number }>(
        "SELECT name, display_order FROM skills WHERE id = ANY($1::bigint[]) ORDER BY name",
        [ids],
      );
      expect(rows.rows).toEqual([
        { name: "A", display_order: 1 },
        { name: "B", display_order: 0 },
      ]);
    } finally {
      if (ids.length) await client.query("DELETE FROM skills WHERE id = ANY($1::bigint[])", [ids]);
      await client.end();
    }
  },
);
