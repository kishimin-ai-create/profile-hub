import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { createAdminRouter } from "./router";

describe("administrator route access", () => {
  test("shows a not-found page for an unknown route", async () => {
    const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/unknown"] }));
    render(<RouterProvider router={router} />);
    expect(
      await screen.findByRole("heading", { name: "ページが見つかりません" }),
    ).toBeInTheDocument();
  });
  test.each(["/dashboard", "/portfolio", "/portfolio/new", "/portfolio/42", "/profile", "/hobby"])(
    "redirects an unauthenticated direct visit to %s to login",
    async (path) => {
      const router = createAdminRouter(createMemoryHistory({ initialEntries: [path] }), {
        accessToken: () => null,
        restore: () => Promise.resolve(false),
        login: () => Promise.resolve(false),
        logout: () => Promise.resolve(),
      });
      render(<RouterProvider router={router} />);
      expect(await screen.findByRole("heading", { name: "ログイン" })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/login");
    },
  );
  test("allows a restored session to reach the requested protected route", async () => {
    const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/dashboard"] }), {
      accessToken: () => null,
      restore: () => Promise.resolve(true),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    });
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(router.state.status).toBe("idle"));
    expect(router.state.location.pathname).toBe("/dashboard");
  });
  test("opens the dashboard after signing in", async () => {
    const state: { token: string | null } = { token: null };
    const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/login"] }), {
      accessToken: () => state.token,
      restore: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
      login: () => {
        state.token = "access";
        return Promise.resolve(true);
      },
    });
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("メールアドレス"), "admin@example.com");
    await user.type(screen.getByLabelText("パスワード"), "password");
    await user.click(screen.getByRole("button", { name: "ログイン" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
  });
  test("authenticated administrators can navigate among the four management sections", async () => {
    const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/dashboard"] }), {
      accessToken: () => "access",
      restore: () => Promise.resolve(false),
      login: () => Promise.resolve(false),
      logout: () => Promise.resolve(),
    });
    render(<RouterProvider router={router} />);
    const nav = await screen.findByRole("navigation", { name: "管理メニュー" });
    expect(within(nav).getAllByRole("link")).toHaveLength(4);
    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Portfolio" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/portfolio"));
    await user.click(screen.getByRole("link", { name: "Profile" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile"));
    await user.click(screen.getByRole("link", { name: "Hobby" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/hobby"));
    await user.click(screen.getByRole("link", { name: "Dashboard" }));
    expect(await screen.findByRole("heading", { name: "ダッシュボード" })).toBeInTheDocument();
  });
  test("warns before leaving a new portfolio with unsaved changes", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/portfolio/new"] }), {
      accessToken: () => "access", restore: () => Promise.resolve(false), login: () => Promise.resolve(false), logout: () => Promise.resolve(),
    });
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("作品名"), "Draft");
    await user.click(screen.getByRole("link", { name: "Dashboard" }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(router.state.location.pathname).toBe("/portfolio/new");
    await user.click(screen.getByRole("link", { name: "Dashboard" }));
    expect(await screen.findByRole("heading", { name: "ダッシュボード" })).toBeInTheDocument();
    confirm.mockRestore();
  });
});
