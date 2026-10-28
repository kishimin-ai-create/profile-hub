import { type SessionClaims, type TokenKind, verifyToken } from "./token";

/** Rejects sessions when the administrator no longer has the token's version. */
export async function authenticateSession(
  token: string,
  kind: TokenKind,
  secret: string,
  findVersion: (id: string) => Promise<number | null>,
): Promise<SessionClaims | null> {
  const claims = await verifyToken(token, kind, secret);
  if (!claims || (await findVersion(claims.sub)) !== claims.version) {
    return null;
  }
  return claims;
}
