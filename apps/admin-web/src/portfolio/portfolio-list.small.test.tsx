import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { PortfolioList } from "./portfolio-list";

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

test("reorders entries within their own section using buttons", async () => {
  const reorder = vi.fn<(section: "engineering" | "hobby", ids: string[]) => Promise<void>>().mockResolvedValue();
  render(<PortfolioList load={() => Promise.resolve([{ id: "1", name: "First", section: "engineering" }, { id: "2", name: "Second", section: "engineering" }, { id: "3", name: "Hobby", section: "hobby" }])} reorder={reorder} />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Second を上へ" }));
  expect(reorder).toHaveBeenCalledWith("engineering", ["2", "1"]);
  const items = within(screen.getByRole("list", { name: "作品一覧" })).getAllByRole("listitem");
  expect(items.map((item) => within(item).getByText(/^(First|Second|Hobby)$/).textContent)).toEqual(["Second", "First", "Hobby"]);
});
