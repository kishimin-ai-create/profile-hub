import { expect, test } from "@playwright/test";

test("reads hobby data from the live API across routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Example", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Hobby を見る →", exact: true }).click();
  await expect(page.getByRole("link", { name: "Music" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hobby project" })).toBeVisible();
  await page.getByRole("link", { name: "趣味について連絡する" }).click();
  await expect(page.getByRole("link", { name: "X", exact: true })).toHaveAttribute(
    "href",
    "https://x.com/example",
  );
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveCount(0);
});

test("shows engineering projects without hobby entries through the live API", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Engineering を見る →", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Engineering project" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hobby project" })).toHaveCount(0);
});
