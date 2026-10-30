import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { portfolios } from "../infrastructures/db/schema";

/** Finds one portfolio without returning database-only metadata. */
export async function findPortfolio(database: NodePgDatabase, id: string) {
  const rows = await database
    .select({
      id: portfolios.id,
      section: portfolios.section,
      name: portfolios.name,
      summary: portfolios.summary,
      technologies: portfolios.technologies,
      repositoryUrl: portfolios.repositoryUrl,
      demoUrl: portfolios.demoUrl,
      imageUrl: portfolios.imageUrl,
      displayOrder: portfolios.displayOrder,
    })
    .from(portfolios)
    .where(eq(portfolios.id, BigInt(id)))
    .limit(1);
  const row = rows.find((_entry, index) => index === 0);
  return row ? { ...row, id: row.id.toString() } : null;
}
