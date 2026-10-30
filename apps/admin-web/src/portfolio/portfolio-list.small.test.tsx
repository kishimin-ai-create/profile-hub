import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
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
