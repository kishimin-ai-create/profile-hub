import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { EngineeringSkills } from "./EngineeringSkills";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const show = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><EngineeringSkills /></QueryClientProvider>);

test("renders individual skills in the API order", async () => {
  server.use(http.get("*/api/public/profile", () => HttpResponse.json({ data: { skills: [{ id: "1", name: "TypeScript", displayOrder: 0 }, { id: "2", name: "Bun", displayOrder: 1 }] } })));
  show();
  const list = await screen.findByRole("list", { name: "技術スタック" });
  const items = within(list).getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("TypeScript");
  expect(items[1]).toHaveTextContent("Bun");
});

test("shows a skill empty state", async () => {
  server.use(http.get("*/api/public/profile", () => HttpResponse.json({ data: { skills: [] } })));
  show();
  expect(await screen.findByText("技術スタックはまだありません。" )).toBeInTheDocument();
});

test("shows an error when the API fails", async () => {
  server.use(http.get("*/api/public/profile", () => new HttpResponse(null, { status: 500 })));
  show();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
