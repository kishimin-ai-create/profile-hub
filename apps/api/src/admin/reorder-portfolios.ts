import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { portfolios } from "../infrastructures/db/schema";
import type { PortfolioSection } from "../public/portfolios";

/** Reorders the complete set for one section in a single transaction. */
export async function reorderPortfolios(
  database: NodePgDatabase,
  section: PortfolioSection,
  ids: string[],
) {
  return database.transaction(
    async (transaction) => {
      const rows = await transaction
        .select({ id: portfolios.id })
        .from(portfolios)
        .where(eq(portfolios.section, section))
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
          .update(portfolios)
          .set({ displayOrder: ids.indexOf(id), updatedAt: new Date() })
          .where(and(eq(portfolios.section, section), eq(portfolios.id, BigInt(id))));
      }
      return true;
    },
    { isolationLevel: "serializable" },
  );
}
