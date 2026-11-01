import { z } from "zod";

export const profileSchema = z.object({
  data: z
    .object({
      id: z.string(),
      name: z.string(),
      title: z.string().nullable(),
      bio: z.string().nullable(),
      avatarUrl: z.string().nullable(),
    })
    .nullable(),
});
