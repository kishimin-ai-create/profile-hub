import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { PageMetadata } from "../../components/PageMetadata";
import { metadataForPath } from "./page-metadata";

export const SiteLayout = () => {
  const pathname = useLocation({ select: (location) => location.pathname });
  const previousPath = useRef(pathname);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    // Initial loads keep native focus so the skip link remains the first keyboard stop.
    if (previousPath.current !== pathname) {
      mainRef.current?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname]);
  const isEngineering = pathname === "/engineering" || pathname.startsWith("/engineering/");
  const isHobby = pathname === "/hobby" || pathname.startsWith("/hobby/");

  return (
    <div className={"site-shell"}>
      <PageMetadata {...metadataForPath(pathname)} />
      <a className={"skip-link"} href={"#main-content"}>
        {"本文へ移動"}
      </a>
      <header className={"site-header"}>
        <Link className={"site-logo"} to={"/"}>
          {"profile-hub"}
        </Link>
        {isEngineering && (
          <nav aria-label={"メインナビゲーション"}>
            <Link to={"/engineering"} activeOptions={{ exact: true }}>
              {"Engineering"}
            </Link>
            <Link to={"/engineering/contact"}>{"Contact"}</Link>
          </nav>
        )}
        {isHobby && (
          <nav aria-label={"メインナビゲーション"}>
            <Link to={"/hobby"} activeOptions={{ exact: true }}>
              {"Hobby"}
            </Link>
            <Link to={"/hobby/contact"}>{"Contact"}</Link>
          </nav>
        )}
      </header>
      <main id={"main-content"} tabIndex={-1} ref={mainRef}>
        <Outlet />
      </main>
      <footer className={"site-footer"}>
        <p>{"© kishimin 2026"}</p>
      </footer>
    </div>
  );
};
