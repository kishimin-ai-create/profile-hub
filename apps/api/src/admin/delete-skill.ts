import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { skills } from "../infrastructures/db/schema";

/** Deletes an existing skill and reports whether it existed. */
export async function deleteSkill(database: NodePgDatabase, id: string) {
  const rows = await database
    .delete(skills)
    .where(eq(skills.id, BigInt(id)))
    .returning({ id: skills.id });
  return rows.length !== 0;
}
