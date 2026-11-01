import { authenticateSession } from "./session";
import { issueSessionTokens } from "./session-tokens";

/** Rotates a current refresh session before issuing replacement tokens. */
export async function refreshSession(
  token: string,
  secret: string,
  findVersion: (id: string) => Promise<number | null>,
  advance: (id: string, version: number) => Promise<boolean>,
) {
  const session = await authenticateSession(token, "refresh", secret, findVersion);
  if (!session || !(await advance(session.sub, session.version))) return null;
  return issueSessionTokens(session.sub, session.version + 1, secret, session.authTime);
}
