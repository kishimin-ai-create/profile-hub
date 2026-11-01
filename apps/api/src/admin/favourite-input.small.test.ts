import { expect, test } from "bun:test";

import { favouriteInput } from "./favourite-input";

const valid = {
  name: "Tea",
  description: "Green tea",
  link: "https://example.com",
  displayOrder: 1,
};

test("accepts a favourite with a bounded HTTP link", () => {
  expect(favouriteInput.safeParse(valid).success).toBe(true);
  expect(favouriteInput.safeParse({ ...valid, link: "HTTPS://example.com" }).success).toBe(true);
});

test("rejects unsafe links, missing text and values outside storage bounds", () => {
  for (const input of [
    { ...valid, name: " " },
    { ...valid, description: "" },
    { ...valid, name: "x".repeat(201) },
    { ...valid, description: "x".repeat(4001) },
    { ...valid, link: "javascript:alert(1)" },
    { ...valid, link: "mailto:test@example.com" },
    { ...valid, link: "not a url" },
    { ...valid, link: "https:example.com" },
    { ...valid, displayOrder: 2147483648 },
    { ...valid, extra: true },
  ])
    expect(favouriteInput.safeParse(input).success).toBe(false);
});
