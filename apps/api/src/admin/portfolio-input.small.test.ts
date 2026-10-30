import { expect, test } from "bun:test";

import { portfolioInput } from "./portfolio-input";

const valid = {
  section: "engineering",
  name: "Project",
  summary: "Useful work",
  technologies: ["TypeScript"],
  displayOrder: 1,
};
test("accepts a bounded portfolio with optional http links", () => {
  expect(
    portfolioInput.safeParse({ ...valid, repositoryUrl: "https://example.test/project" }).success,
  ).toBe(true);
});
test("rejects missing fields, empty technologies, unsafe links and oversized text", () => {
  for (const value of [
    { ...valid, section: "other" },
    { ...valid, name: "" },
    { ...valid, summary: "" },
    { ...valid, technologies: [] },
    { ...valid, name: "x".repeat(201) },
    ...["repositoryUrl", "demoUrl", "imageUrl"].map((field) => ({
      ...valid,
      [field]: "javascript:alert(1)",
    })),
    { ...valid, demoUrl: "not a url" },
  ])
    expect(portfolioInput.safeParse(value).success).toBe(false);
});
