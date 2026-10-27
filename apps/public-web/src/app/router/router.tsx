import { createRootRoute, createRoute, createRouter, Link } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { ErrorState, LoadingState } from "../../components/QueryState";
import { EngineeringHero } from "../../features/engineering/components/EngineeringHero";
import { HobbyHero } from "../../features/hobby/components/HobbyHero";
import { SiteLayout } from "./SiteLayout";

const rootRoute = createRootRoute({
  component: SiteLayout,
  notFoundComponent: () => <h1>{"ページが見つかりません"}</h1>,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <>
      <h1>{"Home"}</h1>
      <nav aria-label={"セクション"}>
        <ul>
          <li>
            <Link to={"/engineering"}>{"Engineering"}</Link>
          </li>
          <li>
            <Link to={"/hobby"}>{"Hobby"}</Link>
          </li>
        </ul>
      </nav>
    </>
  ),
});

const engineeringRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engineering",
  component: EngineeringHero,
});

const engineeringContactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engineering/contact",
  component: () => <h1>{"Engineering Contact"}</h1>,
});

const hobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hobby",
  component: HobbyHero,
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

export const createAppRouter = (history?: RouterHistory) =>
  createRouter({
    routeTree,
    history,
    defaultPendingComponent: LoadingState,
    defaultErrorComponent: ({ reset }) => <ErrorState onRetry={reset} />,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
