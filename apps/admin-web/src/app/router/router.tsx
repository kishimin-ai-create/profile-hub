import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { createBrowserSession } from "../../auth/browser-session";

type RouteSession = { accessToken: () => string | null; restore: () => Promise<boolean> };
const rootRoute = createRootRouteWithContext<{ session: RouteSession }>()({
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
  beforeLoad: () => {
    redirect({ to: "/login", throw: true });
  },
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => <h1>{"ログイン"}</h1>,
});
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: async ({ context }) => {
    if (!context.session.accessToken() && !(await context.session.restore())) {
      redirect({ to: "/login", throw: true });
    }
  },
});
const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/dashboard",
});
const portfolioRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/portfolio",
});
const portfolioNewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/portfolio/new",
});
const portfolioDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/portfolio/$id",
});
const profileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile",
});
const hobbyRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/hobby",
});
const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  protectedRoute.addChildren([
    dashboardRoute,
    portfolioRoute,
    portfolioNewRoute,
    portfolioDetailRoute,
    profileRoute,
    hobbyRoute,
  ]),
]);

export const createAdminRouter = (
  history?: RouterHistory,
  session: RouteSession = createBrowserSession(),
) => createRouter({ routeTree, history, context: { session } });
