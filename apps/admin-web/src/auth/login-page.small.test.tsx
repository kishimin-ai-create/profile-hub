import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { LoginPage } from "./login-page";

test("does not submit credentials twice before the first login completes", async () => {
  const login = vi
    .fn<(email: string, password: string) => Promise<boolean>>()
    .mockImplementation(() => new Promise(() => {}));
  render(<LoginPage login={login} onSuccess={vi.fn<() => void>()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.com");
  await user.type(screen.getByLabelText("パスワード"), "password");
  const form = screen.getByRole("button", { name: "ログイン" }).closest("form");
  if (!form) throw new Error("Missing login form");
  act(() => {
    fireEvent.submit(form);
    fireEvent.submit(form);
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
