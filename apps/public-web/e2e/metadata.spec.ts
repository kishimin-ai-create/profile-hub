import { expect, test } from "@playwright/test";

test("updates metadata across public routes and unknown addresses", async ({ page }) => {
  for (const [path, title] of [
    ["/", "Home"],
    ["/engineering", "Engineering"],
    ["/engineering/contact", "Engineering Contact"],
    ["/hobby", "Hobby"],
    ["/hobby/contact", "Hobby Contact"],
    ["/unknown", "ページが見つかりません"],
  ]) {
    await page.goto(path);
    await expect(page).toHaveTitle(`${title} | profile-hub`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", `${title} | profile-hub`);
  }
  await page.getByRole("link", { name: "profile-hub" }).click();
  await expect(page).toHaveTitle("Home | profile-hub");
  await page.getByRole("link", { name: "Hobby", exact: true }).click();
  await expect(page).toHaveTitle("Hobby | profile-hub");
  await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
});
