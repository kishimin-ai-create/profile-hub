import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { createAppRouter } from "../../app/router/router";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("shows the public profile on the engineering page", async () => {
  server.use(http.get("*/api/public/profile", () => HttpResponse.json({ data: { profile: { id: "1", name: "Example", title: "Engineer", bio: "Introduction", avatarUrl: null }, skills: [], links: { engineering: [], hobby: [] } } })));
  const router = createAppRouter(createMemoryHistory({ initialEntries: ["/engineering"] }));
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RouterProvider router={router} /></QueryClientProvider>);
  expect(await screen.findByText("Example")).toBeInTheDocument();
  expect(screen.getByText("Introduction")).toBeInTheDocument();
});
