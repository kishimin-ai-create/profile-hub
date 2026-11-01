import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let database: (NodePgDatabase & { $client: Pool }) | undefined;

/** Returns the shared connection pool for the configured database. */
export function getDatabase() {
  if (!database) {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString) {
      throw new Error("DATABASE_URL is required");
    }
    database = drizzle<Record<string, never>>(new Pool({ connectionString }));
  }
  return database;
}
