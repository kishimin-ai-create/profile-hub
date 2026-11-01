import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createSkill } from "./create-skill";

const databaseUrl = process.env["TEST_DATABASE_URL"];
test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "creating a skill persists its name and display order",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const input = { name: "TypeScript", displayOrder: 1 };
      const created = await createSkill(drizzle(client), input);
      expect(created).toEqual({ ...input, id: expect.any(String) });
      const rows = await client.query("SELECT name, display_order FROM skills WHERE id = $1", [
        created.id,
      ]);
      expect(rows.rows).toEqual([{ name: input.name, display_order: input.displayOrder }]);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
