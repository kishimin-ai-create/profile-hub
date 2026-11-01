import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { reorderSocialLinks } from "./reorder-social-links";

const databaseUrl = process.env["TEST_DATABASE_URL"];
test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "reordering links in one section leaves the other section unchanged",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    const ids: string[] = [];
    try {
      const result = await client.query<{ id: string; section: string }>(
        "INSERT INTO social_links (section, kind, url, display_order) VALUES ('engineering','A','https://example.com/a',0),('engineering','B','https://example.com/b',1),('hobby','C','https://example.com/c',7) RETURNING id::text,section",
      );
      ids.push(...result.rows.map((row) => row.id));
      const first = result.rows.find((row) => row.section === "engineering");
      const second = result.rows
        .filter((row) => row.section === "engineering")
        .find((_row, index) => index === 1);
      if (!first || !second) throw new Error("Expected test rows");
      expect(await reorderSocialLinks(drizzle(client), "engineering", [first.id])).toBe(false);
      expect(await reorderSocialLinks(drizzle(client), "engineering", [second.id, first.id])).toBe(
        true,
      );
      const rows = await client.query<{ kind: string; display_order: number }>(
        "SELECT kind, display_order FROM social_links WHERE id = ANY($1::bigint[]) ORDER BY kind",
        [ids],
      );
      expect(rows.rows).toEqual([
        { kind: "A", display_order: 1 },
        { kind: "B", display_order: 0 },
        { kind: "C", display_order: 7 },
      ]);
    } finally {
      if (ids.length)
        await client.query("DELETE FROM social_links WHERE id = ANY($1::bigint[])", [ids]);
      await client.end();
    }
  },
);
