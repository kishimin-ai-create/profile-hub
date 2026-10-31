import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { PortfolioPage } from "./portfolio-page";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("a confirmed deletion reaches the API with the current credential", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.get("https://api.example.test/api/admin/portfolio", () =>
      HttpResponse.json({ data: [{ id: "12", name: "Project", section: "hobby" }] }),
    ),
    http.delete("https://api.example.test/api/admin/portfolio/12", ({ request }) =>
      request.headers.get("Authorization") === "Bearer access"
        ? new HttpResponse(null, { status: 204 })
        : new HttpResponse(null, { status: 401 }),
    ),
  );
  render(<PortfolioPage session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Project を削除" }));
  expect(await screen.findByText("作品がありません")).toBeInTheDocument();
});

test("reordering submits a complete section to the authenticated API", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/portfolio", () =>
      HttpResponse.json({
        data: [
          { id: "1", name: "First", section: "hobby" },
          { id: "2", name: "Second", section: "hobby" },
        ],
      }),
    ),
    http.patch("https://api.example.test/api/admin/portfolio/order", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      const body: unknown = await request.json();
      expect(body).toEqual({ section: "hobby", ids: ["2", "1"] });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<PortfolioPage session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Second を上へ" }));
  await waitFor(() => {
    const items = within(screen.getByRole("list", { name: "作品一覧" })).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Second");
    expect(items[1]).toHaveTextContent("First");
  });
});

test("an expired read is restored before the portfolio list appears", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const state = { token: "expired" };
  const restore = vi.fn<() => Promise<boolean>>(() => {
    state.token = "fresh";
    return Promise.resolve(true);
  });
  server.use(
    http.get("https://api.example.test/api/admin/portfolio", ({ request }) =>
      request.headers.get("Authorization") === "Bearer fresh"
        ? HttpResponse.json({ data: [{ id: "1", name: "Project", section: "hobby" }] })
        : new HttpResponse(null, { status: 401 }),
    ),
  );
  render(<PortfolioPage session={{ accessToken: () => state.token, restore }} />);
  expect(await screen.findByText("Project")).toBeInTheDocument();
  expect(restore).toHaveBeenCalledOnce();
});
afterAll(() => server.close());

test("the portfolio page displays authenticated API results", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/portfolio", ({ request }) => {
      if (request.headers.get("Authorization") !== "Bearer access")
        return new HttpResponse(null, { status: 401 });
      return HttpResponse.json({ data: [{ id: "12", name: "Project", section: "hobby" }] });
    }),
  );
  render(<PortfolioPage session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("Project")).toBeInTheDocument();
  expect(
    within(screen.getByRole("list", { name: "作品一覧" })).getByText("hobby"),
  ).toBeInTheDocument();
});
