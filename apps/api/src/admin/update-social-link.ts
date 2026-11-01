import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { socialLinks } from "../infrastructures/db/schema";
import type { SocialLinkInput } from "./create-social-link";

/** Replaces a social link and returns its public fields when it exists. */
export async function updateSocialLink(
  database: NodePgDatabase,
  id: string,
  input: SocialLinkInput,
) {
  const rows = await database
    .update(socialLinks)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(socialLinks.id, BigInt(id)))
    .returning({
      id: socialLinks.id,
      section: socialLinks.section,
      kind: socialLinks.kind,
      url: socialLinks.url,
      displayOrder: socialLinks.displayOrder,
    });
  const row = rows.find((_entry, index) => index === 0);
  return row ? { ...row, id: row.id.toString() } : null;
}
