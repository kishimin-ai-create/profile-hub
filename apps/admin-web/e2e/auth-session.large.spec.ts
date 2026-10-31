import { expect, test } from "@playwright/test";

test("administrator can log in, restore after reload, and log out", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.test");
  await page.getByLabel("パスワード").fill("test-only-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
  const cookie = (await context.cookies()).find((item) => item.name === "__Host-admin_refresh");
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "None", path: "/" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("__Host-admin_refresh");
  const refreshResponse = page.waitForResponse("**/api/admin/auth/browser/refresh");
  await page.reload();
  expect((await refreshResponse).status()).toBe(200);
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
  expect((await context.cookies()).some((item) => item.name === "__Host-admin_refresh")).toBe(
    false,
  );
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();
});
