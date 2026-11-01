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

test("creating a portfolio sends authenticated data and returns to the list", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const confirmation = vi.spyOn(window, "confirm");
  server.use(
    http.post("https://api.example.test/api/admin/portfolio", async ({ request }) => {
      const body: unknown = await request.json();
      if (request.headers.get("Authorization") !== "Bearer access")
        return new HttpResponse(null, { status: 401 });
      expect(body).toMatchObject({ section: "hobby", name: "New project", technologies: ["Bun"] });
      return HttpResponse.json({ data: { id: "1" } }, { status: 201 });
    }),
    http.get("https://api.example.test/api/admin/portfolio", () =>
      HttpResponse.json({ data: [{ id: "1", section: "hobby", name: "New project" }] }),
    ),
  );
  const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/portfolio/new"] }), {
    accessToken: () => "access",
    restore: () => Promise.resolve(false),
    login: () => Promise.resolve(false),
    logout: () => Promise.resolve(),
  });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.selectOptions(await screen.findByLabelText("セクション"), "hobby");
  await user.type(screen.getByLabelText("作品名"), "New project");
  await user.type(screen.getByLabelText("概要"), "Summary");
  await user.type(screen.getByLabelText("技術（カンマ区切り）"), "Bun");
  await user.type(screen.getByLabelText("表示順"), "1");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByText("New project")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/portfolio");
  expect(confirmation).not.toHaveBeenCalled();
});

test("an expired write renews the session without replaying the submission", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const state = { token: "expired", writes: 0 };
  const restore = vi.fn<() => Promise<boolean>>(() => {
    state.token = "fresh";
    return Promise.resolve(true);
  });
  server.use(
    http.post("https://api.example.test/api/admin/portfolio", ({ request }) => {
      state.writes += 1;
      return request.headers.get("Authorization") === "Bearer fresh"
        ? HttpResponse.json({ data: { id: "1" } }, { status: 201 })
        : new HttpResponse(null, { status: 401 });
    }),
    http.get("https://api.example.test/api/admin/portfolio", () =>
      HttpResponse.json({ data: [{ id: "1", section: "hobby", name: "Project" }] }),
    ),
  );
  const router = createAdminRouter(createMemoryHistory({ initialEntries: ["/portfolio/new"] }), {
    accessToken: () => state.token,
    restore,
    login: () => Promise.resolve(false),
    logout: () => Promise.resolve(),
  });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup();
  await user.selectOptions(await screen.findByLabelText("セクション"), "hobby");
  await user.type(screen.getByLabelText("作品名"), "Project");
  await user.type(screen.getByLabelText("概要"), "Summary");
  await user.type(screen.getByLabelText("技術（カンマ区切り）"), "Bun");
  await user.type(screen.getByLabelText("表示順"), "1");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "認証を更新しました。もう一度保存してください",
  );
  expect(state.writes).toBe(1);
  expect(screen.getByLabelText("作品名")).toHaveValue("Project");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByText("Project")).toBeInTheDocument();
  expect(state.writes).toBe(2);
});
