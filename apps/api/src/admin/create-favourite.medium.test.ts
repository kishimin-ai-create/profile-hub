import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createFavourite } from "./create-favourite";
import { deleteFavourite } from "./delete-favourite";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "a created favourite is persisted with its public fields",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const input = {
        name: "Tea",
        description: "Green tea",
        link: "https://example.com",
        displayOrder: 1,
      };
      const created = await createFavourite(drizzle(client), input);
      expect(created).toEqual({ ...input, id: expect.any(String) });
      const result = await client.query(
        "SELECT name, description, link, display_order FROM favourites WHERE id = $1",
        [created.id],
      );
      expect(result.rows).toEqual([
        {
          name: input.name,
          description: input.description,
          link: input.link,
          display_order: input.displayOrder,
        },
      ]);
      expect(await deleteFavourite(drizzle(client), created.id)).toBe(true);
      expect(await deleteFavourite(drizzle(client), created.id)).toBe(false);
      expect(
        (await client.query("SELECT id FROM favourites WHERE id = $1", [created.id])).rows,
      ).toEqual([]);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
