import { issueToken } from "./token";

/** Issues access and refresh tokens for the same administrator session. */
export async function issueSessionTokens(
  id: string,
  version: number,
  secret: string,
  authenticationTime = Math.floor(Date.now() / 1000),
) {
  const [accessToken, refreshToken] = await Promise.all([
    issueToken(id, version, "access", secret, authenticationTime),
    issueToken(id, version, "refresh", secret, authenticationTime),
  ]);
  return { accessToken, refreshToken };
}
