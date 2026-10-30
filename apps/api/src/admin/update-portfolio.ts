import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { portfolios } from "../infrastructures/db/schema";
import type { PortfolioInput } from "./create-portfolio";

/** Replaces a portfolio and returns its public fields when it exists. */
export async function updatePortfolio(database: NodePgDatabase, id: string, input: PortfolioInput) {
  const rows = await database
    .update(portfolios)
    .set({
      ...input,
      repositoryUrl: input.repositoryUrl ?? null,
      demoUrl: input.demoUrl ?? null,
      imageUrl: input.imageUrl ?? null,
      updatedAt: new Date(),
    })
    .where(eq(portfolios.id, BigInt(id)))
    .returning({
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
  const row = rows.find((_entry, index) => index === 0);
  return row ? { ...row, id: row.id.toString() } : null;
}
