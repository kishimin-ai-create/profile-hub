import { expect, test } from "@playwright/test";

for (const [path, heading] of [
  ["/", "Home"],
  ["/engineering", "こんにちは。"],
  ["/engineering/contact", "Engineering Contact"],
  ["/hobby", "こんにちは。"],
  ["/hobby/contact", "Hobby Contact"],
  ["/unknown", "ページが見つかりません"],
]) {
  test(`opens and reloads ${path} directly`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  });
}

for (const [section, other] of [["Engineering", "Hobby"], ["Hobby", "Engineering"]]) {
  test(`navigates ${section} by keyboard without cross-section links`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.getByRole("link", { name: section, exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("region", { name: section })).toBeVisible();
    await expect(page.getByRole("main")).toBeFocused();
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: other })).toHaveCount(0);
    await header.getByRole("link", { name: "Contact" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: `${section} Contact` })).toBeVisible();
    await expect(page.getByRole("main")).toBeFocused();
    await page.goBack();
    await expect(page.getByRole("region", { name: section })).toBeVisible();
    await header.getByRole("link", { name: "profile-hub" }).click();
    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  });
}
