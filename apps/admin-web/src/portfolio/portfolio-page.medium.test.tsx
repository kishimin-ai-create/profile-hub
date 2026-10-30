import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { PortfolioPage } from "./portfolio-page";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
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
