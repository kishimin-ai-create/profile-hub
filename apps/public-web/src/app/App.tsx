import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./router/router";

const router = createAppRouter();

export const App = () => <RouterProvider router={router} />;
