import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryState } from "./QueryState";

const meta = {
  title: "Public/QueryState",
  component: QueryState,
  args: {
    children: "公開データ",
    query: { status: "success", fetchStatus: "idle", refetch: () => Promise.resolve() },
  },
} satisfies Meta<typeof QueryState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Success: Story = {};
export const Loading: Story = {
  args: { query: { ...meta.args.query, status: "pending", fetchStatus: "fetching" } },
};
export const Waiting: Story = {
  args: { query: { ...meta.args.query, status: "pending", fetchStatus: "paused" } },
};
export const Error: Story = { args: { query: { ...meta.args.query, status: "error" } } };
export const Retrying: Story = {
  args: { query: { ...meta.args.query, status: "error", fetchStatus: "fetching" } },
};
export const Refreshing: Story = {
  args: { query: { ...meta.args.query, fetchStatus: "fetching" } },
};
