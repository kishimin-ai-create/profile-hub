import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { z } from "zod";

import { favourites } from "../infrastructures/db/schema";
import type { favouriteInput } from "./favourite-input";

export type FavouriteInput = z.infer<typeof favouriteInput>;

/** Persists a validated favourite and returns its public fields. */
export async function createFavourite(database: NodePgDatabase, input: FavouriteInput) {
  const rows = await database.insert(favourites).values(input).returning({
    id: favourites.id,
    name: favourites.name,
    description: favourites.description,
    link: favourites.link,
    displayOrder: favourites.displayOrder,
  });
  const row = rows.find((_row, index) => index === 0);
  if (!row) throw new Error("Favourite insert returned no row");
  return { ...row, id: row.id.toString() };
}
