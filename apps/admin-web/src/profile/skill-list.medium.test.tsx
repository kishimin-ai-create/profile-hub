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

test("does not show an old reorder error after the session changes", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const gate = { release: () => {}, started: false };
  const response = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  server.use(
    http.get("https://api.example.test/api/admin/skills", ({ request }) =>
      HttpResponse.json({
        data:
          request.headers.get("Authorization") === "Bearer old"
            ? [
                { id: "1", name: "Old first", displayOrder: 0 },
                { id: "2", name: "Old second", displayOrder: 1 },
              ]
            : [{ id: "3", name: "New", displayOrder: 0 }],
      }),
    ),
    http.patch("https://api.example.test/api/admin/skills/order", async () => {
      gate.started = true;
      await response;
      return new HttpResponse(null, { status: 500 });
    }),
  );
  const oldSession = { accessToken: () => "old" };
  const newSession = { accessToken: () => "new" };
  const view = render(<SkillList session={oldSession} />);
  try {
    await userEvent.click(await screen.findByRole("button", { name: "Old second を上へ" }));
    await waitFor(() => expect(gate.started).toBe(true));
    view.rerender(<SkillList session={newSession} />);
    const button = await screen.findByRole("button", { name: "New を削除" });
    gate.release();
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  } finally {
    gate.release();
  }
});

test("does not show an old deletion error after the session changes", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const gate = { release: () => {}, started: false };
  const response = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  server.use(
    http.get("https://api.example.test/api/admin/skills", ({ request }) =>
      HttpResponse.json({
        data: [
          {
            id: "1",
            name: request.headers.get("Authorization") === "Bearer old" ? "Old" : "New",
            displayOrder: 0,
          },
        ],
      }),
    ),
    http.delete("https://api.example.test/api/admin/skills/1", async () => {
      gate.started = true;
      await response;
      return new HttpResponse(null, { status: 500 });
    }),
  );
  const oldSession = { accessToken: () => "old" };
  const newSession = { accessToken: () => "new" };
  const view = render(<SkillList session={oldSession} />);
  try {
    await userEvent.click(await screen.findByRole("button", { name: "Old を削除" }));
    await waitFor(() => expect(gate.started).toBe(true));
    view.rerender(<SkillList session={newSession} />);
    const button = await screen.findByRole("button", { name: "New を削除" });
    gate.release();
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  } finally {
    gate.release();
  }
});

test("announces a successful skill deletion and clears it on failure", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({
        data: [
          { id: "1", name: "First", displayOrder: 0 },
          { id: "2", name: "Second", displayOrder: 1 },
        ],
      }),
    ),
    http.delete(
      "https://api.example.test/api/admin/skills/1",
      () => new HttpResponse(null, { status: 204 }),
    ),
    http.delete(
      "https://api.example.test/api/admin/skills/2",
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  const status = screen.getByRole("status");
  await userEvent.click(await screen.findByRole("button", { name: "First を削除" }));
  await waitFor(() => expect(status).toHaveTextContent("First を削除しました"));
  await userEvent.click(screen.getByRole("button", { name: "Second を削除" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルを削除できませんでした");
  expect(status).toBeEmptyDOMElement();
});

test("announces a successful skill reorder and clears it on failure", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const attempts = { count: 0 };
  server.use(
    http.get("https://api.example.test/api/admin/skills", () =>
      HttpResponse.json({
        data: [
          { id: "1", name: "First", displayOrder: 0 },
          { id: "2", name: "Second", displayOrder: 1 },
        ],
      }),
    ),
    http.patch("https://api.example.test/api/admin/skills/order", () => {
      attempts.count += 1;
      return new HttpResponse(null, { status: attempts.count === 1 ? 204 : 500 });
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  const status = screen.getByRole("status");
  await userEvent.click(await screen.findByRole("button", { name: "Second を上へ" }));
  await waitFor(() => expect(status).toHaveTextContent("Second の順序を変更しました"));
  await userEvent.click(screen.getByRole("button", { name: "Second を下へ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("スキルの順序を変更できませんでした");
  expect(status).toBeEmptyDOMElement();
});

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

test("announces loading again while retrying skills", async () => {
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  const attempts = { count: 0 };
  server.use(
    http.get("https://api.example.test/api/admin/skills", () => {
      attempts.count += 1;
      return attempts.count === 1
        ? new HttpResponse(null, { status: 500 })
        : new Promise<Response>(() => {});
    }),
  );
  render(<SkillList session={{ accessToken: () => "access" }} />);
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("スキルを読み込み中");
  await screen.findByRole("alert");
  expect(status).toBeEmptyDOMElement();
  await userEvent.click(screen.getByRole("button", { name: "再試行" }));
  expect(status).toHaveTextContent("スキルを読み込み中");
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
