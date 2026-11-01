import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/** Atomically admits up to five shared login attempts per one-minute window. */
export async function consumeLoginAttempt(database: NodePgDatabase): Promise<boolean> {
  const result = await database.execute(sql`
    INSERT INTO login_rate_limits (id, attempts, window_started_at)
    VALUES ('login', 1, statement_timestamp())
    ON CONFLICT (id) DO UPDATE SET
      attempts = CASE WHEN login_rate_limits.window_started_at <= statement_timestamp() - interval '1 minute'
        THEN 1 ELSE login_rate_limits.attempts + 1 END,
      window_started_at = CASE WHEN login_rate_limits.window_started_at <= statement_timestamp() - interval '1 minute'
        THEN statement_timestamp() ELSE login_rate_limits.window_started_at END
    WHERE login_rate_limits.attempts < 5
      OR login_rate_limits.window_started_at <= statement_timestamp() - interval '1 minute'
    RETURNING id
  `);
  return result.rows.length === 1;
}
