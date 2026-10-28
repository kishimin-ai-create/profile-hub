import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { users } from "./schema";

/** Reads the current session version for an administrator. */
export async function findSessionVersion(
  database: NodePgDatabase,
  id: string,
): Promise<number | null> {
  const rows = await database
    .select({ version: users.sessionVersion })
    .from(users)
    .where(eq(users.id, BigInt(id)))
    .limit(1);
  return rows[0]?.version ?? null;
}
