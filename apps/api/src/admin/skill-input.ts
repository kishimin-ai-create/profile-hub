import { z } from "zod";

export const skillInput = z.strictObject({
  name: z.string().trim().min(1).max(200),
  displayOrder: z.number().int().min(-2147483648).max(2147483647),
});
