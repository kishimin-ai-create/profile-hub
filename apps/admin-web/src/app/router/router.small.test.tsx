import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { createAdminRouter } from "./router";

describe("administrator route access", () => {
  test.each(["/dashboard", "/portfolio", "/profile", "/hobby"])(
    "redirects an unauthenticated direct visit to %s to login",
    async (path) => {
      const router = createAdminRouter(createMemoryHistory({ initialEntries: [path] }));
      render(<RouterProvider router={router} />);
      expect(await screen.findByRole("heading", { name: "ログイン" })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/login");
    },
  );
});
