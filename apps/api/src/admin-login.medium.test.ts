import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { z } from "zod";

import { loginAdmin } from "./auth/login";
import { hashPassword, verifyPassword } from "./auth/password";
import { createApp } from "./index";
import { findAdminByEmail } from "./infrastructures/db/admin-account";
import { consumeLoginAttempt } from "./infrastructures/db/login-throttle";
import { findSessionVersion, revokeSession } from "./infrastructures/db/session-version";

const databaseUrl = process.env["TEST_DATABASE_URL"];
const secret = "a-test-only-secret-with-at-least-32-bytes";

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "login authenticates with PostgreSQL, enforces its budget, and revokes on logout",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM login_rate_limits");
      const hash = await hashPassword("correct-passphrase");
      const dummyHash = await hashPassword("dummy-passphrase");
      const inserted = await client.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        ["http-login@example.com", hash],
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
        loginAdmin: (email, password) =>
          loginAdmin(email, password, {
            consumeAttempt: () => consumeLoginAttempt(database),
            findAccount: (value) => findAdminByEmail(database, value),
            verifyPassword,
            advanceSession: (id, version) => revokeSession(database, id, version),
            dummyHash,
            secret,
          }),
      });
      const login = (email: string, password: string) =>
        app.request("/api/admin/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      const wrong = await login("http-login@example.com", "wrong");
      const missing = await login("missing@example.com", "wrong");
      expect(wrong.status).toBe(401);
      expect(missing.status).toBe(401);
      expect(await wrong.json()).toEqual(await missing.json());
      const response = await login("http-login@example.com", "correct-passphrase");
      expect(response.status).toBe(200);
      const body = z
        .object({ data: z.object({ accessToken: z.string(), refreshToken: z.string() }) })
        .parse(await response.json());
      const headers = { Authorization: `Bearer ${body.data.accessToken}` };
      expect(await (await app.request("/api/admin/auth/me", { headers })).json()).toEqual({
        data: { id: inserted.rows[0].id },
      });
      expect(
        (await app.request("/api/admin/auth/logout", { method: "POST", headers })).status,
      ).toBe(204);
      expect((await app.request("/api/admin/auth/me", { headers })).status).toBe(401);
      expect(
        (
          await app.request("/api/admin/auth/refresh", {
            method: "POST",
            headers: { Authorization: `Bearer ${body.data.refreshToken}` },
          })
        ).status,
      ).toBe(401);
      expect((await login("http-login@example.com", "wrong")).status).toBe(401);
      expect((await login("http-login@example.com", "wrong")).status).toBe(401);
      expect((await login("http-login@example.com", "correct-passphrase")).status).toBe(429);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
