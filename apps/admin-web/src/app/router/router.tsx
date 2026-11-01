import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { z } from "zod";
import { createBrowserSession } from "../../auth/browser-session";
import { Dashboard } from "../../auth/dashboard";
import { LoginPage } from "../../auth/login-page";
import { FavouriteCreatePage } from "../../favourites/favourite-create-page";
import { FavouriteEditPage } from "../../favourites/favourite-edit-page";
import { FavouritePage } from "../../favourites/favourite-page";
import { PortfolioCreatePage } from "../../portfolio/portfolio-create-page";
import { PortfolioEditPage } from "../../portfolio/portfolio-edit-page";
import { PortfolioPage } from "../../portfolio/portfolio-page";
import { ProfileEditPage } from "../../profile/profile-edit-page";
import { ProfilePage } from "../../profile/profile-page";
import { SkillCreatePage } from "../../profile/skill-create-page";
import { SkillEditPage } from "../../profile/skill-edit-page";
import { SkillList } from "../../profile/skill-list";
import { SocialLinkFormPage } from "../../profile/social-link-form-page";
import { SocialLinkList } from "../../profile/social-link-list";

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
        <PortfolioPage
          session={context.session}
          renderEdit={(row) => (
            <Link to={"/portfolio/$id"} params={{ id: row.id }}>{`${row.name} を編集`}</Link>
          )}
        />
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
    return (
      <PortfolioCreatePage
        session={context.session}
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
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    const params: unknown = portfolioDetailRoute.useParams();
    const result = z.object({ id: z.string() }).safeParse(params);
    const navigate = portfolioDetailRoute.useNavigate();
    if (!isRouteContext(context) || !result.success) throw new Error("Missing portfolio context");
    return (
      <PortfolioEditPage
        key={result.data.id}
        id={result.data.id}
        session={context.session}
        onSuccess={() => {
          void navigate({ to: "/portfolio" });
        }}
      />
    );
  },
});
const profileRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    return (
      <>
        <Link to={"/profile/edit"}>{"プロフィールを編集"}</Link>
        <ProfilePage session={context.session} />
        <Link to={"/profile/skills/new"}>{"スキルを作成"}</Link>
        <SkillList
          session={context.session}
          renderEdit={(skill) => (
            <Link
              to={"/profile/skills/$id/edit"}
              params={{ id: skill.id }}
            >{`${skill.name} を編集`}</Link>
          )}
        />
        <Link to={"/profile/links/new"}>{"リンクを作成"}</Link>
        <SocialLinkList session={context.session} />
      </>
    );
  },
});
const profileEditRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile/edit",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    const navigate = profileEditRoute.useNavigate();
    return (
      <ProfileEditPage
        session={context.session}
        onSuccess={() => {
          void navigate({ to: "/profile" });
        }}
      />
    );
  },
});
const skillNewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile/skills/new",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    const navigate = skillNewRoute.useNavigate();
    return (
      <SkillCreatePage
        session={context.session}
        onSuccess={() => {
          void navigate({ to: "/profile" });
        }}
      />
    );
  },
});
const skillEditRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile/skills/$id/edit",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    const params: unknown = skillEditRoute.useParams();
    const result = z.object({ id: z.string() }).safeParse(params);
    const navigate = skillEditRoute.useNavigate();
    if (!isRouteContext(context) || !result.success) throw new Error("Missing skill context");
    return (
      <SkillEditPage
        key={result.data.id}
        session={context.session}
        id={result.data.id}
        onSuccess={() => {
          void navigate({ to: "/profile" });
        }}
      />
    );
  },
});
const socialLinkNewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/profile/links/new",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    const navigate = socialLinkNewRoute.useNavigate();
    return (
      <SocialLinkFormPage
        session={context.session}
        onSuccess={() => {
          void navigate({ to: "/profile" });
        }}
      />
    );
  },
});
const hobbyRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/hobby",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    return (
      <>
        <Link to={"/hobby/new"}>{"お気に入りを作成"}</Link>
        <FavouritePage
          session={context.session}
          renderEdit={(row) => (
            <Link to={"/hobby/$id/edit"} params={{ id: row.id }}>{`${row.name} を編集`}</Link>
          )}
        />
      </>
    );
  },
});
const hobbyNewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/hobby/new",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    if (!isRouteContext(context)) throw new Error("Missing session context");
    const navigate = hobbyNewRoute.useNavigate();
    return (
      <FavouriteCreatePage
        session={context.session}
        onSuccess={() => {
          void navigate({ to: "/hobby" });
        }}
      />
    );
  },
});
const hobbyEditRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/hobby/$id/edit",
  component: () => {
    const context: unknown = rootRoute.useRouteContext();
    const params: unknown = hobbyEditRoute.useParams();
    const result = z.object({ id: z.string() }).safeParse(params);
    const navigate = hobbyEditRoute.useNavigate();
    if (!isRouteContext(context) || !result.success) throw new Error("Missing favourite context");
    return (
      <FavouriteEditPage
        key={result.data.id}
        session={context.session}
        id={result.data.id}
        onSuccess={() => {
          void navigate({ to: "/hobby" });
        }}
      />
    );
  },
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
    profileEditRoute,
    skillNewRoute,
    skillEditRoute,
    socialLinkNewRoute,
    hobbyRoute,
    hobbyNewRoute,
    hobbyEditRoute,
  ]),
]);

export const createAdminRouter = (
  history?: RouterHistory,
  session: RouteSession = createBrowserSession(),
) => createRouter({ routeTree, history, context: { session } });
