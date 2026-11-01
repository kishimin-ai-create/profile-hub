import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { z } from "zod";

import { issueToken } from "../auth/token";
import app, { createApp, createConfiguredApp } from "../index";
import { getDatabase } from "../infrastructures/db/database";
import { listFavourites } from "./favourites";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "the public favourites endpoint returns favourites in administrator order",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO favourites (name, description, link, display_order) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)",
        [
          "Later",
          "Second",
          "https://example.com/later",
          2,
          "Earlier",
          "First",
          "https://example.com/earlier",
          1,
        ],
      );
      const app = createApp({
        listFavourites: () => listFavourites(drizzle(client)),
        listPortfolios: () => Promise.resolve([]),
        getPublicProfile: () =>
          Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
      });
      const response = await app.request("/api/public/favourites");
      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(body).toMatchObject({
        data: [
          { name: "Earlier", description: "First", link: "https://example.com/earlier" },
          { name: "Later", description: "Second", link: "https://example.com/later" },
        ],
      });
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "the configured API serves all public resources from the database",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const previousUrl = process.env["DATABASE_URL"];
    const previousSecret = process.env["JWT_SECRET"];
    const secret = "a-test-only-secret-with-at-least-32-bytes";
    process.env["DATABASE_URL"] = databaseUrl;
    process.env["JWT_SECRET"] = secret;
    let userId: string | undefined;
    let favouriteId: string | undefined;
    try {
      const response = await app.request("/api/public/favourites");
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: [] });
      const portfolios = await app.request("/api/public/portfolio?section=engineering");
      expect(portfolios.status).toBe(200);
      expect(await portfolios.json()).toEqual({ data: [] });
      const profile = await app.request("/api/public/profile");
      expect(profile.status).toBe(200);
      expect(await profile.json()).toEqual({
        data: { profile: null, skills: [], links: { engineering: [], hobby: [] } },
      });
      const database = getDatabase();
      const user = await database.$client.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id::text",
        [`configured-${crypto.randomUUID()}@example.test`, "unused-test-hash"],
      );
      userId = user.rows.find((_row, index) => index === 0)?.id;
      if (!userId) throw new Error("Expected a test administrator");
      const token = await issueToken(userId, 0, "access", secret);
      const configured = createConfiguredApp();
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const input = {
        name: "Tea",
        description: "Green tea",
        link: "https://example.com",
        displayOrder: 0,
      };
      const created = await configured.request("/api/admin/favourites", {
        method: "POST",
        headers,
        body: JSON.stringify(input),
      });
      expect(created.status).toBe(201);
      favouriteId = z.object({ data: z.object({ id: z.string() }) }).parse(await created.json())
        .data.id;
      const updated = await configured.request(`/api/admin/favourites/${favouriteId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...input, name: "Coffee" }),
      });
      expect(updated.status).toBe(200);
      expect(await updated.json()).toMatchObject({ data: { id: favouriteId, name: "Coffee" } });
      expect(
        (
          await configured.request(`/api/admin/favourites/${favouriteId}`, {
            method: "DELETE",
            headers,
          })
        ).status,
      ).toBe(204);
    } finally {
      if (favouriteId)
        await getDatabase().$client.query("DELETE FROM favourites WHERE id = $1", [favouriteId]);
      if (userId) await getDatabase().$client.query("DELETE FROM users WHERE id = $1", [userId]);
      await getDatabase().$client.end();
      if (previousSecret === undefined) delete process.env["JWT_SECRET"];
      else process.env["JWT_SECRET"] = previousSecret;
      if (previousUrl === undefined) {
        delete process.env["DATABASE_URL"];
      } else {
        process.env["DATABASE_URL"] = previousUrl;
      }
    }
  },
);
