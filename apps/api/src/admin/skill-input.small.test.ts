import { expect, test } from "bun:test";

import { skillInput } from "./skill-input";

test("accepts a bounded skill name and display order", () => {
  expect(skillInput.safeParse({ name: "TypeScript", displayOrder: 0 }).success).toBe(true);
});

test("rejects empty or oversized names, invalid orders and unknown fields", () => {
  for (const input of [
    { name: " ", displayOrder: 0 },
    { name: "x".repeat(201), displayOrder: 0 },
    { name: "TypeScript", displayOrder: 2147483648 },
    { name: "TypeScript", displayOrder: 1.5 },
    { name: "TypeScript", displayOrder: 0, category: "language" },
  ])
    expect(skillInput.safeParse(input).success).toBe(false);
});
