import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createApp } from "../index";
import { listPortfolios } from "./portfolios";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "public portfolios stay within the requested section and display order",
  async () => {
    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL is required");
    }
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "INSERT INTO portfolios (section, name, summary, technologies, display_order) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15)",
        [
          "engineering",
          "Later",
          "Later work",
          ["Bun"],
          2,
          "hobby",
          "Hobby work",
          "Hobby",
          ["Art"],
          1,
          "engineering",
          "Earlier",
          "Earlier work",
          ["TypeScript"],
          1,
        ],
      );
      const app = createApp({
        listFavourites: () => Promise.resolve([]),
        listPortfolios: (requestedSection) => listPortfolios(drizzle(client), requestedSection),
      });
      const engineering = await app.request("/api/public/portfolio?section=engineering");
      expect(engineering.status).toBe(200);
      expect(await engineering.json()).toMatchObject({
        data: [
          { name: "Earlier", technologies: ["TypeScript"] },
          { name: "Later", technologies: ["Bun"] },
        ],
      });
      const hobby = await app.request("/api/public/portfolio?section=hobby");
      expect(await hobby.json()).toMatchObject({ data: [{ name: "Hobby work" }] });
      expect((await app.request("/api/public/portfolio")).status).toBe(400);
      expect((await app.request("/api/public/portfolio?section=invalid")).status).toBe(400);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
