import { createRootRoute, createRoute, createRouter, Link } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { PublicProfile } from "../../components/PublicProfile";
import { ErrorState, LoadingState } from "../../components/QueryState";
import { SectionProjects } from "../../components/SectionProjects";
import { EngineeringHero } from "../../features/engineering/components/EngineeringHero";
import { EngineeringContact } from "../../features/engineering/EngineeringContact";
import { EngineeringSkills } from "../../features/engineering/EngineeringSkills";
import { HobbyHero } from "../../features/hobby/components/HobbyHero";
import { HobbyContact } from "../../features/hobby/HobbyContact";
import { HobbyFavourites } from "../../features/hobby/HobbyFavourites";
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
      <PublicProfile />
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
  component: () => (
    <>
      <EngineeringHero />
      <section className={"engineering-profile"}>
        <h2>{"自己紹介"}</h2>
        <PublicProfile />
      </section>
      <EngineeringSkills />
      <SectionProjects section={"engineering"} />
      <Link to={"/engineering/contact"}>{"仕事について連絡する"}</Link>
    </>
  ),
});

const engineeringContactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/engineering/contact",
  component: EngineeringContact,
});

const hobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hobby",
  component: () => (
    <>
      <HobbyHero />
      <HobbyFavourites />
      <SectionProjects section={"hobby"} />
      <Link to={"/hobby/contact"}>{"趣味について連絡する"}</Link>
    </>
  ),
});

const hobbyContactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hobby/contact",
  component: HobbyContact,
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
