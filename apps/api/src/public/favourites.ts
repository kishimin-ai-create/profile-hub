import { asc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { favourites } from "../infrastructures/db/schema";

/** Returns public favourites in display order. */
export async function listFavourites(database: NodePgDatabase) {
  const rows = await database
    .select({
      id: favourites.id,
      name: favourites.name,
      description: favourites.description,
      link: favourites.link,
      displayOrder: favourites.displayOrder,
    })
    .from(favourites)
    .orderBy(asc(favourites.displayOrder), asc(favourites.id));

  return rows.map((row) => ({ ...row, id: row.id.toString() }));
}
