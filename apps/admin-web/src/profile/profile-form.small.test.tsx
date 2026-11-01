import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { sessionRenewedError } from "../api/authorized-request";
import { ProfileForm } from "./profile-form";

test("submits profile changes with nullable optional fields", async () => {
  const save = vi.fn<(value: unknown) => Promise<void>>().mockResolvedValue();
  const onSuccess = vi.fn<() => void>();
  render(
    <ProfileForm
      save={save}
      onSuccess={onSuccess}
      initial={{ name: "Example", title: null, bio: null, avatarUrl: null }}
    />,
  );
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText("名前"));
  await user.type(screen.getByLabelText("名前"), "Updated");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(save).toHaveBeenCalledWith({ name: "Updated", title: null, bio: null, avatarUrl: null });
  expect(onSuccess).toHaveBeenCalledOnce();
});

test("rejects an unsafe avatar URL", async () => {
  const save = vi.fn<(value: unknown) => Promise<void>>().mockResolvedValue();
  render(
    <ProfileForm
      save={save}
      onSuccess={() => {}}
      initial={{ name: "Example", title: null, bio: null, avatarUrl: null }}
    />,
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("画像 URL"), "javascript:alert(1)");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("http または https");
  expect(screen.getByLabelText("画像 URL")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("画像 URL")).toHaveAccessibleDescription(
    "http または https の URL を入力してください",
  );
  expect(save).not.toHaveBeenCalled();
});

test("keeps changes when the session is renewed without replaying the write", async () => {
  const onSuccess = vi.fn<() => void>();
  render(
    <ProfileForm
      save={() => Promise.reject(sessionRenewedError)}
      onSuccess={onSuccess}
      initial={{ name: "Example", title: null, bio: null, avatarUrl: null }}
    />,
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("肩書き"), "Developer");
  await user.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "認証を更新しました。もう一度保存してください",
  );
  expect(screen.getByLabelText("肩書き")).toHaveValue("Developer");
  expect(onSuccess).not.toHaveBeenCalled();
});
