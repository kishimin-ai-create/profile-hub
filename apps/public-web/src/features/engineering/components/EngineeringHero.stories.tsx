import type { Meta, StoryObj } from "@storybook/react-vite";
import { EngineeringHero } from "./EngineeringHero";

const meta = { title: "Public/EngineeringHero", component: EngineeringHero } satisfies Meta<
  typeof EngineeringHero
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
