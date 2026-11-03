import { expect, test } from "@playwright/test";

for (const width of [375, 1280]) {
  test(`keeps Hobby project cards readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/public/portfolio?*", async (route) => {
      await route.fulfill({
        json: {
          data: [
            {
              id: "1",
              section: "hobby",
              name: "週末の小さな道具",
              summary: "好きなことをきっかけに、日々を少し楽しくするために作りました。".repeat(3),
              technologies: ["TypeScript", "React"],
              repositoryUrl: "https://example.com/repository",
              demoUrl: "https://example.com/demo",
              imageUrl: null,
            },
          ],
        },
      });
    });
    await page.goto("/hobby");
    const heading = page.getByRole("heading", { name: "週末の小さな道具" });
    const card = heading.locator("..");
    await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(card.getByRole("link", { name: "週末の小さな道具 のデモ" })).toBeVisible();
    const bounds = await card.boundingBox();
    if (bounds === null) throw new Error("Project card is not visible");
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
