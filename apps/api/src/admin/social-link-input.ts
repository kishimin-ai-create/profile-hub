import { z } from "zod";

export const socialLinkInput = z
  .strictObject({
    section: z.enum(["engineering", "hobby"]),
    kind: z.string().trim().min(1).max(100),
    url: z.string().max(2048),
    displayOrder: z.number().int().min(-2147483648).max(2147483647),
  })
  .refine(({ kind, url }) => {
    if (kind === "email" && /^mailto:/i.test(url)) return z.email().safeParse(url.slice(7)).success;
    if (!/^https?:\/\//i.test(url)) return false;
    try {
      const protocol = new URL(url).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  });
