import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { createSocialLink } from "./create-social-link";
import { deleteSocialLink } from "./delete-social-link";
import { updateSocialLink } from "./update-social-link";

const databaseUrl = process.env["TEST_DATABASE_URL"];
test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "creating a social link preserves its section and URL",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const input = {
        section: "hobby" as const,
        kind: "email",
        url: "mailto:test@example.com",
        displayOrder: 1,
      };
      const created = await createSocialLink(drizzle(client), input);
      expect(created).toEqual({ ...input, id: expect.any(String) });
      const rows = await client.query(
        "SELECT section, kind, url, display_order FROM social_links WHERE id = $1",
        [created.id],
      );
      expect(rows.rows).toEqual([
        {
          section: input.section,
          kind: input.kind,
          url: input.url,
          display_order: input.displayOrder,
        },
      ]);
      const changed = { ...input, url: "mailto:other@example.com" };
      expect(await updateSocialLink(drizzle(client), created.id, changed)).toEqual({
        ...changed,
        id: created.id,
      });
      expect(await updateSocialLink(drizzle(client), "9223372036854775807", changed)).toBeNull();
      expect(await deleteSocialLink(drizzle(client), created.id)).toBe(true);
      expect(await deleteSocialLink(drizzle(client), created.id)).toBe(false);
      expect(
        (await client.query("SELECT id FROM social_links WHERE id = $1", [created.id])).rows,
      ).toEqual([]);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
