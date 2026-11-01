import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { socialLinks } from "../infrastructures/db/schema";
import type { SocialLinkInput } from "./create-social-link";

/** Reorders all social links in one section within a serializable transaction. */
export async function reorderSocialLinks(
  database: NodePgDatabase,
  section: SocialLinkInput["section"],
  ids: string[],
) {
  return database.transaction(
    async (transaction) => {
      const rows = await transaction
        .select({ id: socialLinks.id })
        .from(socialLinks)
        .where(eq(socialLinks.section, section))
        .for("update");
      const existing = new Set(rows.map((row) => row.id.toString()));
      if (
        existing.size !== ids.length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !existing.has(id))
      )
        return false;
      for (const id of ids) {
        await transaction
          .update(socialLinks)
          .set({ displayOrder: ids.indexOf(id), updatedAt: new Date() })
          .where(and(eq(socialLinks.section, section), eq(socialLinks.id, BigInt(id))));
      }
      return true;
    },
    { isolationLevel: "serializable" },
  );
}
