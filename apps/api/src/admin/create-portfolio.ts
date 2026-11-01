import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { z } from "zod";

import { portfolios } from "../infrastructures/db/schema";
import type { portfolioInput } from "./portfolio-input";

export type PortfolioInput = z.infer<typeof portfolioInput>;

/** Persists a validated portfolio and returns its public fields. */
export async function createPortfolio(database: NodePgDatabase, input: PortfolioInput) {
  const rows = await database.insert(portfolios).values(input).returning({
    id: portfolios.id,
    section: portfolios.section,
    name: portfolios.name,
    summary: portfolios.summary,
    technologies: portfolios.technologies,
    repositoryUrl: portfolios.repositoryUrl,
    demoUrl: portfolios.demoUrl,
    imageUrl: portfolios.imageUrl,
    displayOrder: portfolios.displayOrder,
  });
  const row = rows.find((_row, index) => index === 0);
  if (!row) throw new Error("Portfolio insert returned no row");
  return { ...row, id: row.id.toString() };
}
