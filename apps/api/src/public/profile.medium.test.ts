import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createApp } from "../index";
import { getPublicProfile } from "./profile";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "the public profile groups links by section and keeps skills ordered",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO profiles (name, title) VALUES ($1, $2)", [
        "Example",
        "Developer",
      ]);
      await client.query("INSERT INTO skills (name, display_order) VALUES ($1, $2), ($3, $4)", [
        "Later",
        2,
        "Earlier",
        1,
      ]);
      await client.query(
        "INSERT INTO social_links (section, kind, url, display_order) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)",
        [
          "engineering",
          "website",
          "https://example.com/engineering",
          1,
          "hobby",
          "website",
          "https://example.com/hobby",
          1,
        ],
      );
      await client.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [
        "private@example.com",
        "private-hash",
      ]);
      const app = createApp({
        listFavourites: () => Promise.resolve([]),
        listPortfolios: () => Promise.resolve([]),
        getPublicProfile: () => getPublicProfile(drizzle(client)),
      });
      const response = await app.request("/api/public/profile");
      const body: unknown = await response.json();
      expect(response.status).toBe(200);
      expect(body).toMatchObject({
        data: {
          profile: { name: "Example", title: "Developer", bio: null, avatarUrl: null },
          skills: [{ name: "Earlier" }, { name: "Later" }],
          links: {
            engineering: [{ url: "https://example.com/engineering" }],
            hobby: [{ url: "https://example.com/hobby" }],
          },
        },
      });
      expect(JSON.stringify(body)).not.toContain("private@example.com");
      expect(JSON.stringify(body)).not.toContain("private-hash");
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
