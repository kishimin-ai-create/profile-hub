import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import app, { createApp } from "../index";
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
  "the configured API returns a successful favourites response",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const previousUrl = process.env["DATABASE_URL"];
    process.env["DATABASE_URL"] = databaseUrl;
    try {
      const response = await app.request("/api/public/favourites");
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: [] });
    } finally {
      await getDatabase().$client.end();
      if (previousUrl === undefined) {
        delete process.env["DATABASE_URL"];
      } else {
        process.env["DATABASE_URL"] = previousUrl;
      }
    }
  },
);
