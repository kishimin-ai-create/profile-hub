import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Dashboard } from "./dashboard";

test("successful logout returns to the login page", async () => {
  const onSuccess = vi.fn<() => void>();
  render(<Dashboard logout={() => Promise.resolve()} onSuccess={onSuccess} />);
  await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));
  expect(onSuccess).toHaveBeenCalledOnce();
});

test("failed logout reports that server sign-out was not confirmed", async () => {
  const onSuccess = vi.fn<() => void>();
  render(<Dashboard logout={() => Promise.reject(new Error("offline"))} onSuccess={onSuccess} />);
  await userEvent.click(screen.getByRole("button", { name: "ログアウト" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("ログアウトを確認できませんでした");
  expect(onSuccess).not.toHaveBeenCalled();
});
