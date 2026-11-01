import { expect, test } from "bun:test";

import { socialLinkInput } from "./social-link-input";

const valid = {
  section: "engineering",
  kind: "website",
  url: "https://example.com",
  displayOrder: 0,
};
test("accepts web links and email links for the email kind", () => {
  expect(socialLinkInput.safeParse(valid).success).toBe(true);
  expect(
    socialLinkInput.safeParse({
      ...valid,
      section: "hobby",
      kind: "email",
      url: "mailto:test@example.com",
    }).success,
  ).toBe(true);
});
test("rejects unsafe or mismatched links and invalid fields", () => {
  for (const value of [
    { ...valid, section: "other" },
    { ...valid, kind: " " },
    { ...valid, kind: "x".repeat(101) },
    { ...valid, url: "mailto:test@example.com" },
    { ...valid, url: "javascript:alert(1)" },
    { ...valid, url: "https:example.com" },
    { ...valid, kind: "email", url: "mailto:not-an-email" },
    { ...valid, displayOrder: 2147483648 },
    { ...valid, extra: true },
  ])
    expect(socialLinkInput.safeParse(value).success).toBe(false);
});
