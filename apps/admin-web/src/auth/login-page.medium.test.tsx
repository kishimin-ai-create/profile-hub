import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { createBrowserSession } from "./browser-session";
import { LoginPage } from "./login-page";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

test("explains the login rate limit without exposing server details", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.post("https://api.example.test/api/admin/auth/browser/login", () =>
      HttpResponse.json({ error: "private detail" }, { status: 429 }),
    ),
  );
  const session = createBrowserSession();
  render(<LoginPage login={session.login} onSuccess={vi.fn<() => void>()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.test");
  await user.type(screen.getByLabelText("パスワード"), "wrong");
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("しばらく時間をおいて");
  expect(screen.queryByText("private detail")).not.toBeInTheDocument();
});

test("shows a generic message for invalid credentials", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.post("https://api.example.test/api/admin/auth/browser/login", () =>
      HttpResponse.json({ error: "private detail" }, { status: 401 }),
    ),
  );
  const session = createBrowserSession();
  render(<LoginPage login={session.login} onSuccess={vi.fn<() => void>()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.test");
  await user.type(screen.getByLabelText("パスワード"), "wrong");
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/^ログインできませんでした$/);
  expect(screen.queryByText("private detail")).not.toBeInTheDocument();
});

test("reports a server error without exposing its details", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.post("https://api.example.test/api/admin/auth/browser/login", () =>
      HttpResponse.json({ error: "private detail" }, { status: 500 }),
    ),
  );
  const session = createBrowserSession();
  render(<LoginPage login={session.login} onSuccess={vi.fn<() => void>()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.test");
  await user.type(screen.getByLabelText("パスワード"), "wrong");
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("時間をおいて再試行");
  expect(screen.queryByText("private detail")).not.toBeInTheDocument();
});

test("asks the administrator to check connectivity after a network failure", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.post("https://api.example.test/api/admin/auth/browser/login", () => HttpResponse.error()),
  );
  const session = createBrowserSession();
  render(<LoginPage login={session.login} onSuccess={vi.fn<() => void>()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("メールアドレス"), "admin@example.test");
  await user.type(screen.getByLabelText("パスワード"), "wrong");
  await user.click(screen.getByRole("button", { name: "ログイン" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("通信状態を確認");
});
