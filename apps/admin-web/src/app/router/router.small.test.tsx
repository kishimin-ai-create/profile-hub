import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
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
      const router = createAdminRouter(createMemoryHistory({ initialEntries: [path] }));
      render(<RouterProvider router={router} />);
      expect(await screen.findByRole("heading", { name: "ログイン" })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/login");
    },
  );
});
