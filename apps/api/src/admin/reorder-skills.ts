import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { skills } from "../infrastructures/db/schema";

/** Reorders all skills in one serializable transaction. */
export async function reorderSkills(database: NodePgDatabase, ids: string[]) {
  return database.transaction(
    async (transaction) => {
      const rows = await transaction.select({ id: skills.id }).from(skills).for("update");
      const existing = new Set(rows.map((row) => row.id.toString()));
      if (
        existing.size !== ids.length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !existing.has(id))
      )
        return false;
      for (const id of ids) {
        await transaction
          .update(skills)
          .set({ displayOrder: ids.indexOf(id), updatedAt: new Date() })
          .where(eq(skills.id, BigInt(id)));
      }
      return true;
    },
    { isolationLevel: "serializable" },
  );
}
