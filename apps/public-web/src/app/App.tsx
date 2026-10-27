import { RouterProvider } from "@tanstack/react-router";
import { PublicQueryProvider } from "../providers/PublicQueryProvider";
import { createAppRouter } from "./router/router";
import "./styles.css";

const router = createAppRouter();

export const App = () => (
  <PublicQueryProvider>
    <RouterProvider router={router} />
  </PublicQueryProvider>
);
