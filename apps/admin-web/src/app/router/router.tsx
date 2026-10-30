import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { createBrowserSession } from "../../auth/browser-session";
import { LoginPage } from "../../auth/login-page";

type RouteSession = {
  accessToken: () => string | null;
  restore: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
};
const isRouteContext = (value: unknown): value is { session: RouteSession } => {
  if (typeof value !== "object" || value === null || !("session" in value)) return false;
  const session = value.session;
  return (
    typeof session === "object" &&
    session !== null &&
    "login" in session &&
    typeof session.login === "function" &&
    "restore" in session &&
    typeof session.restore === "function" &&
    "accessToken" in session &&
    typeof session.accessToken === "function"
  );
};
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
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    const navigate = loginRoute.useNavigate();
    return (
      <LoginPage
        login={context.session.login}
        onSuccess={() => {
          void navigate({ to: "/dashboard" });
        }}
      />
    );
  },
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
