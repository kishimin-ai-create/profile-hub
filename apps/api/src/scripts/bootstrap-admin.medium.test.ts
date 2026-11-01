import { expect, test } from "bun:test";
import { Client } from "pg";

import { verifyPassword } from "../auth/password";

const databaseUrl = process.env["TEST_DATABASE_URL"];

test.skipIf(!databaseUrl && process.env["REQUIRE_TEST_DATABASE"] !== "1")(
  "bootstrap command reads a password from stdin and refuses a second administrator",
  async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    const schema = `bootstrap_${crypto.randomUUID().replaceAll("-", "")}`;
    const password = "bootstrap-test-passphrase\n";
    let schemaCreated = false;
    try {
      await client.query(`CREATE SCHEMA "${schema}"`);
      schemaCreated = true;
      await client.query(`CREATE TABLE "${schema}".users (LIKE public.users INCLUDING ALL)`);
      const connection = new URL(databaseUrl);
      connection.searchParams.set("options", `-c search_path=${schema}`);
      const run = async (input: string) => {
        const child = Bun.spawn({
          cmd: [process.execPath, "run", "src/scripts/bootstrap-admin.ts"],
          env: {
            ...process.env,
            DATABASE_URL: connection.toString(),
            ADMIN_EMAIL: "owner@example.com",
          },
          stdin: "pipe",
          stdout: "pipe",
          stderr: "pipe",
        });
        await child.stdin.write(input);
        await child.stdin.end();
        const stdout = await new Response(child.stdout).text();
        const stderr = await new Response(child.stderr).text();
        return { exitCode: await child.exited, stdout, stderr };
      };
      const first = await run(password);
      expect(first.exitCode).toBe(0);
      expect(first.stdout).toContain("Administrator created");
      expect(first.stdout + first.stderr).not.toContain(password);
      const rows = await client.query<{ email: string; password_hash: string }>(
        `SELECT email, password_hash FROM "${schema}".users`,
      );
      expect(rows.rows).toHaveLength(1);
      expect(rows.rows[0].email).toBe("owner@example.com");
      expect(await verifyPassword(password, rows.rows[0].password_hash)).toBe(true);
      const second = await run(password);
      expect(second.exitCode).toBe(1);
      expect(second.stderr).toContain("Administrator already exists");
      expect(second.stdout + second.stderr).not.toContain(password);
      const oversized = await run("x".repeat(4097));
      expect(oversized.exitCode).toBe(1);
      expect(oversized.stderr).toContain("Administrator provisioning failed");
    } finally {
      if (schemaCreated) await client.query(`DROP SCHEMA "${schema}" CASCADE`);
      await client.end();
    }
  },
);
