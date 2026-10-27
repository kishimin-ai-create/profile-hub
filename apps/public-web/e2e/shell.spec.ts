import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1280]) {
  test(`keeps short pages within the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/engineering");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect.poll(async () => (await footer.boundingBox())?.y).toBeGreaterThan(800);
    expect(
      await page.locator("html").evaluate((element) => element.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
