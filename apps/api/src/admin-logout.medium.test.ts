import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { issueToken } from "./auth/token";
import { createApp } from "./index";
import { findSessionVersion, revokeSession } from "./infrastructures/db/session-version";

const databaseUrl = process.env["TEST_DATABASE_URL"];
const secret = "a-test-only-secret-with-at-least-32-bytes";

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "logout revokes an administrator token through PostgreSQL",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        ["logout-integration@example.com", "test-hash"],
      );
      const database = drizzle(client);
      const app = createApp({
        listFavourites: () => Promise.resolve([]),
        listPortfolios: () => Promise.resolve([]),
        getPublicProfile: () =>
          Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
        adminSecret: secret,
        findAdminSessionVersion: (id) => findSessionVersion(database, id),
        revokeAdminSession: (id, version) => revokeSession(database, id, version),
      });
      const token = await issueToken(result.rows[0].id, 0, "access", secret);
      const headers = { Authorization: `Bearer ${token}` };
      expect((await app.request("/api/admin/auth/me", { headers })).status).toBe(200);
      expect(
        (await app.request("/api/admin/auth/logout", { method: "POST", headers })).status,
      ).toBe(204);
      expect((await app.request("/api/admin/auth/me", { headers })).status).toBe(401);
      expect(await findSessionVersion(database, result.rows[0].id)).toBe(1);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
