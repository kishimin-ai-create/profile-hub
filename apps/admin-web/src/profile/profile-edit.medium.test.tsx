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

test("updates the profile and returns to its display screen", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const state = { name: "Example" };
  server.use(
    http.get("https://api.example.test/api/admin/profile", () =>
      HttpResponse.json({
        data: { id: "1", name: state.name, title: null, bio: null, avatarUrl: null },
      }),
    ),
    http.put("https://api.example.test/api/admin/profile", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      expect(await request.json()).toEqual({
        name: "Updated",
        title: null,
        bio: null,
        avatarUrl: null,
      });
      state.name = "Updated";
      return HttpResponse.json({ data: { id: "1" } });
    }),
  );
  const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/profile/edit"] }), {
    accessToken: () => "access",
    restore: () => Promise.resolve(false),
    login: () => Promise.resolve(false),
    logout: () => Promise.resolve(),
  });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  const name = await screen.findByLabelText("名前");
  await user.clear(name);
  await user.type(name, "Updated");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByText("Updated")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/profile");
});
