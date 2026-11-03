import { expect, test } from "@playwright/test";

test("reads public profile and hobby content across routes", async ({ page }) => {
  await page.route("**/api/public/profile", async (route) => {
    await route.fulfill({
      json: {
        data: {
          profile: { id: "1", name: "Example", title: "Developer", bio: "Hello", avatarUrl: null },
          links: { engineering: [], hobby: [{ id: "1", kind: "x", url: "https://x.com/example" }] },
          skills: [],
        },
      },
    });
  });
  await page.route("**/api/public/favourites", async (route) => {
    await route.fulfill({
      json: {
        data: [
          {
            id: "1",
            name: "Music",
            description: "Listening",
            link: "https://example.com/music",
            displayOrder: 0,
          },
        ],
      },
    });
  });
  await page.route("**/api/public/portfolio?*", async (route) => {
    expect(new URL(route.request().url()).searchParams.get("section")).toBe("hobby");
    await route.fulfill({
      json: {
        data: [
          {
            id: "1",
            section: "hobby",
            name: "Project",
            summary: "Made for fun",
            technologies: ["TypeScript"],
            repositoryUrl: null,
            demoUrl: "https://example.com/demo",
            imageUrl: null,
            displayOrder: 0,
          },
        ],
      },
    });
  });
  await page.goto("/");
  await expect(page.getByText("Example", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Hobby を見る →", exact: true }).click();
  await expect(page.getByRole("link", { name: "Music" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project" })).toBeVisible();
  await page.getByRole("link", { name: "趣味について連絡する" }).click();
  await expect(page.getByRole("link", { name: "X", exact: true })).toHaveAttribute(
    "href",
    "https://x.com/example",
  );
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveCount(0);
});
