import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { reorderFavourites } from "./reorder-favourites";

const databaseUrl = process.env["TEST_DATABASE_URL"];
test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "reordering requires all favourites and persists their new order",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    const ids: string[] = [];
    try {
      const result = await client.query<{ id: string }>(
        "INSERT INTO favourites (name, description, link, display_order) VALUES ('A', 'A', 'https://example.com/a', 0), ('B', 'B', 'https://example.com/b', 1) RETURNING id::text",
      );
      ids.push(...result.rows.map((row) => row.id));
      const first = ids.find((_id, index) => index === 0);
      const second = ids.find((_id, index) => index === 1);
      if (!first || !second) throw new Error("Expected test rows");
      expect(await reorderFavourites(drizzle(client), [first])).toBe(false);
      expect(await reorderFavourites(drizzle(client), [second, first])).toBe(true);
      const rows = await client.query<{ name: string; display_order: number }>(
        "SELECT name, display_order FROM favourites WHERE id = ANY($1::bigint[]) ORDER BY name",
        [ids],
      );
      expect(rows.rows).toEqual([
        { name: "A", display_order: 1 },
        { name: "B", display_order: 0 },
      ]);
    } finally {
      if (ids.length)
        await client.query("DELETE FROM favourites WHERE id = ANY($1::bigint[])", [ids]);
      await client.end();
    }
  },
);
