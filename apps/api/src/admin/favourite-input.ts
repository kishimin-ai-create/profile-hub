import { z } from "zod";

const httpUrl = z
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

export const favouriteInput = z.strictObject({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  link: httpUrl,
  displayOrder: z.number().int().min(-2147483648).max(2147483647),
});
