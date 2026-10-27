import { RouterProvider } from "@tanstack/react-router";
import { createAppRouter } from "./router/router";
import "./styles.css";

const router = createAppRouter();

export const App = () => <RouterProvider router={router} />;
