import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { favourites } from "../infrastructures/db/schema";

/** Reorders all favourites in one serializable transaction. */
export async function reorderFavourites(database: NodePgDatabase, ids: string[]) {
  return database.transaction(
    async (transaction) => {
      const rows = await transaction.select({ id: favourites.id }).from(favourites).for("update");
      const existing = new Set(rows.map((row) => row.id.toString()));
      if (
        existing.size !== ids.length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !existing.has(id))
      )
        return false;
      for (const id of ids) {
        await transaction
          .update(favourites)
          .set({ displayOrder: ids.indexOf(id), updatedAt: new Date() })
          .where(eq(favourites.id, BigInt(id)));
      }
      return true;
    },
    { isolationLevel: "serializable" },
  );
}
