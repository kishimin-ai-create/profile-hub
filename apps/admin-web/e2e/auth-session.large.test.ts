import { expect, test } from "@playwright/test";

test("administrator can log in using only the keyboard", async ({ page }) => {
  await page.goto("/login");
  const email = page.getByLabel("メールアドレス");
  const password = page.getByLabel("パスワード");
  const submit = page.getByRole("button", { name: "ログイン" });
  await expect(email).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await page.keyboard.type("admin@example.test");
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.type("test-only-password");
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
});

test("an existing browser session redirects a direct login visit", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.test");
  await page.getByLabel("パスワード").fill("test-only-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
});

test("dashboard shows empty counts from the authenticated API", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.test");
  await page.getByLabel("パスワード").fill("test-only-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  const counts = page.getByRole("region", { name: "登録状況" });
  await expect(counts.getByText("作品", { exact: true })).toBeVisible();
  await expect(counts.getByText("お気に入り", { exact: true })).toBeVisible();
  await expect(counts.getByText("0件", { exact: true })).toHaveCount(2);
});

test("dashboard quick actions open the corresponding admin forms", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.test");
  await page.getByLabel("パスワード").fill("test-only-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  const actions = page.getByRole("navigation", { name: "クイック操作" });
  await actions.getByRole("link", { name: "作品を作成" }).click();
  await expect(page).toHaveURL(/\/portfolio\/new$/);
  await expect(page.getByLabel("作品名")).toBeVisible();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await actions.getByRole("link", { name: "お気に入りを作成" }).click();
  await expect(page).toHaveURL(/\/hobby\/new$/);
  await expect(page.getByLabel("名前")).toBeVisible();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await actions.getByRole("link", { name: "プロフィールを編集" }).click();
  await expect(page).toHaveURL(/\/profile\/edit$/);
  await expect(page.getByRole("button", { name: "保存" })).toBeVisible();
});

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

test("administrator edits a social link through the authenticated API", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.test");
  await page.getByLabel("パスワード").fill("test-only-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await page.getByRole("link", { name: "Profile" }).click();
  await page.getByRole("link", { name: "https://example.com を編集" }).click();
  await page.getByLabel("セクション").selectOption("hobby");
  await page.getByLabel("URL").fill("https://new.example.com");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByText("https://new.example.com", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("listitem").filter({ hasText: "https://new.example.com" }),
  ).toContainText("Hobby");
});
