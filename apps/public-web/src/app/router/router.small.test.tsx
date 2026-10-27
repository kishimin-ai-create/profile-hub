import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { createAppRouter } from "./router";

describe("public routes", () => {
  test.each([
    ["/engineering", "Engineering", "Hobby"],
    ["/hobby", "Hobby", "Engineering"],
  ])(
    "keeps navigation within %s and returns home through the logo",
    async (path, section, other) => {
      const user = userEvent.setup();
      const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));

      render(<RouterProvider router={router} />);

      const header = within(await screen.findByRole("banner"));
      expect(header.queryByRole("link", { name: other })).not.toBeInTheDocument();
      await user.click(header.getByRole("link", { name: "Contact" }));
      expect(
        await screen.findByRole("heading", { name: `${section} Contact` }),
      ).toBeInTheDocument();
      expect(header.getByRole("link", { name: "Contact" })).toHaveAttribute("aria-current", "page");
      expect(header.queryByRole("link", { name: other })).not.toBeInTheDocument();
      await user.click(header.getByRole("link", { name: section }));
      expect(await screen.findByRole("region", { name: section })).toBeInTheDocument();
      await user.click(header.getByRole("link", { name: "profile-hub" }));
      expect(await screen.findByRole("heading", { name: "Home" })).toBeInTheDocument();
      expect(
        within(screen.getByRole("contentinfo")).getByText("© kishimin 2026"),
      ).toBeInTheDocument();
    },
  );

  test.each(["Engineering", "Hobby"])("enters %s from home", async (section) => {
    const user = userEvent.setup();
    const history = createMemoryHistory({ initialEntries: ["/"] });
    const router = createAppRouter(history);

    render(<RouterProvider router={router} />);

    await user.click(await screen.findByRole("link", { name: section }));

    expect(await screen.findByRole("region", { name: section })).toBeInTheDocument();
  });

  test.each([
    ["/", "Home"],
    ["/engineering", "こんにちは。"],
    ["/engineering/contact", "Engineering Contact"],
    ["/hobby", "こんにちは。"],
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
