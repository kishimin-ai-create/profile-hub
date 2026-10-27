import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl)("a profile can omit optional introduction details", async () => {
  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL is required");
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{
      name: string;
      title: string | null;
      bio: string | null;
      avatar_url: string | null;
    }>("INSERT INTO profiles (name) VALUES ($1) RETURNING name, title, bio, avatar_url", [
      "Example",
    ]);
    expect(result.rows[0]).toEqual({ name: "Example", title: null, bio: null, avatar_url: null });
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
});
