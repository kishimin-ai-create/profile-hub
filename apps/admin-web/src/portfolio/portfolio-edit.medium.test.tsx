import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { createAdminRouter } from "../app/router/router";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

test("an administrator can load and update a portfolio", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const state = { saved: false };
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  server.use(
    http.get("https://api.example.test/api/admin/portfolio/42", () =>
      HttpResponse.json({
        data: {
          id: "42",
          section: "hobby",
          name: "Old",
          summary: "Summary",
          technologies: ["Bun"],
          displayOrder: 1,
          repositoryUrl: null,
          demoUrl: "https://example.test",
          imageUrl: null,
        },
      }),
    ),
    http.put("https://api.example.test/api/admin/portfolio/42", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      const body: unknown = await request.json();
      expect(body).toMatchObject({
        section: "hobby",
        name: "Updated",
        demoUrl: "https://example.test",
      });
      state.saved = true;
      return HttpResponse.json({ data: { id: "42" } });
    }),
    http.get("https://api.example.test/api/admin/portfolio", () =>
      HttpResponse.json({
        data: [{ id: "42", section: "hobby", name: state.saved ? "Updated" : "Old" }],
      }),
    ),
  );
  const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/portfolio"] }), {
    accessToken: () => "access",
    restore: () => Promise.resolve(false),
    login: () => Promise.resolve(false),
    logout: () => Promise.resolve(),
  });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole("link", { name: "Old を編集" }));
  const name = await screen.findByLabelText("作品名");
  expect(name).toHaveValue("Old");
  await user.clear(name);
  await user.type(name, "Updated");
  await user.click(screen.getByRole("link", { name: "Dashboard" }));
  expect(confirm).toHaveBeenCalledOnce();
  expect(router.state.location.pathname).toBe("/portfolio/42");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByText("Updated")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/portfolio");
});
