import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { createAuthorizedRequest } from "../../api/authorized-request";
import { createBrowserSession } from "../../auth/browser-session";
import { Dashboard } from "../../auth/dashboard";
import { LoginPage } from "../../auth/login-page";
import { PortfolioCreate } from "../../portfolio/portfolio-create";
import { PortfolioPage } from "../../portfolio/portfolio-page";

type RouteSession = {
  accessToken: () => string | null;
  restore: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
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
    typeof session.accessToken === "function" &&
    "logout" in session &&
    typeof session.logout === "function"
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
  component: () => (
    <>
      <nav aria-label={"管理メニュー"}>
        <Link to={"/dashboard"}>{"Dashboard"}</Link>
        <Link to={"/portfolio"}>{"Portfolio"}</Link>
        <Link to={"/profile"}>{"Profile"}</Link>
        <Link to={"/hobby"}>{"Hobby"}</Link>
      </nav>
      <Outlet />
    </>
  ),
  beforeLoad: async ({ context }) => {
    if (!context.session.accessToken() && !(await context.session.restore())) {
      redirect({ to: "/login", throw: true });
    }
  },
});
const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/dashboard",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    const navigate = dashboardRoute.useNavigate();
    return (
      <Dashboard
        logout={context.session.logout}
        onSuccess={() => {
          void navigate({ to: "/login" });
        }}
      />
    );
  },
});
const portfolioRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/portfolio",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    return (
      <>
        <Link to={"/portfolio/new"}>{"作品を作成"}</Link>
        <PortfolioPage session={context.session} />
      </>
    );
  },
});
const portfolioNewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/portfolio/new",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    const navigate = portfolioNewRoute.useNavigate();
    const request = createAuthorizedRequest(context.session);
    return (
      <PortfolioCreate
        save={async (data) => {
          await request({ method: "POST", url: "/api/admin/portfolio", data });
        }}
        onSuccess={() => {
          void navigate({ to: "/portfolio" });
        }}
      />
    );
  },
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
