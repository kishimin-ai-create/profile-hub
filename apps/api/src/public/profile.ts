import { asc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { profiles, skills, socialLinks } from "../infrastructures/db/schema";

/** Returns public profile details, ordered skills, and section-specific links. */
export async function getPublicProfile(database: NodePgDatabase) {
  const profileRows = await database
    .select({
      id: profiles.id,
      name: profiles.name,
      title: profiles.title,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles)
    .orderBy(asc(profiles.id))
    .limit(1);
  const skillRows = await database
    .select({ id: skills.id, name: skills.name, displayOrder: skills.displayOrder })
    .from(skills)
    .orderBy(asc(skills.displayOrder), asc(skills.id));
  const linkRows = await database
    .select({
      id: socialLinks.id,
      section: socialLinks.section,
      kind: socialLinks.kind,
      url: socialLinks.url,
      displayOrder: socialLinks.displayOrder,
    })
    .from(socialLinks)
    .orderBy(asc(socialLinks.displayOrder), asc(socialLinks.id));
  const first = profileRows.length > 0 ? profileRows[0] : undefined;
  const links: Record<
    "engineering" | "hobby",
    Array<{ id: string; kind: string; url: string; displayOrder: number }>
  > = { engineering: [], hobby: [] };
  for (const link of linkRows) {
    links[link.section].push({
      id: link.id.toString(),
      kind: link.kind,
      url: link.url,
      displayOrder: link.displayOrder,
    });
  }
  return {
    profile: first ? { ...first, id: first.id.toString() } : null,
    skills: skillRows.map((skill) => ({ ...skill, id: skill.id.toString() })),
    links,
  };
}
