import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { sessionRenewedError } from "../api/authorized-request";
import { FavouriteForm } from "./favourite-form";

test("submits a new favourite with its web link and display order", async () => {
  const save = vi.fn<(value: unknown) => Promise<void>>().mockResolvedValue();
  const onSuccess = vi.fn<() => void>();
  render(<FavouriteForm save={save} onSuccess={onSuccess} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("名前"), "Tea");
  await user.type(screen.getByLabelText("説明"), "Green tea");
  await user.type(screen.getByLabelText("URL"), "https://example.com");
  await user.type(screen.getByLabelText("表示順"), "1");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(save).toHaveBeenCalledWith({
    name: "Tea",
    description: "Green tea",
    link: "https://example.com",
    displayOrder: 1,
  });
  expect(onSuccess).toHaveBeenCalledOnce();
});

test("rejects unsafe links before saving", async () => {
  const save = vi.fn<(value: unknown) => Promise<void>>().mockResolvedValue();
  render(<FavouriteForm save={save} onSuccess={() => {}} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("名前"), "Tea");
  await user.type(screen.getByLabelText("説明"), "Green tea");
  await user.type(screen.getByLabelText("URL"), "javascript:alert(1)");
  await user.type(screen.getByLabelText("表示順"), "1");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("http または https");
  expect(screen.getByLabelText("URL")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("URL")).toHaveAccessibleDescription(
    "http または https の URL を入力してください",
  );
  expect(save).not.toHaveBeenCalled();
});

test("keeps input when session renewal requires an explicit retry", async () => {
  const onSuccess = vi.fn<() => void>();
  render(<FavouriteForm save={() => Promise.reject(sessionRenewedError)} onSuccess={onSuccess} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("名前"), "Tea");
  await user.type(screen.getByLabelText("説明"), "Green tea");
  await user.type(screen.getByLabelText("URL"), "https://example.com");
  await user.type(screen.getByLabelText("表示順"), "1");
  await user.click(screen.getByRole("button", { name: "作成" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "認証を更新しました。もう一度保存してください",
  );
  expect(screen.getByLabelText("名前")).toHaveValue("Tea");
  expect(onSuccess).not.toHaveBeenCalled();
});

test("prepopulates an existing favourite for editing", async () => {
  const save = vi.fn<(value: unknown) => Promise<void>>().mockResolvedValue();
  render(
    <FavouriteForm
      save={save}
      onSuccess={() => {}}
      initial={{
        name: "Tea",
        description: "Green tea",
        link: "https://example.com",
        displayOrder: 1,
      }}
    />,
  );
  const user = userEvent.setup();
  expect(screen.getByLabelText("名前")).toHaveValue("Tea");
  await user.clear(screen.getByLabelText("名前"));
  await user.type(screen.getByLabelText("名前"), "Coffee");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(save).toHaveBeenCalledWith({
    name: "Coffee",
    description: "Green tea",
    link: "https://example.com",
    displayOrder: 1,
  });
});
