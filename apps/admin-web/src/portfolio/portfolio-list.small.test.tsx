import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { PortfolioList } from "./portfolio-list";

test("does not show an old deletion error after the data source changes", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const pending = { reject: (_reason: Error) => {} };
  const remove = () =>
    new Promise<void>((_resolve, reject) => {
      pending.reject = reject;
    });
  const oldLoad = () => Promise.resolve([{ id: "1", name: "Old", section: "hobby" as const }]);
  const newLoad = () => Promise.resolve([{ id: "2", name: "New", section: "hobby" as const }]);
  const view = render(<PortfolioList load={oldLoad} remove={remove} />);
  await userEvent.click(await screen.findByRole("button", { name: "Old を削除" }));
  view.rerender(<PortfolioList load={newLoad} remove={remove} />);
  await screen.findByText("New");
  await act(async () => {
    pending.reject(new Error("offline"));
    await Promise.resolve();
  });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  vi.restoreAllMocks();
});

test("shows each portfolio section and filters the list", async () => {
  render(
    <PortfolioList
      load={() =>
        Promise.resolve([
          { id: "1", name: "Work", section: "engineering" },
          { id: "2", name: "Hobby", section: "hobby" },
        ])
      }
    />,
  );
  const list = await screen.findByRole("list", { name: "作品一覧" });
  expect(within(list).getByText("engineering")).toBeInTheDocument();
  expect(within(list).getByText("hobby")).toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText("セクション"), "hobby");
  expect(within(list).queryByText("Work")).not.toBeInTheDocument();
  expect(within(list).getByText("Hobby")).toBeInTheDocument();
});

