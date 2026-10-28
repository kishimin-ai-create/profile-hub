import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { findAdminByEmail } from "../infrastructures/db/admin-account";
import { authenticateCredentials } from "./credentials";
import { hashPassword, verifyPassword } from "./password";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "real administrator credentials authenticate without returning the password hash",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const passwordHash = await hashPassword("correct-passphrase");
      const dummyHash = await hashPassword("unused-dummy-passphrase");
      const inserted = await client.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        ["credential-integration@example.com", passwordHash],
      );
      const database = drizzle(client);
      const findAccount = (email: string) => findAdminByEmail(database, email);
      expect(
        await authenticateCredentials(
          "credential-integration@example.com",
          "correct-passphrase",
          findAccount,
          verifyPassword,
          dummyHash,
        ),
      ).toEqual({
        id: inserted.rows[0].id,
        email: "credential-integration@example.com",
        sessionVersion: 0,
      });
      expect(
        await authenticateCredentials(
          "credential-integration@example.com",
          "wrong-passphrase",
          findAccount,
          verifyPassword,
          dummyHash,
        ),
      ).toBeNull();
      expect(
        await authenticateCredentials(
          "unknown@example.com",
          "correct-passphrase",
          findAccount,
          verifyPassword,
          dummyHash,
        ),
      ).toBeNull();
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
