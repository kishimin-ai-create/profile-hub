import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { users } from "./schema";

/** Retrieves authentication data for the requested administrator. */
export async function findAdminByEmail(database: NodePgDatabase, email: string) {
  const rows = await database
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (rows.length === 0) return null;
  const user = rows[0];
  return { ...user, id: user.id.toString() };
}
