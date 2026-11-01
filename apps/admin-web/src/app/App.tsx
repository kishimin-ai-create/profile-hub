import { RouterProvider } from "@tanstack/react-router";
import { createAdminRouter } from "./router/router";

const router = createAdminRouter();

export const App = () => <RouterProvider router={router} />;
