import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { createAppRouter } from "./router";

describe("public routes", () => {
  test.each([
    ["/", "Home"],
    ["/engineering", "Engineering"],
    ["/engineering/contact", "Engineering Contact"],
    ["/hobby", "Hobby"],
    ["/hobby/contact", "Hobby Contact"],
    ["/unknown", "ページが見つかりません"],
    ["/engineering/unknown", "ページが見つかりません"],
    ["/hobby/unknown", "ページが見つかりません"],
  ])("opens %s directly as %s", async (path, heading) => {
    const history = createMemoryHistory({ initialEntries: [path] });
    const router = createAppRouter(history);

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
  });
});
