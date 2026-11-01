import { z } from "zod";

const httpUrl = z
  .url()
  .max(2048)
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  });

export const portfolioInput = z.strictObject({
  section: z.enum(["engineering", "hobby"]),
  name: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(4000),
  technologies: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
  repositoryUrl: httpUrl.nullish(),
  demoUrl: httpUrl.nullish(),
  imageUrl: httpUrl.nullish(),
  displayOrder: z.number().int().min(-2147483648).max(2147483647),
});
