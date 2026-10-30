import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { LoginPage } from "./login-page";

test("submits credentials and opens the dashboard after login", async () => {
  const login = vi
    .fn<(email: string, password: string) => Promise<boolean>>()
    .mockResolvedValue(true);
  const onSuccess = vi.fn<() => void>();
  render(<LoginPage login={login} onSuccess={onSuccess} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.com");
  await user.type(screen.getByLabelText("パスワード"), "password");
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(login).toHaveBeenCalledWith("admin@example.com", "password");
  expect(onSuccess).toHaveBeenCalledOnce();
});

test("reports failed login without navigating", async () => {
  const onSuccess = vi.fn<() => void>();
  render(<LoginPage login={() => Promise.reject(new Error("failure"))} onSuccess={onSuccess} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.com");
  await user.type(screen.getByLabelText("パスワード"), "wrong");
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("ログインできませんでした");
  expect(onSuccess).not.toHaveBeenCalled();
});