test("reports failed loading and an empty list", async () => {
  const view = render(<PortfolioList load={() => Promise.reject(new Error("offline"))} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("作品を取得できませんでした");
  view.unmount();
  render(<PortfolioList load={() => Promise.resolve([])} />);
  expect(await screen.findByText("作品がありません")).toBeInTheDocument();
});

test("retries loading after a temporary failure", async () => {
  const load = vi
    .fn<() => Promise<import("./portfolio-list").PortfolioRow[]>>()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce([{ id: "1", name: "Recovered", section: "hobby" }]);
  render(<PortfolioList load={load} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("作品を取得できませんでした");
  await userEvent.click(screen.getByRole("button", { name: "再試行" }));
  expect(await screen.findByText("Recovered")).toBeInTheDocument();
});

test("reports loading while retrying a portfolio list", async () => {
  const load = vi
    .fn<() => Promise<import("./portfolio-list").PortfolioRow[]>>()
    .mockRejectedValueOnce(new Error("offline"))
    .mockImplementationOnce(() => new Promise(() => {}));
  render(<PortfolioList load={load} />);
  const status = screen.getByRole("status");
  expect(status).toHaveTextContent("読み込み中");
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(status).toBeEmptyDOMElement();
  await userEvent.click(screen.getByRole("button", { name: "再試行" }));
  expect(status).toHaveTextContent("読み込み中");
});

test("does not show previous results after the data source changes", async () => {
  const view = render(
    <PortfolioList load={() => Promise.resolve([{ id: "1", name: "Old", section: "hobby" }])} />,
  );
  expect(await screen.findByText("Old")).toBeInTheDocument();
  view.rerender(<PortfolioList load={() => new Promise(() => {})} />);
  expect(screen.queryByText("Old")).not.toBeInTheDocument();
  expect(screen.getByText("読み込み中")).toBeInTheDocument();
});

test("asks for confirmation before deleting a portfolio", async () => {
  const remove = vi.fn<(id: string) => Promise<void>>().mockResolvedValue();
  const confirmation = vi
    .spyOn(window, "confirm")
    .mockReturnValueOnce(false)
    .mockReturnValueOnce(true);
  render(
    <PortfolioList
      load={() => Promise.resolve([{ id: "1", name: "Project", section: "hobby" }])}
      remove={remove}
    />,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Project を削除" }));
  expect(remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Project を削除" }));
  expect(remove).toHaveBeenCalledWith("1");
  expect(await screen.findByText("作品がありません")).toBeInTheDocument();
  confirmation.mockRestore();
});

test("keeps the portfolio visible when deletion fails", async () => {
  const confirmation = vi.spyOn(window, "confirm").mockReturnValue(true);
  render(
    <PortfolioList
      load={() => Promise.resolve([{ id: "1", name: "Project", section: "hobby" }])}
      remove={() => Promise.reject(new Error("offline"))}
    />,
  );
  await userEvent.click(await screen.findByRole("button", { name: "Project を削除" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("作品を削除できませんでした");
  expect(screen.getByText("Project")).toBeInTheDocument();
  confirmation.mockRestore();
});

test("announces a successful deletion and clears it on failure", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const remove = vi
    .fn<(id: string) => Promise<void>>()
    .mockResolvedValueOnce()
    .mockRejectedValueOnce(new Error("offline"));
  render(
    <PortfolioList
      load={() =>
        Promise.resolve([
          { id: "1", name: "First", section: "hobby" },
          { id: "2", name: "Second", section: "hobby" },
        ])
      }
      remove={remove}
    />,
  );
  const status = screen.getByRole("status");
  await userEvent.click(await screen.findByRole("button", { name: "First を削除" }));
  expect(status).toHaveTextContent("First を削除しました");
  await userEvent.click(screen.getByRole("button", { name: "Second を削除" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("作品を削除できませんでした");
  expect(status).toBeEmptyDOMElement();
  vi.restoreAllMocks();
});

test("reorders entries within their own section using buttons", async () => {
  const reorder = vi
    .fn<(section: "engineering" | "hobby", ids: string[]) => Promise<void>>()
    .mockResolvedValue();
  render(
    <PortfolioList
      load={() =>
        Promise.resolve([
          { id: "1", name: "First", section: "engineering" },
          { id: "2", name: "Second", section: "engineering" },
          { id: "3", name: "Hobby", section: "hobby" },
        ])
      }
      reorder={reorder}
    />,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Second を上へ" }));
  expect(reorder).toHaveBeenCalledWith("engineering", ["2", "1"]);
  const items = within(screen.getByRole("list", { name: "作品一覧" })).getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("Second");
  expect(items[1]).toHaveTextContent("First");
  expect(items[2]).toHaveTextContent("Hobby");
});

test("announces a successful reorder and clears it on failure", async () => {
  const reorder = vi
    .fn<(section: "engineering" | "hobby", ids: string[]) => Promise<void>>()
    .mockResolvedValueOnce()
    .mockRejectedValueOnce(new Error("offline"));
  render(
    <PortfolioList
      load={() =>
        Promise.resolve([
          { id: "1", name: "First", section: "hobby" },
          { id: "2", name: "Second", section: "hobby" },
        ])
      }
      reorder={reorder}
    />,
  );
  const status = screen.getByRole("status");
  await userEvent.click(await screen.findByRole("button", { name: "Second を上へ" }));
  expect(status).toHaveTextContent("Second の順序を変更しました");
  await userEvent.click(screen.getByRole("button", { name: "Second を下へ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("並べ替えできませんでした");
  expect(status).toBeEmptyDOMElement();
});

test("retains the order when the reorder request fails", async () => {
  render(
    <PortfolioList
      load={() =>
        Promise.resolve([
          { id: "1", name: "First", section: "hobby" },
          { id: "2", name: "Second", section: "hobby" },
        ])
      }
      reorder={() => Promise.reject(new Error("offline"))}
    />,
  );
  await userEvent.click(await screen.findByRole("button", { name: "Second を上へ" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("並べ替えできませんでした");
  const items = within(screen.getByRole("list", { name: "作品一覧" })).getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("First");
  expect(items[1]).toHaveTextContent("Second");
});
