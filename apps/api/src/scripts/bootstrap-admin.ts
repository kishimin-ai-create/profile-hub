import { provisionAdministrator } from "../infrastructures/db/admin-bootstrap";
import { getDatabase } from "../infrastructures/db/database";
import { type BootstrapResult, runBootstrap } from "./bootstrap-service";

async function readPassword(): Promise<string> {
  const reader = Bun.stdin.stream().getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let total = 0;
  let password = "";
  let chunk = await reader.read();
  while (!chunk.done) {
    total += chunk.value.byteLength;
    if (total > 4096) throw new Error("Input too large");
    password += decoder.decode(chunk.value, { stream: true });
    chunk = await reader.read();
  }
  return password + decoder.decode();
}

if (import.meta.main) {
  let result: BootstrapResult;
  try {
    const password = await readPassword();
    const database = getDatabase();
    try {
      result = await runBootstrap(process.env["ADMIN_EMAIL"] ?? "", password, (email, value) =>
        provisionAdministrator(database, email, value),
      );
    } finally {
      await database.$client.end();
    }
  } catch {
    result = { exitCode: 1, message: "Administrator provisioning failed" };
  }
  (result.exitCode === 0 ? process.stdout : process.stderr).write(`${result.message}\n`);
  process.exitCode = result.exitCode;
}
