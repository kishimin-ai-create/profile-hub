import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createPortfolio } from "../admin/create-portfolio";
import { deletePortfolio } from "../admin/delete-portfolio";
import { findPortfolio } from "../admin/find-portfolio";
import { updatePortfolio } from "../admin/update-portfolio";
import { issueToken } from "../auth/token";
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
        createPortfolio: (input) => createPortfolio(drizzle(client), input),
        findPortfolio: (id) => findPortfolio(drizzle(client), id),
        updatePortfolio: (id, input) => updatePortfolio(drizzle(client), id, input),
        deletePortfolio: (id) => deletePortfolio(drizzle(client), id),
        getPublicProfile: () =>
          Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
        adminSecret: "a-test-only-secret-with-at-least-32-bytes",
        findAdminSessionVersion: () => Promise.resolve(3),
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
      const token = await issueToken(
        "42",
        3,
        "access",
        "a-test-only-secret-with-at-least-32-bytes",
      );
      const headers = { Authorization: `Bearer ${token}` };
      const admin = await app.request("/api/admin/portfolio", { headers });
      expect(admin.status).toBe(200);
      expect(await admin.json()).toMatchObject({
        data: [
          { name: "Earlier", section: "engineering" },
          { name: "Later", section: "engineering" },
          { name: "Hobby work", section: "hobby" },
        ],
      });
      const adminHobby = await app.request("/api/admin/portfolio?section=hobby", { headers });
      expect(await adminHobby.json()).toMatchObject({
        data: [{ name: "Hobby work", section: "hobby" }],
      });
      const created = await app.request("/api/admin/portfolio", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "hobby",
          name: "Created",
          repositoryUrl: "https://example.test/repo",
          summary: "Created via API",
          technologies: ["Bun"],
          displayOrder: 2,
        }),
      });
      expect(created.status).toBe(201);
      expect(await created.json()).toMatchObject({ data: { name: "Created", section: "hobby" } });
      const ids = await client.query<{ id: string }>(
        "SELECT id::text AS id FROM portfolios WHERE name = $1",
        ["Created"],
      );
      const createdRow = ids.rows.find((_row, index) => index === 0);
      if (!createdRow) throw new Error("Expected created portfolio");
      const detail = await app.request(`/api/admin/portfolio/${createdRow.id}`, { headers });
      expect(detail.status).toBe(200);
      expect(await detail.json()).toMatchObject({
        data: { id: createdRow.id, name: "Created", section: "hobby" },
      });
      const updated = await app.request(`/api/admin/portfolio/${createdRow.id}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "hobby",
          name: "Updated",
          summary: "Edited",
          technologies: ["Bun"],
          displayOrder: 2,
        }),
      });
      expect(updated.status).toBe(200);
      expect(await updated.json()).toMatchObject({
        data: { name: "Updated", repositoryUrl: null },
      });
      expect(await (await app.request("/api/public/portfolio?section=hobby")).json()).toMatchObject(
        { data: [{ name: "Hobby work" }, { name: "Updated" }] },
      );
      expect(
        (await app.request(`/api/admin/portfolio/${createdRow.id}`, { method: "DELETE", headers }))
          .status,
      ).toBe(204);
      expect(
        (await app.request(`/api/admin/portfolio/${createdRow.id}`, { method: "DELETE", headers }))
          .status,
      ).toBe(404);
      expect(await (await app.request("/api/public/portfolio?section=hobby")).json()).toMatchObject(
        { data: [{ name: "Hobby work" }] },
      );
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
