import { issueToken } from "./token";

/** Issues access and refresh tokens for the same administrator session. */
export async function issueSessionTokens(id: string, version: number, secret: string) {
  const [accessToken, refreshToken] = await Promise.all([
    issueToken(id, version, "access", secret),
    issueToken(id, version, "refresh", secret),
  ]);
  return { accessToken, refreshToken };
}
