import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { favourites } from "../infrastructures/db/schema";
import type { FavouriteInput } from "./create-favourite";

/** Replaces a favourite and returns its public fields when it exists. */
export async function updateFavourite(database: NodePgDatabase, id: string, input: FavouriteInput) {
  const rows = await database
    .update(favourites)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(favourites.id, BigInt(id)))
    .returning({
      id: favourites.id,
      name: favourites.name,
      description: favourites.description,
      link: favourites.link,
      displayOrder: favourites.displayOrder,
    });
  const row = rows.find((_entry, index) => index === 0);
  return row ? { ...row, id: row.id.toString() } : null;
}
