import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { socialLinks } from "../infrastructures/db/schema";

/** Deletes an existing social link and reports whether it existed. */
export async function deleteSocialLink(database: NodePgDatabase, id: string) {
  const rows = await database
    .delete(socialLinks)
    .where(eq(socialLinks.id, BigInt(id)))
    .returning({ id: socialLinks.id });
  return rows.length !== 0;
}
