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

test("unsaved portfolio input warns on browser close and in-app navigation", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.test");
  await page.getByLabel("パスワード").fill("test-only-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await page.getByRole("link", { name: "Portfolio" }).click();
  await page.getByRole("link", { name: "作品を作成" }).click();
  await page.getByLabel("作品名").fill("Draft");
  const closingDialog = page.waitForEvent("dialog");
  const closing = page.close({ runBeforeUnload: true });
  const beforeUnload = await closingDialog;
  expect(beforeUnload.type()).toBe("beforeunload");
  await beforeUnload.dismiss();
  await closing;
  await expect(page.getByLabel("作品名")).toHaveValue("Draft");
  const cancelDialog = page.waitForEvent("dialog");
  const canceledNavigation = page.getByRole("link", { name: "Dashboard" }).click();
  await (await cancelDialog).dismiss();
  await canceledNavigation;
  await expect(page.getByLabel("作品名")).toHaveValue("Draft");
  const acceptDialog = page.waitForEvent("dialog");
  const acceptedNavigation = page.getByRole("link", { name: "Dashboard" }).click();
  await (await acceptDialog).accept();
  await acceptedNavigation;
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
  await page.getByRole("button", { name: "ログアウト" }).click();
});
