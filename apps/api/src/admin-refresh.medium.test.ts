import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { z } from "zod";

import { issueToken } from "./auth/token";
import { createApp } from "./index";
import { findSessionVersion, revokeSession } from "./infrastructures/db/session-version";

const databaseUrl = process.env["TEST_DATABASE_URL"];
const secret = "a-test-only-secret-with-at-least-32-bytes";

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "refresh rotates PostgreSQL state and invalidates old credentials",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        ["refresh-integration@example.com", "test-hash"],
      );
      const id = result.rows[0].id;
      const database = drizzle(client);
      const app = createApp({
        listFavourites: () => Promise.resolve([]),
        listPortfolios: () => Promise.resolve([]),
        getPublicProfile: () =>
          Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
        adminSecret: secret,
        findAdminSessionVersion: (subject) => findSessionVersion(database, subject),
        revokeAdminSession: (subject, version) => revokeSession(database, subject, version),
      });
      const oldAccess = await issueToken(id, 0, "access", secret);
      const oldRefresh = await issueToken(id, 0, "refresh", secret);
      const headers = { Authorization: `Bearer ${oldRefresh}` };
      const response = await app.request("/api/admin/auth/refresh", { method: "POST", headers });
      expect(response.status).toBe(200);
      const body = z
        .object({ data: z.object({ accessToken: z.string() }) })
        .parse(await response.json());
      expect(
        (
          await app.request("/api/admin/auth/me", {
            headers: { Authorization: `Bearer ${body.data.accessToken}` },
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await app.request("/api/admin/auth/me", {
            headers: { Authorization: `Bearer ${oldAccess}` },
          })
        ).status,
      ).toBe(401);
      expect(
        (await app.request("/api/admin/auth/refresh", { method: "POST", headers })).status,
      ).toBe(401);
      expect(await findSessionVersion(database, id)).toBe(1);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
