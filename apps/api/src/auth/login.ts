import { authenticateCredentials } from "./credentials";
import { issueSessionTokens } from "./session-tokens";

type LoginDependencies = {
  consumeAttempt: () => Promise<boolean>;
  findAccount: Parameters<typeof authenticateCredentials>[2];
  verifyPassword: Parameters<typeof authenticateCredentials>[3];
  advanceSession: (id: string, version: number) => Promise<boolean>;
  dummyHash: string;
  secret: string;
};

/** Authenticates after throttling and rotates any existing administrator session. */
export async function loginAdmin(email: string, password: string, dependencies: LoginDependencies) {
  if (!(await dependencies.consumeAttempt())) return { status: "limited" } as const;
  const identity = await authenticateCredentials(
    email,
    password,
    dependencies.findAccount,
    dependencies.verifyPassword,
    dependencies.dummyHash,
  );
  if (!identity || !(await dependencies.advanceSession(identity.id, identity.sessionVersion))) {
    return { status: "invalid" } as const;
  }
  const tokens = await issueSessionTokens(
    identity.id,
    identity.sessionVersion + 1,
    dependencies.secret,
  );
  return { status: "success", tokens } as const;
}
