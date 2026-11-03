import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { SectionProjects } from "../../components/SectionProjects";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const show = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <SectionProjects section={"hobby"} />
    </QueryClientProvider>,
  );
const project = {
  id: "1",
  section: "hobby",
  name: "Project",
  summary: "Built for fun",
  technologies: ["TypeScript"],
  repositoryUrl: null,
  demoUrl: "https://example.com/demo",
  imageUrl: null,
  displayOrder: 0,
};

test("requests hobby projects and renders optional links", async () => {
  server.use(
    http.get("*/api/public/portfolio", ({ request }) => {
      expect(new URL(request.url).searchParams.get("section")).toBe("hobby");
      return HttpResponse.json({ data: [project] });
    }),
  );
  show();
  expect(await screen.findByText("Project")).toBeInTheDocument();
  expect(screen.getByText("TypeScript")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Project のデモ" })).toHaveAttribute(
    "href",
    "https://example.com/demo",
  );
  expect(screen.queryByRole("link", { name: "Project のリポジトリ" })).not.toBeInTheDocument();
});

test("shows the project empty state", async () => {
  server.use(http.get("*/api/public/portfolio", () => HttpResponse.json({ data: [] })));
  show();
  expect(await screen.findByText("作品はまだありません。")).toBeInTheDocument();
});

test("rejects a project belonging to engineering", async () => {
  server.use(
    http.get("*/api/public/portfolio", () =>
      HttpResponse.json({ data: [{ ...project, section: "engineering" }] }),
    ),
  );
  show();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText("Project")).not.toBeInTheDocument();
});

test("rejects unsafe project links", async () => {
  server.use(
    http.get("*/api/public/portfolio", () =>
      HttpResponse.json({ data: [{ ...project, demoUrl: "javascript:alert(1)" }] }),
    ),
  );
  show();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
});
