import { render, screen, within } from "@testing-library/react";
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
