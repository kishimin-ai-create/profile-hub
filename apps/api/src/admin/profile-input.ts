import { z } from "zod";

const avatarUrl = z
  .url()
  .max(2048)
  .regex(/^https?:\/\//i)
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  });

export const profileInput = z.strictObject({
  name: z.string().trim().min(1).max(200),
  title: z.string().trim().max(200).nullable(),
  bio: z.string().trim().max(4000).nullable(),
  avatarUrl: avatarUrl.nullable(),
});
