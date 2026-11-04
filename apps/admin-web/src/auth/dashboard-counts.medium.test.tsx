import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { DashboardCounts } from "./dashboard-counts";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); vi.unstubAllEnvs(); });
afterAll(() => server.close());

test("shows portfolio and favourite counts from authenticated responses", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/portfolio", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({ data: [{ id: "1" }, { id: "2" }] });
    }),
    http.get("https://api.example.test/api/admin/favourites", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({ data: [{ id: "1" }] });
    }),
  );
  render(<DashboardCounts session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("2件")).toBeInTheDocument();
  expect(screen.getByText("1件")).toBeInTheDocument();
});
