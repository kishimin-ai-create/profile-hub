import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const sitemap = readFileSync(new URL("../dist/sitemap.xml", import.meta.url), "utf8");
const robots = readFileSync(new URL("../dist/robots.txt", import.meta.url), "utf8");
const expected = ["/", "/engineering", "/engineering/contact", "/hobby", "/hobby/contact"];
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(urls, expected.map((path) => `https://example.test${path}`));
assert.match(robots, /^Sitemap: https:\/\/example\.test\/sitemap\.xml$/m);
