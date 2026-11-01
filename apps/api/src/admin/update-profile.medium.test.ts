import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { updateProfile } from "./update-profile";

const databaseUrl = process.env["TEST_DATABASE_URL"];
test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "saving an empty profile creates it and subsequent saves replace the same row",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("CREATE TEMP TABLE profiles (LIKE public.profiles INCLUDING ALL)");
      const input = { name: "Example", title: null, bio: null, avatarUrl: null };
      const first = await updateProfile(drizzle(client), input);
      const second = await updateProfile(drizzle(client), { ...input, name: "Updated" });
      expect(second).toEqual({ ...input, id: first.id, name: "Updated" });
      const result = await client.query("SELECT name FROM profiles");
      expect(result.rows).toEqual([{ name: "Updated" }]);
    } finally {
      await client.end();
    }
  },
);
