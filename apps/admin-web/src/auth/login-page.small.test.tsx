import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { LoginPage } from "./login-page";

test("announces login progress while a request is pending", async () => {
  const login = vi
    .fn<(email: string, password: string) => Promise<boolean>>()
    .mockImplementation(() => new Promise(() => {}));
  render(<LoginPage login={login} onSuccess={vi.fn<() => void>()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.com");
  await user.type(screen.getByLabelText("パスワード"), "password");
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(screen.getByRole("button", { name: "ログイン" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("ログイン中");
});

test("does not submit credentials twice before the first login completes", async () => {
  const login = vi
    .fn<(email: string, password: string) => Promise<boolean>>()
    .mockImplementation(() => new Promise(() => {}));
  render(<LoginPage login={login} onSuccess={vi.fn<() => void>()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.com");
  await user.type(screen.getByLabelText("パスワード"), "password");
  const form = screen.getByRole("form", { name: "ログイン" });
  if (!(form instanceof HTMLFormElement)) throw new Error("Missing login form");
  act(() => {
    form.requestSubmit();
    form.requestSubmit();
  });
  expect(login).toHaveBeenCalledOnce();
});

test("allows another login attempt after a failure", async () => {
  const login = vi
    .fn<(email: string, password: string) => Promise<boolean>>()
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true);
  const onSuccess = vi.fn<() => void>();
  render(<LoginPage login={login} onSuccess={onSuccess} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.com");
  await user.type(screen.getByLabelText("パスワード"), "password");
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(onSuccess).toHaveBeenCalledOnce();
  expect(login).toHaveBeenCalledTimes(2);
});

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
