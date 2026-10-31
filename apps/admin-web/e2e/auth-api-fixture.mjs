import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { issueSessionTokens } from "../../api/src/auth/session-tokens.ts";
import { createApp } from "../../api/src/index.ts";

const secret = "test-only-signing-secret-with-at-least-32-bytes";
const state = { version: 0 };
const origin = "https://localhost:43112";
const app = createApp({
  adminOrigin: origin,
  allowedOrigins: [origin],
  adminSecret: secret,
  listFavourites: () => Promise.resolve([]),
  listPortfolios: () => Promise.resolve([]),
  getPublicProfile: () =>
    Promise.resolve({ profile: null, skills: [], links: { engineering: [], hobby: [] } }),
  loginAdmin: async (email, password) => {
    if (email !== "admin@example.test" || password !== "test-only-password")
      return { status: "invalid" };
    state.version += 1;
    return { status: "success", tokens: await issueSessionTokens("42", state.version, secret) };
  },
  findAdminSessionVersion: (id) => Promise.resolve(id === "42" ? state.version : null),
  revokeAdminSession: (id, version) => {
    if (id !== "42" || version !== state.version) return Promise.resolve(false);
    state.version += 1;
    return Promise.resolve(true);
  },
  logRequest: () => {},
});

const directory = mkdtempSync(join(tmpdir(), "profile-hub-auth-e2e-"));
const keyPath = join(directory, "key.pem");
const certPath = join(directory, "cert.pem");
const configPath = join(directory, "openssl.cnf");
const { key, cert } = (() => {
  try {
    writeFileSync(configPath, "[req]\ndistinguished_name=dn\n[dn]\n");
    const generated = spawnSync(
      "openssl",
      [
        "req",
        "-config",
        configPath,
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-subj",
        "/CN=localhost",
        "-days",
        "1",
        "-addext",
        "subjectAltName=DNS:localhost",
      ],
      { encoding: "utf8" },
    );
    if (generated.status !== 0)
      throw new Error(
        `Unable to generate local test certificate: ${generated.error?.message ?? generated.stderr}`,
      );
    return { key: readFileSync(keyPath), cert: readFileSync(certPath) };
  } finally {
    if (existsSync(keyPath)) unlinkSync(keyPath);
    if (existsSync(certPath)) unlinkSync(certPath);
    if (existsSync(configPath)) unlinkSync(configPath);
    rmdirSync(directory);
  }
})();
Bun.serve({ hostname: "localhost", port: 43113, tls: { key, cert }, fetch: app.fetch });
const frontend = spawn("node", ["e2e/auth-frontend.mjs"], {
  stdio: ["pipe", "inherit", "inherit"],
  windowsHide: true,
  env: { ...process.env, VITE_API_URL: "https://localhost:43113" },
});
frontend.stdin.end(JSON.stringify({ key: key.toString("utf8"), cert: cert.toString("utf8") }));
frontend.on("exit", (code) => process.exit(code ?? 1));
process.on("SIGINT", () => {
  frontend.kill();
  process.exit(0);
});
process.on("SIGTERM", () => {
  frontend.kill();
  process.exit(0);
});
