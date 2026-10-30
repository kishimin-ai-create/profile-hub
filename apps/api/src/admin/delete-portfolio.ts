import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { portfolios } from "../infrastructures/db/schema";

/** Deletes an existing portfolio and reports whether it existed. */
export async function deletePortfolio(database: NodePgDatabase, id: string) {
  const rows = await database
    .delete(portfolios)
    .where(eq(portfolios.id, BigInt(id)))
    .returning({ id: portfolios.id });
  return rows.length !== 0;
}
