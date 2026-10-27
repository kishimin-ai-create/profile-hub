import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <main>
      <Outlet />
    </main>
  ),
  notFoundComponent: () => <h1>{"ページが見つかりません"}</h1>,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <h1>{"Home"}</h1>,
});

const engineeringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engineering",
  component: () => <h1>{"Engineering"}</h1>,
});

const engineeringContactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engineering/contact",
  component: () => <h1>{"Engineering Contact"}</h1>,
});

const hobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hobby",
  component: () => <h1>{"Hobby"}</h1>,
});

const hobbyContactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hobby/contact",
  component: () => <h1>{"Hobby Contact"}</h1>,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  engineeringRoute,
  engineeringContactRoute,
  hobbyRoute,
  hobbyContactRoute,
]);

export const createAppRouter = (history?: RouterHistory) => createRouter({ routeTree, history });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
