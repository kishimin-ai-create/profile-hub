import { publicPaths } from "../app/router/public-paths";

const parseOrigin = (origin: string): string => {
  const url = new URL(origin);
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("SITE_ORIGIN must be an HTTP(S) origin");
  return url.origin;
};

export const generateRobots = (origin: string): string =>
  `User-agent: *\nAllow: /\nSitemap: ${parseOrigin(origin)}/sitemap.xml\n`;

export const canonicalForPath = (origin: string, pathname: string): string | undefined => {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const path = publicPaths.find((candidate) => candidate === normalized);
  if (!origin || !path) return undefined;
  return `${parseOrigin(origin)}${path}`;
};

export const generateSitemap = (origin: string): string => {
  const site = parseOrigin(origin);
  const entries = publicPaths.map((path) => `  <url><loc>${site}${path}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
};
