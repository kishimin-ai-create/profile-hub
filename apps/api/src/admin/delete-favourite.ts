import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { favourites } from "../infrastructures/db/schema";

/** Deletes an existing favourite and reports whether it existed. */
export async function deleteFavourite(database: NodePgDatabase, id: string) {
  const rows = await database
    .delete(favourites)
    .where(eq(favourites.id, BigInt(id)))
    .returning({ id: favourites.id });
  return rows.length !== 0;
}
