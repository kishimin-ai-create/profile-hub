import type { Meta, StoryObj } from "@storybook/react-vite";
import { HobbyHero } from "./HobbyHero";

const meta = { title: "Public/HobbyHero", component: HobbyHero } satisfies Meta<typeof HobbyHero>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
