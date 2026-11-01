import { expect, test } from "@playwright/test";

test("reads hobby data from the live API across routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Example", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Hobby", exact: true }).click();
  await expect(page.getByRole("link", { name: "Music" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hobby project" })).toBeVisible();
  await page.getByRole("link", { name: "趣味について連絡する" }).click();
  await expect(page.getByRole("link", { name: "X", exact: true })).toHaveAttribute("href", "https://x.com/example");
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveCount(0);
});
