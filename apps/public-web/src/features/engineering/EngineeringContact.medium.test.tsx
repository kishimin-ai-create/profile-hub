import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { EngineeringContact } from "./EngineeringContact";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const show = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <EngineeringContact />
    </QueryClientProvider>,
  );

test("shows engineering links without the hobby section", async () => {
  server.use(
    http.get("*/api/public/profile", () =>
      HttpResponse.json({
        data: {
          links: {
            engineering: [
              { id: "1", kind: "github", url: "https://github.com/example" },
              { id: "2", kind: "articles", url: "https://example.com/articles" },
            ],
            hobby: [{ id: "3", kind: "github", url: "https://hobby.example" }],
          },
        },
      }),
    ),
  );
  show();
  expect(await screen.findByRole("link", { name: "GitHub" })).toHaveAttribute(
    "href",
    "https://github.com/example",
  );
  expect(screen.getByRole("link", { name: "Articles" })).toHaveAttribute(
    "href",
    "https://example.com/articles",
  );
  expect(screen.getAllByRole("link")).toHaveLength(2);
});

test("shows an empty state for absent links", async () => {
  server.use(
    http.get("*/api/public/profile", () =>
      HttpResponse.json({ data: { links: { engineering: [], hobby: [] } } }),
    ),
  );
  show();
  expect(await screen.findByText("連絡先はまだありません。")).toBeInTheDocument();
});

test("rejects unsafe link URLs", async () => {
  server.use(
    http.get("*/api/public/profile", () =>
      HttpResponse.json({
        data: {
          links: {
            engineering: [{ id: "1", kind: "github", url: "javascript:alert(1)" }],
            hobby: [],
          },
        },
      }),
    ),
  );
  show();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
