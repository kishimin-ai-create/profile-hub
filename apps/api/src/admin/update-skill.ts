import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { skills } from "../infrastructures/db/schema";
import type { SkillInput } from "./create-skill";

/** Replaces a skill and returns its public fields when it exists. */
export async function updateSkill(database: NodePgDatabase, id: string, input: SkillInput) {
  const rows = await database
    .update(skills)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(skills.id, BigInt(id)))
    .returning({ id: skills.id, name: skills.name, displayOrder: skills.displayOrder });
  const row = rows.find((_entry, index) => index === 0);
  return row ? { ...row, id: row.id.toString() } : null;
}
