import { readFileSync } from "node:fs";
import { createServer } from "vite";

const { key, cert } = JSON.parse(readFileSync(0, "utf8"));
const server = await createServer({
  server: { host: "localhost", port: 43112, strictPort: true, https: { key, cert } },
});
await server.listen();
