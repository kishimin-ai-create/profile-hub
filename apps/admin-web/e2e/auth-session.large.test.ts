import { expect, test } from "@playwright/test";

test("reports profile edit retry progress and opens the recovered form", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.test");
  await page.getByLabel("パスワード").fill("test-only-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();

  const state = { retrying: false, release: () => {} };
  const retry = new Promise<void>((resolve) => {
    state.release = resolve;
  });
  await page.route("**/api/admin/profile", async (route) => {
    if (!state.retrying) {
      await route.fulfill({ status: 500 });
      return;
    }
    await retry;
    await route.fulfill({
      json: { data: { id: "1", name: "Recovered", title: null, bio: null, avatarUrl: null } },
    });
  });
  try {
    await page.goto("/profile/edit");
    await expect(page.getByRole("alert")).toHaveText("プロフィールを取得できませんでした");
    const status = page.getByRole("status");
    await expect(status).toBeEmpty();
    state.retrying = true;
    await page.getByRole("button", { name: "再試行" }).click();
    await expect(status).toHaveText("読み込み中");
    state.release();
    await expect(page.getByLabel("名前")).toHaveValue("Recovered");
    await expect(status).toBeEmpty();
  } finally {
    state.release();
  }
});

test("exposes loading status for the portfolio list and edit page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.test");
  await page.getByLabel("パスワード").fill("test-only-password");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
  const gate = { list: () => {}, detail: () => {} };
  const list = new Promise<void>((resolve) => {
    gate.list = resolve;
  });
  const detail = new Promise<void>((resolve) => {
    gate.detail = resolve;
  });
  await page.route("**/api/admin/portfolio", async (route) => {
    await list;
    await route.fulfill({ json: { data: [{ id: "42", section: "hobby", name: "Project" }] } });
  });
  await page.route("**/api/admin/portfolio/42", async (route) => {
    await detail;
    await route.fulfill({
      json: {
        data: {
          id: "42",
          section: "hobby",
          name: "Project",
          summary: "Summary",
          technologies: ["Bun"],
          displayOrder: 1,
          repositoryUrl: null,
          demoUrl: null,
          imageUrl: null,
        },
      },
    });
  });
  try {
    await page.getByRole("link", { name: "Portfolio" }).click();
    await expect(page.getByRole("status")).toHaveText("読み込み中");
    gate.list();
    await page.getByRole("link", { name: "Project を編集" }).click();
    await expect(page.getByRole("status")).toHaveText("読み込み中");
    gate.detail();
    await expect(page.getByLabel("作品名")).toHaveValue("Project");
    await expect(page.getByRole("status")).toBeEmpty();
  } finally {
    gate.list();
    gate.detail();
  }
});

for (const [label, message] of [
  ["作品名", "作品名を入力してください"],
  ["概要", "概要を入力してください"],
]) {
  test(`rejects a blank ${label} and saves after correction`, async ({ page }) => {
    const requests: string[] = [];
    await page.route("**/api/admin/portfolio", async (route) => {
      if (route.request().method() === "POST") {
        requests.push(route.request().method());
        await route.fulfill({ status: 201, json: { data: { id: "1" } } });
      } else await route.continue();
    });
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("admin@example.test");
    await page.getByLabel("パスワード").fill("test-only-password");
    await page.getByRole("button", { name: "ログイン" }).click();
    await page
      .getByRole("navigation", { name: "クイック操作" })
      .getByRole("link", { name: "作品を作成" })
      .click();
    await page.getByLabel("セクション").selectOption("hobby");
    await page.getByLabel("作品名").fill("Project");
    await page.getByLabel("概要").fill("Summary");
    await page.getByLabel("技術（カンマ区切り）").fill("Bun");
    await page.getByLabel("表示順").fill("1");
    const field = page.getByLabel(label);
    await field.fill("   ");
    await page.getByRole("button", { name: "作成" }).click();
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAccessibleDescription(message);
    expect(requests).toEqual([]);
    await field.fill("Updated");
    await page.getByRole("button", { name: "作成" }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
    expect(requests).toEqual(["POST"]);
  });
}

test("administrator can retry a failed login using only the keyboard", async ({ page }) => {
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
  await page.keyboard.type("wrong-password");
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toHaveText("ログインできませんでした");
  await page.keyboard.press("Shift+Tab");
  await expect(password).toBeFocused();
  await page.keyboard.press("Control+A");
  await page.keyboard.type("test-only-password");
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
});

for (const { label, email, password } of [
  { label: "invalid email", email: "invalid-email", password: "test-only-password" },
  { label: "missing password", email: "admin@example.test", password: "" },
]) {
  test(`does not send login requests with ${label}`, async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/admin/auth/browser/login")
        requests.push(request.method());
    });
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill(email);
    await page.getByLabel("パスワード").fill(password);
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page.locator("input:invalid")).toHaveCount(1);
    await expect(page).toHaveURL(/\/login$/);
    expect(requests).toEqual([]);
    await page.getByLabel("メールアドレス").fill("admin@example.test");
    await page.getByLabel("パスワード").fill("test-only-password");
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
    expect(requests).toEqual(["POST"]);
  });
}

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
