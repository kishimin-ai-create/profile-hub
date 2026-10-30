import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { PortfolioCreate } from "./portfolio-create";

test("submits a new portfolio in its selected section", async () => {
  const save = vi.fn<(value: unknown) => Promise<void>>().mockResolvedValue();
  const onSuccess = vi.fn<() => void>();
  render(<PortfolioCreate save={save} onSuccess={onSuccess} />);
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("セクション"), "hobby");
  await user.type(screen.getByLabelText("作品名"), "My project");
  await user.type(screen.getByLabelText("概要"), "A project");
  await user.type(screen.getByLabelText("技術（カンマ区切り）"), "Bun, React");
  await user.type(screen.getByLabelText("表示順"), "2");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(save).toHaveBeenCalledWith({
    section: "hobby",
    name: "My project",
    summary: "A project",
    technologies: ["Bun", "React"],
    displayOrder: 2,
  });
  expect(onSuccess).toHaveBeenCalledOnce();
});

test("shows a save error without navigating", async () => {
  const onSuccess = vi.fn<() => void>();
  render(
    <PortfolioCreate save={() => Promise.reject(new Error("offline"))} onSuccess={onSuccess} />,
  );
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("セクション"), "engineering");
  await user.type(screen.getByLabelText("作品名"), "Project");
  await user.type(screen.getByLabelText("概要"), "Summary");
  await user.type(screen.getByLabelText("技術（カンマ区切り）"), "Bun");
  await user.type(screen.getByLabelText("表示順"), "1");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("作品を保存できませんでした");
  expect(onSuccess).not.toHaveBeenCalled();
});

test("rejects unsafe portfolio URLs with a field error", async () => {
  const save = vi.fn<(value: unknown) => Promise<void>>().mockResolvedValue();
  render(<PortfolioCreate save={save} onSuccess={() => {}} />);
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("セクション"), "hobby");
  await user.type(screen.getByLabelText("作品名"), "Project");
  await user.type(screen.getByLabelText("概要"), "Summary");
  await user.type(screen.getByLabelText("技術（カンマ区切り）"), "Bun");
  await user.type(screen.getByLabelText("表示順"), "1");
  await user.type(screen.getByLabelText("デモ URL"), "javascript:alert(1)");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(screen.getByLabelText("デモ URL")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByText("http または https の URL を入力してください")).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
});
