import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { z } from "zod";

import { skills } from "../infrastructures/db/schema";
import type { skillInput } from "./skill-input";

export type SkillInput = z.infer<typeof skillInput>;

/** Persists a validated skill and returns its public fields. */
export async function createSkill(database: NodePgDatabase, input: SkillInput) {
  const rows = await database
    .insert(skills)
    .values(input)
    .returning({ id: skills.id, name: skills.name, displayOrder: skills.displayOrder });
  const row = rows.find((_entry, index) => index === 0);
  if (!row) throw new Error("Skill insert returned no row");
  return { ...row, id: row.id.toString() };
}
