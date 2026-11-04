import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { SkillList } from "./skill-list";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

test("shows ordered skills from the authenticated API", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/skills", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return HttpResponse.json({ data: [{ id: "1", name: "TypeScript", displayOrder: 0 }] });
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("TypeScript")).toBeInTheDocument();
});

test("reports skill loading errors", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get(
      "https://api.example.test/api/admin/skills",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルを取得できませんでした");
});

test("retries skills after a temporary loading failure", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const attempts = { count: 0 };
  server.use(
    http.get("https://api.example.test/api/admin/skills", () => {
      attempts.count += 1;
      return attempts.count === 1
        ? new HttpResponse(null, { status: 500 })
        : HttpResponse.json({ data: [{ id: "1", name: "Recovered", displayOrder: 0 }] });
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルを取得できませんでした");
  await userEvent.click(screen.getByRole("button", { name: "再試行" }));
  expect(await screen.findByText("Recovered")).toBeInTheDocument();
});

test("shows an empty skill list", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/skills", () => HttpResponse.json({ data: [] })),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  expect(await screen.findByText("スキルがありません")).toBeInTheDocument();
});

test("deletes a skill after confirmation", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({ data: [{ id: "1", name: "TypeScript", displayOrder: 0 }] }),
    ),
    http.delete("https://api.example.test/api/admin/skills/1", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "TypeScript を削除" }));
  expect(await screen.findByText("スキルがありません")).toBeInTheDocument();
});

test("retains the skill if deletion fails", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({ data: [{ id: "1", name: "TypeScript", displayOrder: 0 }] }),
    ),
    http.delete(
      "https://api.example.test/api/admin/skills/1",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "TypeScript を削除" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルを削除できませんでした");
  expect(screen.getByText("TypeScript")).toBeInTheDocument();
});

test("does not delete a skill when confirmation is cancelled", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(false);
  const remove = vi.fn<() => void>();
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({ data: [{ id: "1", name: "TypeScript", displayOrder: 0 }] }),
    ),
    http.delete("https://api.example.test/api/admin/skills/1", () => {
      remove();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "TypeScript を削除" }));
  expect(remove).not.toHaveBeenCalled();
  expect(screen.getByText("TypeScript")).toBeInTheDocument();
});

test("reorders the complete skill list through the authenticated API", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({
        data: [
          { id: "1", name: "TypeScript", displayOrder: 0 },
          { id: "2", name: "Bun", displayOrder: 1 },
        ],
      }),
    ),
    http.patch("https://api.example.test/api/admin/skills/order", async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer access");
      expect(await request.json()).toEqual({ ids: ["2", "1"] });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Bun を上へ" }));
  await waitFor(() => {
    const items = within(screen.getByRole("list", { name: "スキル一覧" })).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Bun");
    expect(items[1]).toHaveTextContent("TypeScript");
  });
});

test("keeps the skill order when saving fails", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({
        data: [
          { id: "1", name: "TypeScript", displayOrder: 0 },
          { id: "2", name: "Bun", displayOrder: 1 },
        ],
      }),
    ),
    http.patch(
      "https://api.example.test/api/admin/skills/order",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  await userEvent.click(await screen.findByRole("button", { name: "Bun を上へ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルの順序を変更できませんでした");
  const items = within(screen.getByRole("list", { name: "スキル一覧" })).getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("TypeScript");
});
