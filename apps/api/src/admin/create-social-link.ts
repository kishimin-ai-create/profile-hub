import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { z } from "zod";

import { socialLinks } from "../infrastructures/db/schema";
import type { socialLinkInput } from "./social-link-input";

export type SocialLinkInput = z.infer<typeof socialLinkInput>;

/** Persists a validated social link and returns its public fields. */
export async function createSocialLink(database: NodePgDatabase, input: SocialLinkInput) {
  const rows = await database.insert(socialLinks).values(input).returning({
    id: socialLinks.id,
    section: socialLinks.section,
    kind: socialLinks.kind,
    url: socialLinks.url,
    displayOrder: socialLinks.displayOrder,
  });
  const row = rows.find((_entry, index) => index === 0);
  if (!row) throw new Error("Social link insert returned no row");
  return { ...row, id: row.id.toString() };
}
