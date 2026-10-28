import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { z } from "zod";

import { hashPassword } from "../../auth/password";
import { users } from "./schema";

/** Creates the first administrator without overwriting existing accounts. */
export async function provisionAdministrator(
  database: NodePgDatabase,
  email: string,
  password: string,
): Promise<boolean> {
  const input = z
    .object({ email: z.string().email().max(320), password: z.string().min(8).max(1024) })
    .parse({ email, password });
  const passwordHash = await hashPassword(input.password);
  return database.transaction(async (transaction) => {
    await transaction.execute(sql`LOCK TABLE ${users} IN EXCLUSIVE MODE`);
    const existing = await transaction.select({ id: users.id }).from(users).limit(1);
    if (existing.length > 0) return false;
    await transaction.insert(users).values({ email: input.email, passwordHash });
    return true;
  });
}
