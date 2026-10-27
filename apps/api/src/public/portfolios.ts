import { asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { portfolios } from "../infrastructures/db/schema";

export type PortfolioSection = "engineering" | "hobby";

/** Returns only the requested section's portfolio entries in display order. */
export async function listPortfolios(database: NodePgDatabase, section: PortfolioSection) {
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
    .where(eq(portfolios.section, section))
    .orderBy(asc(portfolios.displayOrder), asc(portfolios.id));

  return rows.map((row) => ({ ...row, id: row.id.toString() }));
}
