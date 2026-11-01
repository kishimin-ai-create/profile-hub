import { asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { z } from "zod";

import { profiles } from "../infrastructures/db/schema";
import type { profileInput } from "./profile-input";

export type ProfileInput = z.infer<typeof profileInput>;

/** Creates or replaces the public profile in a serializable transaction. */
export async function updateProfile(database: NodePgDatabase, input: ProfileInput) {
  return database.transaction(
    async (transaction) => {
      const current = await transaction
        .select({ id: profiles.id })
        .from(profiles)
        .orderBy(asc(profiles.id))
        .limit(1)
        .for("update");
      const first = current.find((_row, index) => index === 0);
      const fields = {
        id: profiles.id,
        name: profiles.name,
        title: profiles.title,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
      };
      const rows = first
        ? await transaction
            .update(profiles)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(profiles.id, first.id))
            .returning(fields)
        : await transaction.insert(profiles).values(input).returning(fields);
      const row = rows.find((_entry, index) => index === 0);
      if (!row) throw new Error("Profile write returned no row");
      return { ...row, id: row.id.toString() };
    },
    { isolationLevel: "serializable" },
  );
}
