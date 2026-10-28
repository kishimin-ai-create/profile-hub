import { and, eq, sql } from "drizzle-orm";
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

/** Revokes a session only if its version is still current. */
export async function revokeSession(
  database: NodePgDatabase,
  id: string,
  version: number,
): Promise<boolean> {
  const rows = await database
    .update(users)
    .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(and(eq(users.id, BigInt(id)), eq(users.sessionVersion, version)))
    .returning({ id: users.id });
  return rows.length === 1;
}
