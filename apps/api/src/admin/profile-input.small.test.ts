import { expect, test } from "bun:test";
import { profileInput } from "./profile-input";

const valid = { name: "Example", title: null, bio: null, avatarUrl: null };

test("accepts a profile with optional text and a web avatar", () => {
  expect(profileInput.safeParse(valid).success).toBe(true);
  expect(
    profileInput.safeParse({ ...valid, avatarUrl: "https://example.com/avatar.png" }).success,
  ).toBe(true);
});

test("rejects unsafe avatars, empty names, excessive text and unknown properties", () => {
  for (const value of [
    { ...valid, name: " " },
    { ...valid, name: "x".repeat(201) },
    { ...valid, title: "x".repeat(201) },
    { ...valid, bio: "x".repeat(4001) },
    { ...valid, avatarUrl: "javascript:alert(1)" },
    { ...valid, avatarUrl: "https:example.com" },
    { ...valid, extra: true },
  ])
    expect(profileInput.safeParse(value).success).toBe(false);
});
