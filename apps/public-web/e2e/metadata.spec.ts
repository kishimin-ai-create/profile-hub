import { expect, test } from "@playwright/test";

test("updates metadata across public routes and unknown addresses", async ({ page }) => {
  for (const [path, title] of [
    ["/", "Home"],
    ["/engineering", "Engineering"],
    ["/engineering/contact", "Engineering Contact"],
    ["/hobby", "Hobby"],
    ["/hobby/", "Hobby"],
    ["/hobby/contact", "Hobby Contact"],
    ["/unknown", "ページが見つかりません"],
  ]) {
    await page.goto(path);
    await expect(page).toHaveTitle(`${title} | profile-hub`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      `${title} | profile-hub`,
    );
    if (path === "/unknown") {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    } else {
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    }
    const origin = process.env.SITE_ORIGIN;
    if (origin && path !== "/unknown") {
      const canonical = `${new URL(origin).origin}${path.replace(/\/+$/, "") || "/"}`;
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
    } else {
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
    }
  }
  await page.getByRole("link", { name: "profile-hub" }).click();
  await expect(page).toHaveTitle("Home | profile-hub");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  if (process.env.SITE_ORIGIN)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${new URL(process.env.SITE_ORIGIN).origin}/`,
    );
  await page.getByRole("link", { name: "Hobby を見る →", exact: true }).click();
  await expect(page).toHaveTitle("Hobby | profile-hub");
  if (process.env.SITE_ORIGIN)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${new URL(process.env.SITE_ORIGIN).origin}/hobby`,
    );
  await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
});
