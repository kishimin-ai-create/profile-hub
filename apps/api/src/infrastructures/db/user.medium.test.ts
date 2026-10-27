import { expect, test } from "bun:test";
import { Client } from "pg";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl)("administrator email addresses are unique", async () => {
  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL is required");
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [
      "admin@example.com",
      "example-hash",
    ]);
    let rejection: unknown;
    try {
      await client.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [
        "admin@example.com",
        "example-hash",
      ]);
    } catch (error) {
      rejection = error;
    }
    expect(rejection).toMatchObject({ code: "23505" });
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
});
