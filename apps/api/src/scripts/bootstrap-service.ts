export type BootstrapResult = { exitCode: 0 | 1; message: string };

/** Provisions an account while keeping credential-bearing errors private. */
export async function runBootstrap(
  email: string,
  password: string,
  provision: (email: string, password: string) => Promise<boolean>,
): Promise<BootstrapResult> {
  try {
    const created = await provision(email, password);
    return created
      ? { exitCode: 0, message: "Administrator created" }
      : { exitCode: 1, message: "Administrator already exists" };
  } catch {
    return { exitCode: 1, message: "Administrator provisioning failed" };
  }
}
